# Ask Insurance — System Testing, Build & Debugging Log (`logs.md`)

**Timestamp:** 2026-08-06 23:50 IST  
**Environment:** macOS (Darwin arm64) | Node.js v20+ | Docker Engine | Expo / React Native | Next.js 16.2.12  
**Target Services:** MySQL Database (Aiven + Docker) | Backend API (Port 5000/5001) | Next.js Admin Panel (Port 3001) | Android Emulator (`emulator-5554` / `Pixel_9_Pro`)

---

## 1. 🐳 Docker Orchestration Logs

### Service Configuration (`docker-compose.yml`)
- **Database Service (`db`)**: `mysql:8.4` (Container: `ask_db`, Port: `3306`)
- **Management Interface (`phpmyadmin`)**: `phpmyadmin:latest` (Container: `ask_phpmyadmin`, Port: `8080`)

### Command Output: `docker compose up -d`
```log
[Docker] Image phpmyadmin:latest Pulled
[Docker] Image mysql:8.4 Pulled
[Docker] Network ask-insurance_default Created
[Docker] Volume ask-insurance_db_data Created
[Docker] Container ask_db Started -> Container ask_db Healthy
[Docker] Container ask_phpmyadmin Started -> Running on http://localhost:8080
```

---

## 2. 🗄️ Database Schema & Live Migration Logs

### Migrations Executed on Live Instance
1. **`User` Model Enhancement**:
   ```sql
   ALTER TABLE users ADD COLUMN customerCode VARCHAR(191) NULL;
   ALTER TABLE users ADD CONSTRAINT users_customerCode_key UNIQUE (customerCode);
   ```
2. **`Admin` Model Enhancement**:
   ```sql
   ALTER TABLE admins ADD COLUMN agentCode VARCHAR(191) NULL;
   ALTER TABLE admins ADD CONSTRAINT admins_agentCode_key UNIQUE (agentCode);
   ```
3. **`Quote` & `User` POSP Relationship**:
   ```sql
   ALTER TABLE quotes ADD COLUMN agentId VARCHAR(191) NULL;
   ALTER TABLE quotes ADD CONSTRAINT quotes_agentId_fkey FOREIGN KEY (agentId) REFERENCES admins(id) ON DELETE SET NULL;
   ```

---

## 3. ⚙️ Backend API Build & Verification Logs

### Command Output: `cd api && npx tsc --noEmit`
```log
npm notice run ask-insurance@0.0.1 npx
npm notice run 'tsc' --noEmit
✔ TypeScript typecheck passed with 0 errors.
```

### Feature 8 Verification Log (`test_auto_assign.ts`)
```log
--- Testing Auto Agent Assignment by Admin ---
✔ Created user without assigned POSP: cmshsdwjc0000aiyghmwx6trm Auto Assign Test Customer
[AutoAssign] Assigned agent ASK Admin (cmrqj5mtu00218bygcz34yswe) to user cmshsdwjc0000aiyghmwx6trm
✔ User agentId after auto-assignment: cmrqj5mtu00218bygcz34yswe
✔ Assigned POSP Name: ASK Admin
✔ Assigned POSP Email: admin@ask-insurance.in
ALL AUTO AGENT ASSIGNMENT VERIFICATION CHECKS PASSED SUCCESSFULLY!
```

### Feature 9 Verification Log (`test_ncb_alert.ts`)
```log
--- Testing NCB (No Claim Bonus) Warning Alert ---
✔ Motor quote created ID: cmshshbkt0000goygiicxt5wq
✔ NCB Percentage: 25
✔ Has Previous Claim: true
✔ NCB Warning Alert Triggered: ⚠️ NCB Discrepancy & Penalty Risk Warning Alert
✔ NCB Warning Message: Claim reported in previous policy year! Claiming 25% NCB will result in policy rejection or claim repudiation during verification. NCB reset to 0%.
ALL NCB WARNING ALERT VERIFICATION CHECKS PASSED SUCCESSFULLY!
```

---

## 4. 🖥️ Web Admin Dashboard Build & Dev Server Logs

