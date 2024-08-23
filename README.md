# JCSH Class Checker

## Environment

- Node 16.16.0
- yarn 1.22.19
- Java 17/18
- Android
  - platforms;android-31
  - build-tools;30.0.3

## Setup

### Installation

```bash
yarn
```

### Development

Reverse TCP:

```bash
adb reverse tcp:8081  tcp:8081
```

Build debug APK file:

```bash
cd android && ./gradlew assembleDebug
```

Start JS server:

```bash
yarn start
```

> Better to use a real device as emulator might encounter network error issue.

### Build release version

```bash
cd android && ./gradlew assembleRelease
```

> APK location: android/app/build/outputs/apk/release/app-release.apk
