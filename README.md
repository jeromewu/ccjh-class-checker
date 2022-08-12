# JCSH Class Checker

## Environment

- Node 16.16.0
- yarn 1.22.19

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
