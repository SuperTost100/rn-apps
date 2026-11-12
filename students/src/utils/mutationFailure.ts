import { isResponseError } from '@polito/lib/core';

export interface MutationFailure {
  /**
   * No answer came back (the connection dropped or timed out): the server
   * may have done the action anyway, so the screen asks it for the state
   */
  lost: boolean;
  /** What the server said, in the app language, when it answered */
  message?: string;
}

/** Tells a refusal from the server apart from an answer that never came */
export const describeMutationFailure = async (
  error: unknown,
): Promise<MutationFailure> => {
  if (!isResponseError(error)) return { lost: true };
  try {
    const body = (await error.response.clone().json()) as {
      message?: string;
    };
    return { lost: false, message: body.message || undefined };
  } catch {
    return { lost: false };
  }
};