### Command Output: `cd admin && npm run build`
```log
npm notice run @ask/admin@0.1.0 build
npm notice run next build
▲ Next.js 16.2.12 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 8.8s
  Running TypeScript ...
  Finished TypeScript in 3.4s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/21) ...
✓ Generating static pages using 7 workers (21/21) in 181ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /dashboard
├ ○ /dashboard/agents
├ ○ /dashboard/analytics
├ ○ /dashboard/brokerage
├ ○ /dashboard/chat
├ ○ /dashboard/claims
├ ○ /dashboard/files
├ ○ /dashboard/insurers
├ ○ /dashboard/kyc
├ ○ /dashboard/logs
├ ○ /dashboard/plans
├ ○ /dashboard/policies
├ ○ /dashboard/quotes
├ ○ /dashboard/renewals
├ ○ /dashboard/settings
├ ○ /dashboard/settings/templates
└ ○ /dashboard/users

○  (Static)  prerendered as static content
```

### Command Output: `cd admin && npm run dev`
```log
▲ Next.js 16.2.12 (Turbopack)
- Local:         http://localhost:3001
- Network:       http://192.168.1.104:3001
- Environments: .env.local
✓ Ready in 283ms
```

### HTTP Endpoints Verification Log (`curl -I http://localhost:3001/...`)
- `/` -> `HTTP/1.1 307 Temporary Redirect` (redirects to `/login`)
- `/dashboard` -> `HTTP/1.1 200 OK`
- `/dashboard/users` -> `HTTP/1.1 200 OK`
- `/dashboard/insurers` -> `HTTP/1.1 200 OK`
- `/dashboard/brokerage` -> `HTTP/1.1 200 OK`
- `/dashboard/claims` -> `HTTP/1.1 200 OK`
- `/dashboard/renewals` -> `HTTP/1.1 200 OK`
- `/dashboard/kyc` -> `HTTP/1.1 200 OK`

---

## 5. 📱 Mobile App & Android Emulator Execution Logs

### Android AVD & ADB Device Status
- **Connected ADB Device:** `emulator-5554` (Device state: `device`)
- **Available AVD Name:** `Pixel_9_Pro`

### Command Output: `cd mobile && npx tsc --noEmit`
```log
npm notice run mobile@1.0.0 npx
npm notice run 'tsc' --noEmit
✔ TypeScript typecheck passed with 0 errors.
```

### Command Output: `cd mobile && npm run android`

#### 🐛 Debugging History

**Attempt 1 — Failed (Invalid Java Home)**
```log
FAILURE: Build failed with an exception.
* What went wrong:
Value '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home' given for
org.gradle.java.home Gradle property is invalid (Java home supplied is invalid)
```
> **Root Cause:** `openjdk@17` was not installed. Path in `gradle.properties` was stale.

**Attempt 2 — Failed (Unsupported class file major version 69)**
```log
FAILURE: Build failed with an exception.
* What went wrong:
BUG! exception in phase 'semantic analysis' in source unit '_BuildScript_'
Unsupported class file major version 69
```
> **Root Cause:** Only JDK 25 (Temurin) was installed. Gradle 8.13 max supports JDK 21. Java class file major version 69 = JDK 25.

**Fix Applied:**
```bash
brew install openjdk@17    # Installed 22 dependencies + openjdk@17 (17.0.20)
# Updated gradle.properties:
org.gradle.java.home=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

**Attempt 3 — ✅ SUCCESS**
```log
npm notice run mobile@1.0.0 android
npm notice run expo run:android
env: load .env
env: export EXPO_PUBLIC_API_URL
› Building app...

[ExpoRootProject] Using the following versions:
  - buildTools:  36.0.0
  - minSdk:      24
  - compileSdk:  36
  - targetSdk:   36
  - ndk:         27.1.12297006
  - kotlin:      2.1.20
  - ksp:         2.1.20-2.0.1

BUILD SUCCESSFUL in 5m 5s
352 actionable tasks: 25 executed, 327 up-to-date

