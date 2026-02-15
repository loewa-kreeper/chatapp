# Welcome to your Expo app

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## LAN two-person video prototype

This repo now includes a minimal two-person video call screen using WebRTC and a local signaling server.

### Important

- This does **not** run in Expo Go because `react-native-webrtc` requires native modules.
- Use a development build (`expo run:android` / `expo run:ios`) on both devices.
- Both phones and your computer must be on the same Wi-Fi.

### 1. Install dependencies

```bash
npm install
```

### 2. Start signaling server on your computer

```bash
npm run signaling:start
```

### 3. Find your computer local IP

Windows:

```bash
ipconfig
```

Use the IPv4 address from your active Wi-Fi adapter, example `192.168.1.100`.

### 4. Build and run app on devices

```bash
npm run android
```

(or `npm run ios` on macOS)

### 5. In both phones, set the same values

- Server URL: `ws://YOUR_COMPUTER_IP:3001`
- Room ID: any shared value, e.g. `family-room`

Press **Connect** on both devices.

## Basic controls

- Mic toggle
- Camera toggle
- Flip camera
- Disconnect

## Notes

- This is a local-network prototype for exactly 2 people per room.
- If a third person joins the same room, they will be rejected.
- For internet-wide calling, you will need TURN + hosted signaling/API.
