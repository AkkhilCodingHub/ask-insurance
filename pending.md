# 📌 ASK Insurance - Project Status & Progress Tracker (`pending.md`)

*Last Updated: 2026-08-11*

---

## 🚀 Completed Features & Improvements

### 1. POSP Advisor Examination, Registration & Approval System
- **IC-38 General Insurance Question Bank**: 50 MCQs added covering Chapters 1–16 ([`api/src/lib/ic38Questions.ts`](file:///Users/akkhil/Github/ask-insurance/api/src/lib/ic38Questions.ts)).
- **40-Minute Countdown Timer & Online Exam Engine**: Passing threshold &gt; 15/50 (score &gt;= 16).
- **Anti-Cheating Focus Lock**: Subscribes to React Native `AppState`. Minimized or exited app automatically terminates and fails the exam ([`mobile/src/app/posp-exam.tsx`](file:///Users/akkhil/Github/ask-insurance/mobile/src/app/posp-exam.tsx)).
- **Retake Restrictions & Cooldown**: Max 4 attempts per day with a mandatory 3-hour cooldown between attempts ([`api/src/routes/posp.ts`](file:///Users/akkhil/Github/ask-insurance/api/src/routes/posp.ts)).
- **Post-Passing KYC Upload**: Aadhaar & PAN card document upload unlocked post-passing ([`mobile/src/app/posp-register.tsx`](file:///Users/akkhil/Github/ask-insurance/mobile/src/app/posp-register.tsx)).
- **Admin Panel Approval Dashboard**:
  - Route: `/dashboard/posp-requests` ([`admin/app/dashboard/posp-requests/page.tsx`](file:///Users/akkhil/Github/ask-insurance/admin/app/dashboard/posp-requests/page.tsx)).
  - View candidate score, Aadhaar & PAN document previews.
  - Approve action auto-generates unique POSP ID `ASxxxxxx` (using `idGenerator.ts`) and creates active POSP Advisor account.
- **Syllabus Download Button**: Direct access to IC-38 syllabus PDF.

---

### 2. mParivahan & APISetu Vehicle Details Lookup System
- **Backend API Endpoint**: `GET /api/vehicles/rc-fetch/:registrationNumber` ([`api/src/routes/vehicles.ts`](file:///Users/akkhil/Github/ask-insurance/api/src/routes/vehicles.ts)).
- **APISetu MoRTH Integration**: Pre-configured with official APISetu MoRTH endpoint ([`api/src/lib/mparivahan.ts`](file:///Users/akkhil/Github/ask-insurance/api/src/lib/mparivahan.ts)).
- **Expanded RTO Registry**: Indian RTO mappings updated (e.g., `HR01` = Ambala RTO, `HR26` = Gurugram North RTO, `DL01` = Delhi North, `MH01` = Mumbai, `KA01` = Bangalore, etc.).
- **Mobile Quote Auto-Fill**: Motor quote wizard automatically populates Make, Model, Variant, Fuel Type, Year, Engine, Chassis, RTO, and Insurance Expiry from registration lookup ([`mobile/src/app/quote.tsx`](file:///Users/akkhil/Github/ask-insurance/mobile/src/app/quote.tsx)).
- **Fault-Tolerant Decoder**: Fallback generator ensures quotes never fail even when external API credentials are pending or rate-limited.

---

### 3. Production Release APK & Deployment
- **Release APK**: Built, signed, and updated at [`mobile/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`](file:///Users/akkhil/Github/ask-insurance/mobile/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk) (**37 MB**).
- **Railway Backend Endpoint**: Configured to `https://ask-insurance-api-production.up.railway.app`.

---

## ⏳ Pending Actions & Next Steps for Other Device/Session

### 1. APISetu Portal Settings (Action Needed on APISetu Dashboard)
- Log in to **[partners.apisetu.gov.in](https://partners.apisetu.gov.in)**.
- Under **View Authpartner** -> **Scope \***:
  - **Uncheck `Openid`** in the Scopes checklist and click **Save**.
  - *(Reason: Disabling `Openid` activates direct server-to-server token authentication for document pull APIs on DigiLocker/APISetu).*
- Monitor the **`APIs on API Setu`** request status on the portal until it transitions from *details pending* to *Approved*.

### 2. Optional Commercial Live Vehicle RC Key (Instant Alternative)
- If you want immediate live RC data on any vehicle without waiting for government approval:
  - Add a free key from **SurePass** ([surepass.io](https://surepass.io)) or **Sandbox** ([sandbox.co.in](https://sandbox.co.in)) into `api/.env`:
    ```env
    MPARIVAHAN_API_PROVIDER="surepass"
    MPARIVAHAN_API_URL="https://api.surepass.io/api/v1/rc/rc-full"
    MPARIVAHAN_API_KEY="your_api_key_here"
    ```

---

## 🛠️ Verification Commands for Next Device
- **Backend API**: `cd api && npx tsc --noEmit`
- **Mobile App**: `cd mobile && npx tsc --noEmit`
- **Admin Panel**: `cd admin && npm run build`