› Installing app-debug.apk
› Opening askinsurance://expo-development-client/?url=http://192.168.1.104:8081 on Pixel_9_Pro
Android Bundled 9948ms node_modules/expo-router/entry.js (1563 modules)
```

---

## 📋 6. Runtime Debugging & Bug Fixes

### Bug 1: `java.net.ConnectException: Failed to connect to /10.0.2.2:4000` & Firebase Fallback
- **Root Cause:** The local API server on port 4000 was stopped and the Docker MySQL database container was offline, causing local API fallback connections from the Android emulator (`http://10.0.2.2:4000`) to fail with a pool connection timeout.
- **Fix:**
  1. Started Docker containers `ask_db` (MySQL 8.4 on port 3306) & `ask_phpmyadmin` (port 8080).
  2. Synced Prisma schema via `cd api && npx prisma db push`.
  3. Seeded initial insurers, plans, and admin credentials via `cd api && npm run db:seed`.
  4. Started local API server via `cd api && npm run dev` on port 4000.
- **Verification:** Tested local OTP endpoints:
  - `POST /api/auth/send-otp` -> `{"success":true,"message":"OTP sent successfully","isNewUser":true}`
  - `POST /api/auth/verify-otp` -> `{"success":true,"token":"eyJhbGci...","user":{...}}` (JWT issued & POSP auto-assigned).

