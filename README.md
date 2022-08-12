# JCSH Class Checker

## Environment

- Node 16.16.0
- yarn 1.22.19
- Java 18
- Android
  - platforms;android-31
  - build-tools;30.0.3

## Setup

### Installation

```bash
yarn
```

### Development

```bash
yarn start
yarn run android
```

> Better to use a real device as emulator might encounter network error issue.

### Build release version

```bash
cd android && ./gradlew assembleRelease
```

> APK location: android/app/build/outputs/apk/release/app-release.apk
