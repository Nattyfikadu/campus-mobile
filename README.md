# Campus Mobile Complaint System

A React Native Expo app for submitting campus complaints with QR code location detection.

## Features

- **QR Code Scanning**: Scan QR codes placed in campus locations to automatically pre-fill the location field
- **Anonymous Complaints**: Submit complaints without authentication
- **Location Auto-Detection**: QR codes encode location data for seamless form filling
- **Mobile-First Design**: Optimized for phones and tablets

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on device/emulator:
   - For Android: `npm run android`
   - For iOS: `npm run ios` (requires macOS)
   - For web: `npm run web`

## QR Code Format

QR codes should contain either:
- A JSON object: `{"location": "cafeteria"}`
- Or just the location string: `cafeteria`

Valid locations: `cafeteria`, `dormitory`, `registrar`, `hr-office`, `faculty`, `library`, `unknown`

## Backend Integration

The app connects to the campus complaint backend API at `http://localhost:4000`. Make sure the backend server is running.

## Project Structure

```
src/
  screens/
    HomeScreen.tsx          # Main menu
    QRScannerScreen.tsx     # QR code scanner
    ComplaintFormScreen.tsx # Complaint submission form
    ThankYouScreen.tsx      # Success confirmation
    index.ts                # Screen exports
App.tsx                      # Navigation setup
```