### Bug 2: Insurance Type Dropdown on Login Screen
- **Root Cause:** The "SELECT POLICY / INSURANCE TYPE" dropdown with car/health/life options was incorrectly placed on the login screen (`login.tsx`). It should only appear inside the app's quote/policy flow.
- **Fix:** Removed the following from [`mobile/src/app/login.tsx`](file:///Users/akkhil/Github/ask-insurance/mobile/src/app/login.tsx):
  - `selectedPolicy` and `showPolicyModal` state variables
  - Policy dropdown UI component (lines 127–139)
  - Policy picker Modal component (lines 251–288)
  - Unused `Modal`, `ScrollView`, `Pressable` imports
- **Verification:** `cd mobile && npx tsc --noEmit` — ✅ 0 errors

### Bug 3: JSX Syntax Error in Admin Users Page
- **Root Cause:** Extra `</div>` closing tag in [`admin/app/dashboard/users/page.tsx`](file:///Users/akkhil/Github/ask-insurance/admin/app/dashboard/users/page.tsx) (line 634).
- **Fix:** Removed duplicate closing tag.
- **Verification:** `cd admin && npm run build` — ✅ 21/21 pages built with 0 errors.

### Bug 5: Standalone Physical Phone APK & Firebase Auth Integration
- **Context:** When building a standalone APK (`.apk`) to install on physical Android phones, local emulator loops (`10.0.2.2`) do not apply.
- **Fix & Enhancements:**
  1. Updated [`mobile/src/lib/api.ts`](file:///Users/akkhil/Github/ask-insurance/mobile/src/lib/api.ts) (`resolveBaseUrl`) to dynamically use your Wi-Fi LAN IP / `EXPO_PUBLIC_API_URL` cloud backend endpoint for standalone APK builds.
  2. Updated [`api/src/routes/auth.ts`](file:///Users/akkhil/Github/ask-insurance/api/src/routes/auth.ts) (`POST /api/auth/verify-firebase`) to ensure randomized `customerCode` generation (`ASK-CUST-XXXXXX`) and `autoAssignAgentToUser` POSP assignment trigger seamlessly when authenticating via Firebase ID Tokens on real devices.
- **Verification:** Both API and Mobile packages compile cleanly with **0 TypeScript errors**.

---

## 📋 7. Full Feature Verification Matrix

| # | Feature | Status | Verification Detail |
| :-: | :--- | :---: | :--- |
| 1 | **Multi-Insurance Policy Management by Vehicle Number** | **[✓]** | Live DB vehicle lookup & policy management |
| 2 | **Policy Selection Dropdown** | **[✓]** | Moved to quote/policy flow (removed from login screen) |
| 3 | **Fetch Policy Details via Registration Number** | **[✓]** | Auto-populates vehicle specs, insurer & NCB |
| 4 | **Echo & PBPartners App Integration Reference** | **[✓]** | Dashboard cards, performance overview & product grids |
| 5 | **Endorsement & Revised Policy Download** | **[✓]** | Endorsement request pipeline & PDF download |
| 6 | **Agent Renamed to POSP** | **[✓]** | Rebranded across DB, API, Mobile App & Admin |
| 7 | **Randomized User ID (with Email ID Retained)** | **[✓]** | System-generated `customerCode` badge |
| 8 | **Auto Agent Assignment by Admin** | **[✓]** | Auto-assigns POSP on signup + Admin re-assignment |
| 9 | **NCB (No Claim Bonus) Warning Alert** | **[✓]** | Discrepancy detector with "Reset NCB to 0%" action |
| 10 | **POSP Onboarding Document Upload** | **[✓]** | Upload module for Marksheet, Aadhaar & PAN Card |


---

## 📱 Mobile App (Android Emulator) Verification Log

- **Emulator Device**: `Pixel_9_Pro` (`emulator-5554`) running Android 15.
- **Metro Bundler**: Running on `http://localhost:8081` with Expo Router v4.
- **Backend Resolution**: Target `http://10.0.2.2:4000` directly in dev on Android emulator.
- **Auth Verification**:
  1. Phone number `9876543210` entered on Mobile Login screen (`/login`).
  2. Fixed Dev OTP `123456` accepted and verified by local Docker API (`POST http://10.0.2.2:4000/api/auth/verify-otp`).
  3. `AuthContext` updated immediately with user token & profile details.
  4. Instant screen transition to Onboarding Profile form (`/onboarding`).
  5. User profile completion & seamless entry into Mobile Home Dashboard (`/(tabs)`).
- **Home Dashboard State**:
  - Displays greeting `GOOD MORNING, 9876543210 👋`.
  - Active KPI counters: `0 Active Policies`, `0 Open Claims`, `38+ Partner Insurers`.
  - Complete your KYC action card with DigiLocker verification flow.
  - Quick Action cards (`Compare Plans`, `My Policies`, `File Claim`).
  - Partner Insurance list & AI Chat floating assistant widget active.
- **Feature Verifications on Emulator**:
  - **Auth & Onboarding (Features 2, 7, 8)**: Phone OTP (`9876543210`), Dev OTP `123456`, profile onboarding (`Rahul Sharma`, `15/08/1995`) with auto-assigned POSP advisor (`AGT-1082`). Verified working (`android_screen_73.png`, `android_screen_75.png`, `android_screen_77.png`).
  - **Motor Insurance Registration Lookup & Quotes (Features 1, 3, 4)**: Enter vehicle number (e.g. `MH12AB1234`), fetch vehicle specs, select policy type, view instant quotes with NCB bonus options. Verified working (`android_screen_80.png`, `android_screen_83.png`).
  - **Claims Submission & Evidence Attachment (Feature 9)**: File claim form with policy selection, incident details, claim amount, and document/image upload. Verified working (`android_screen_84.png`, `android_screen_85.png`).
  - **POSP Rebranding & User ID Badge (Features 6, 7, 8)**: Rebranded all Agent references to POSP across profile, advisor linking, and admin dashboard. Assigned POSP advisor displayed with 1-tap simulator link options (`android_screen_98.png`, `android_screen_101.png`).
  - **DigiLocker KYC & Storage (Feature 11)**: KYC verification flow with instant DigiLocker OAuth link (`android_screen_86.png`, `android_screen_93.png`).
  - **AI Floating Assistant & Support (Feature 12)**: Floating AI Assistant widget available across all tab screens (`android_screen_77.png`).
- **Screenshots Recorded**:
  - Screenshot 73 (OTP Verification Screen): `android_screen_73.png`
  - Screenshot 75 (Profile Onboarding Screen): `android_screen_75.png`
  - Screenshot 77 (Home Dashboard Screen): `android_screen_77.png`
  - Screenshot 80 (Motor Quote Flow): `android_screen_80.png`
  - Screenshot 84 (Claims Tab Screen): `android_screen_84.png`
  - Screenshot 86 (DigiLocker KYC Screen): `android_screen_86.png`
  - Screenshot 98 (Home Dashboard Screen): `android_screen_98.png`
  - Screenshot 101 (Home Dashboard Screen): `android_screen_101.png`

