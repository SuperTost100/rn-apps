#!/usr/bin/env bash
# Builds a private iPhone test build of the students app: the `Test`
# configuration, which installs next to the official app as
# com.supertost100.studentstest, is called "Students test", says in the app
# that it is unofficial, never offers an update, sends nothing to Sentry and
# has no push notifications.
#
# Usage, from anywhere in the repo, on a Mac with Xcode and the pods
# installed (cd students/ios && pod install):
#   BUILD_NO=2 tools/scripts/build-test-ios.sh
#
# Settings, all optional except BUILD_NO:
#   BUILD_NO      the test build number, 1 to 99; raise it for each new build
#   TEST_VERSION  the official version the build is based on (1.9.5)
#   ENV_FILE      the env file read at bundle time, relative to students/
#                 (.env.test). Without API_BASE_PATH in it the app talks to
#                 the real server, https://app.didattica.polito.it/api.
#                 The local .env is not read.
#   DEVICE_ID     an iPhone paired with this Mac (xcrun devicectl list
#                 devices): the build is installed on it at the end
#
# Signing: automatic, with the development team set in the Test
# configuration. -allowProvisioningUpdates lets xcodebuild create the
# profile and register the iPhone named in DEVICE_ID.
#
# The archive and the signed app land in students/ios/build/test/.
set -euo pipefail

: "${BUILD_NO:?Set BUILD_NO, the test build number (1 to 99)}"
TEST_VERSION="${TEST_VERSION:-1.9.5}"
ENV_FILE="${ENV_FILE:-.env.test}"
DEVICE_ID="${DEVICE_ID:-}"

if ! [[ "$BUILD_NO" =~ ^[0-9]{1,2}$ ]] || ((10#$BUILD_NO < 1)); then
  echo "BUILD_NO must be a number from 1 to 99" >&2
  exit 1
fi
BUILD_NO=$((10#$BUILD_NO))
if ! [[ "$TEST_VERSION" =~ ^([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{1,2})$ ]]; then
  echo "TEST_VERSION must look like 1.9.5" >&2
  exit 1
fi
# The official scheme: 1.9.5 test 3 is 1090503, as on Android
BUILD_NUMBER=$(printf '%d%02d%02d%02d' "${BASH_REMATCH[1]}" \
  "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}" "$BUILD_NO")

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STUDENTS="$ROOT/students"
IOS="$STUDENTS/ios"
OUT="$IOS/build/test"
ARCHIVE="$OUT/students-test-$TEST_VERSION-$BUILD_NO.xcarchive"
APP="$ARCHIVE/Products/Applications/students.app"

if [[ -f "$STUDENTS/$ENV_FILE" ]]; then
  API_LINE="$(grep -E '^API_BASE_PATH=.+' "$STUDENTS/$ENV_FILE" || true)"
else
  echo "No $ENV_FILE in students/: building with the defaults"
  API_LINE=""
fi
EXPECTED_API="${API_LINE#API_BASE_PATH=}"
echo "API: ${EXPECTED_API:-the real server (client default)}"

# Only the env file decides: values in the shell would override it
unset API_BASE_PATH MAPBOX_TOKEN
# Expo's CLI loads .env into the environment by itself, where the babel
# plugin would find it again
export EXPO_NO_DOTENV=1
export ENV_FILE
export APP_VERSION="$TEST_VERSION"
export BUILD_NO
export SENTRY_DISABLE_AUTO_UPLOAD=true
export CI=true
# Metro caches transformed files, with the env values inlined, in TMPDIR:
# a fresh one makes sure the bundle reads the env file again
TMPDIR="$(mktemp -d)"
export TMPDIR
trap 'rm -rf "$TMPDIR"' EXIT

rm -rf "$ARCHIVE"
mkdir -p "$OUT"

cd "$IOS"
xcodebuild archive \
  -workspace students.xcworkspace \
  -scheme "students test" \
  -configuration Test \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  ${DEVICE_ID:+-allowProvisioningDeviceRegistration} \
  MARKETING_VERSION="$TEST_VERSION" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER"

BUNDLE="$APP/main.jsbundle"
if [[ -n "$EXPECTED_API" ]] && ! grep -aq "$EXPECTED_API" "$BUNDLE"; then
  echo "The bundle does not contain $EXPECTED_API: it is stale" >&2
  exit 1
fi
# A real-server build must not carry the address from the local .env
LOCAL_API="$(sed -n 's/^API_BASE_PATH=//p' "$STUDENTS/.env" 2>/dev/null || true)"
if [[ -z "$EXPECTED_API" && -n "$LOCAL_API" ]] && grep -aq "$LOCAL_API" "$BUNDLE"; then
  echo "The bundle contains $LOCAL_API from students/.env" >&2
  exit 1
fi

echo
echo "Archived $ARCHIVE"
echo "Version: $TEST_VERSION ($BUILD_NUMBER)"
codesign -dv "$APP" 2>&1 | grep -E '^(Identifier|TeamIdentifier)='

if [[ -n "$DEVICE_ID" ]]; then
  xcrun devicectl device install app --device "$DEVICE_ID" "$APP"
fi
