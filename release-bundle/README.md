# 🔐 ASK Insurance — Production Release & Credentials Vault

This folder securely consolidates all Android & iOS production keys, certificates, fingerprints, and release bundles for **ASK Insurance** (`com.ask.insurance`).

---

## 🤖 Android (Google Play & EAS)

| File | Purpose | Alias | Password |
| :--- | :--- | :--- | :--- |
| [`upload-keystore.jks`](./upload-keystore.jks) | Production Upload Keystore (PKCS#12) | `upload` | `AskInsurance@2026` |
| [`upload_certificate.pem`](./upload_certificate.pem) | Public PEM certificate for Google Play upload key reset | `upload` | — |
| [`app-release.aab`](./app-release.aab) | Final Signed Production Android App Bundle | — | — |
| [`app-release.apk`](./app-release.apk) | Final Signed Production APK | — | — |

### Android Fingerprints:
* **MD5**: `A1:8A:3D:63:74:1E:15:D2:EA:0F:4E:C0:E6:28:91:5E`
* **SHA-1**: `BC:74:34:38:C9:61:38:8A:1C:AC:C1:F2:70:AF:10:DE:B9:EC:CC:80`
* **SHA-256**: `8D:90:9D:61:D4:00:DC:13:6F:83:0C:0A:56:E9:FE:ED:DA:78:B2:B1:E9:83:F0:31:6E:A8:75:26:CC:0B:C9:FE`

---

## 🍎 iOS (Apple App Store & TestFlight)

| File | Purpose | Password |
| :--- | :--- | :--- |
| [`CertificateSigningRequest.certSigningRequest`](./CertificateSigningRequest.certSigningRequest) | Apple Certificate Signing Request (CSR) | — |
| [`distribution.cer`](./distribution.cer) | Apple Developer Distribution Certificate | — |
| [`ios_distribution.key`](./ios_distribution.key) | 2048-bit RSA Private Key | — |
| [`ios_distribution.pem`](./ios_distribution.pem) | PEM formatted certificate | — |
| [`ios_distribution.p12`](./ios_distribution.p12) | PKCS#12 Production Distribution Certificate for EAS / Xcode | `AskInsurance@2026` |

---

## 🛠️ Build & Deploy Commands

### Android Production Build:
```bash
cd mobile/android
./gradlew bundleRelease
```

### iOS Production Cloud Build (EAS):
```bash
cd mobile
npx eas-cli build --platform ios --profile production
```
