/** Normal API calls: the time the server has to start answering */
export const API_TIMEOUT_MS = 30000;
/** Requests that send a file (multipart bodies) get much longer */
export const UPLOAD_TIMEOUT_MS = 300000;

/**
 * The server did not start answering in time. React Native's fetch has no
 * timeout of its own, so without this a request in flight when the
 * connection drops never settles and its screen stays on the skeleton.
 */
export class RequestTimeoutError extends Error {
  override name = 'RequestTimeoutError';
  constructor(readonly timeoutMs: number) {
    super(`No answer from the server within ${timeoutMs / 1000} s`);
  }
}

/**
 * True for a timeout, also when the API client wrapped it in its FetchError
 * (which keeps the original error as `cause`)
 */
export const isRequestTimeout = (error: unknown): boolean =>
  error instanceof RequestTimeoutError ||
  (error instanceof Error &&
    (error as { cause?: unknown }).cause instanceof RequestTimeoutError);

type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

/**
 * Wraps fetch with an AbortController that fires when the server has not
 * answered in time. The limit runs until the response headers arrive:
 * shortcut: a body that stops halfway is not timed, add a body timeout if
 * that shows up in practice. Native file downloads do not go through here.
 */
export const createFetchWithTimeout =
  (
    fetchImpl: Fetch = (input, init) => fetch(input, init),
    timeoutMs = API_TIMEOUT_MS,
    uploadTimeoutMs = UPLOAD_TIMEOUT_MS,
  ): Fetch =>
  (input, init = {}) => {
    const limit =
      typeof FormData !== 'undefined' && init.body instanceof FormData
        ? uploadTimeoutMs
        : timeoutMs;
    const controller = new AbortController();
    // A caller's own signal still cancels the request
    const outer = init.signal;
    if (outer?.aborted) controller.abort();
    else outer?.addEventListener('abort', () => controller.abort());

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, limit);

    return fetchImpl(input, { ...init, signal: controller.signal })
      .catch(error => {
        throw timedOut ? new RequestTimeoutError(limit) : error;
      })
      .finally(() => clearTimeout(timer));
  };

/** The fetch every API client uses */
export const fetchWithTimeout = createFetchWithTimeout();
