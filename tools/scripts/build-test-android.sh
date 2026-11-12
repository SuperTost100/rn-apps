#!/usr/bin/env bash
# Builds a private Android test build of the students app: the `preview`
# build type, which installs next to the official app as
# it.polito.students.dev, is called "Students test", says in the app that it
# is unofficial, never offers an update and sends nothing to Sentry.
#
# Usage, from anywhere in the repo:
#   BUILD_NO=2 tools/scripts/build-test-android.sh
#
# Settings, all optional except BUILD_NO:
#   BUILD_NO      the test build number, 1 to 99; raise it for each new build
#   TEST_VERSION  the official version the build is based on (1.9.5)
#   ENV_FILE      the env file read at bundle time, relative to students/
#                 (.env.test). Without API_BASE_PATH in it the app talks to
#                 the real server, https://app.didattica.polito.it/api.
#                 The local .env is not read.
#   ABIS          the ABIs to build (arm64-v8a for phones, x86_64 for the
#                 emulator)
#
# The APK lands in students/android/app/build/outputs/apk/preview/ as
# students-test-<version>-<build>.apk.
#
# Signing: like release without a store key, the build is signed with the
# debug keystore committed in the repo. That is fine for a private test
# build, and it lets each new test build install over the previous one.
# Run one Gradle build at a time: they share the daemon and a lot of memory.
set -euo pipefail

: "${BUILD_NO:?Set BUILD_NO, the test build number (1 to 99)}"
TEST_VERSION="${TEST_VERSION:-1.9.5}"
ENV_FILE="${ENV_FILE:-.env.test}"
ABIS="${ABIS:-arm64-v8a,x86_64}"

if ! [[ "$BUILD_NO" =~ ^[0-9]{1,2}$ ]] || ((10#$BUILD_NO < 1)); then
  echo "BUILD_NO must be a number from 1 to 99" >&2
  exit 1
fi
BUILD_NO=$((10#$BUILD_NO))
if ! [[ "$TEST_VERSION" =~ ^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}$ ]]; then
  echo "TEST_VERSION must look like 1.9.5" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STUDENTS="$ROOT/students"
ANDROID="$STUDENTS/android"
BUNDLE_DIR="$ANDROID/app/build/generated/assets/createBundlePreviewJsAndAssets"
OUT_DIR="$ANDROID/app/build/outputs/apk/preview"
APK_NAME="students-test-$TEST_VERSION-$BUILD_NO.apk"

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
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
# Metro caches transformed files, with the env values inlined, in TMPDIR:
# a fresh one makes sure the bundle reads the env file again
TMPDIR="$(mktemp -d)"
export TMPDIR
trap 'rm -rf "$TMPDIR"; (cd "$ANDROID" && ./gradlew --stop >/dev/null 2>&1 || true)' EXIT

# Gradle does not see changes under lib/ and can reuse an old bundle
rm -rf "$BUNDLE_DIR" "$OUT_DIR"

cd "$ANDROID"
./gradlew assemblePreview \
  -PreactNativeArchitectures="$ABIS" \
  -PtestVersion="$TEST_VERSION" \
  -PtestBuildNo="$BUILD_NO" \
  --max-workers=3

BUNDLE="$BUNDLE_DIR/index.android.bundle"
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

APK="$(find "$OUT_DIR" -name '*.apk' | head -n 1)"
mv "$APK" "$OUT_DIR/$APK_NAME"
echo
echo "Built $OUT_DIR/$APK_NAME"
echo "Size: $(du -h "$OUT_DIR/$APK_NAME" | cut -f1)"
echo "SHA-256: $(sha256sum "$OUT_DIR/$APK_NAME" | cut -d' ' -f1)"
