# SportLink Mobile

React Native mobile app for SportLink — athlete networking platform.

## Prerequisites

1. **Node.js 18+** — install via [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org)
2. **JDK 17** — required for Android builds (JDK 21 has a known bug with AGP 8.1)
   ```bash
   brew install openjdk@17
   ```
3. **Android Studio** — download from [developer.android.com](https://developer.android.com/studio)
   - During setup, install: Android SDK, Android SDK Platform-Tools, Android Emulator
   - Open SDK Manager → SDK Platforms → install **Android 14 (API 34)**
   - Open SDK Manager → SDK Tools → install **Android SDK Build-Tools 36.1.0**
4. **Bun** (for the backend) — install from [bun.sh](https://bun.sh)

## Environment Variables

Add these to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
```

Then reload:
```bash
source ~/.zshrc
```

## Create an Android Emulator

1. Open Android Studio → **Device Manager** (right sidebar or Tools → Device Manager)
2. Click **Create Virtual Device**
3. Choose a phone (e.g., Pixel 7, Medium Phone)
4. Select system image: **API 34** (download if needed)
5. Finish and name your device

## Running the App (Android Emulator)

You need **3 terminals** running simultaneously:

### Terminal 1: Start the Backend

```bash
cd ~/Desktop/sportlink/backend
~/.bun/bin/bun run src/index.ts
```

Backend runs on `http://localhost:3000`.

### Terminal 2: Start Metro Bundler

```bash
cd ~/Desktop/sportlink/SportLinkMobile
npx react-native start
```

Metro runs on port 8081. Press `R` to reload the app at any time.

### Terminal 3: Build & Install on Emulator

```bash
cd ~/Desktop/sportlink/SportLinkMobile
npx react-native run-android
```

This will:
- Boot the emulator (if not already running)
- Build the Android app
- Install the APK on the emulator
- Connect to Metro for hot reload

The app uses `10.0.2.2:3000` to reach the host machine's localhost from the emulator.

## Running on a Physical Device

1. Enable **USB Debugging** on your phone:
   - Settings → About Phone → tap "Build Number" 7 times
   - Settings → Developer Options → enable USB Debugging
2. Connect via USB and accept the debugging prompt on the phone
3. Verify the device is detected:
   ```bash
   adb devices
   ```
4. Update the API base URL in `src/api/client.ts`:
   - Replace `10.0.2.2` with your Mac's local IP (find it with `ipconfig getifaddr en0`)
   - Both your phone and Mac must be on the same WiFi network
5. Run:
   ```bash
   npx react-native run-android
   ```

If both emulator and physical device are connected, specify the target:
```bash
npx react-native run-android --deviceId <device-id-from-adb-devices>
```

## Troubleshooting

### Build fails with JDK error
Make sure `JAVA_HOME` points to JDK 17, not 21:
```bash
java -version  # should show 17.x
```

### Metro port 8081 already in use
```bash
lsof -i :8081
kill -9 <PID>
```

### Gradle cache issues
```bash
cd android && ./gradlew clean && cd ..
rm -rf ~/.gradle/caches/transforms-3/
```

### Network requests failing on emulator
- Ensure backend is running on port 3000
- The emulator uses `10.0.2.2` to reach host localhost (already configured in `src/api/client.ts`)

### Network requests failing on physical device
- Update `BASE_URL` in `src/api/client.ts` to your Mac's WiFi IP
- Ensure both devices are on the same network

## Project Structure

```
SportLinkMobile/
├── android/              ← Android native project
├── ios/                  ← iOS native project (not configured yet)
├── src/
│   ├── api/              ← API client & endpoint modules
│   ├── components/       ← Reusable UI components
│   ├── hooks/            ← Custom React hooks
│   ├── lib/              ← Utility functions
│   ├── navigation/       ← React Navigation setup
│   ├── screens/          ← Screen components
│   ├── stores/           ← Zustand state stores
│   ├── theme/            ← Colors, spacing, typography tokens
│   ├── types/            ← TypeScript type definitions
│   └── App.tsx           ← Root component
├── index.js              ← Entry point
└── package.json
```

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React Native 0.73.6 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v6 |
| State | Zustand 4.x |
| Server state | TanStack Query v5 |
| Storage | AsyncStorage |
