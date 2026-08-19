#!/usr/bin/env bash
set -e

echo "=================================================="
echo "  ASK Insurance — iOS Build & Installation Helper "
echo "=================================================="
echo ""
echo "Select build type for iOS:"
echo "  1) EAS Cloud Build (Generates downloadable .ipa & QR code for iPhone)"
echo "  2) Expo Prebuild (Generates native Xcode project in mobile/ios)"
echo "  3) Expo Go Live Test (Instant testing on iPhone via Expo Go app)"
echo ""

read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo "Starting EAS iOS Preview Build..."
    cd "$(dirname "$0")/../mobile"
    npx eas-cli build --platform ios --profile preview
    ;;
  2)
    echo "Generating iOS Native Xcode Project..."
    cd "$(dirname "$0")/../mobile"
    npx expo prebuild --platform ios
    echo "Native Xcode project created at: mobile/ios/askinsurance.xcworkspace"
    ;;
  3)
    echo "Starting Expo Development Server for iPhone..."
    cd "$(dirname "$0")/../mobile"
    npx expo start
    ;;
  *)
    echo "Invalid option. Exiting."
    exit 1
    ;;
esac
