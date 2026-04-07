# NutriCore AI Mobile Integration

This folder contains a starter React Native integration for the in-app PDF guide.

Included:

- `src/screens/GuideCenterScreen.tsx`
- `src/services/guideService.ts`
- `src/config/appConfig.ts`

Main capabilities:

- open the NutriCore AI guide PDF inside the app
- share the PDF to WhatsApp or email using the native share sheet
- print the PDF from the device
- keep the guide reachable from `Profile` or `Help Center`

Suggested dependencies:

- `react-native-pdf`
- `react-native-share`
- `react-native-print`

If using Expo:

- `expo-print`
- `expo-sharing`
- `expo-file-system`
