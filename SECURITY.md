# Security Policy & Guidelines

## 🛡️ Overview & Scope

`ask-insurance` is a production insurance platform monorepo comprising:
- **API Backend** (`/api`): Node.js / Express backend with Prisma ORM, MySQL database, Cloudflare R2 storage, and Firebase/JWT authentication.
- **Admin Dashboard** (`/admin`): Next.js dashboard with RBAC for insurance agents and superadmins.
- **Customer Web Portal** (`/web`): Next.js web application for browsing insurance policies and requesting quotes.
- **Mobile Application** (`/mobile`): Expo React Native iOS/Android app.
- **Shared Module** (`/shared`): Shared TypeScript definitions and interfaces.

Security is paramount due to the handling of sensitive customer personal identifiable information (PII), KYC verification documents (PAN, Aadhaar), and payment transactions.

---

## 🔒 Security Architecture & Requirements

### 1. Authentication & Session Management
- **User Authentication**: Customers authenticate using Firebase Phone Auth OTP or standard JWT auth tokens stored in Expo SecureStore (`mobile`) or HttpOnly cookies/headers.
- **Admin RBAC**: Admin routes require valid bearer tokens verified against agent accounts (`superadmin` vs. `agent` role scopes).
- **Token Security**: Tokens are signed using strong secret keys configured via environment variables (`JWT_SECRET`, `JWT_REFRESH_SECRET`). Never hardcode secrets in source code.

### 2. PII & KYC Document Security
- **Cloud Storage**: User KYC documents (PAN card, Aadhaar card, driving license) and claim attachments are stored in private Cloudflare R2 buckets.
- **Document Access**: Storage paths are partitioned (`users/{userId}` or `agents/{adminId}`). Signed URLs or authenticated API proxies must be used for file access.

### 3. Payment Processing Integrity
- **Razorpay Integration**: All payment transactions and webhooks are verified using HMAC-SHA256 signatures (`RAZORPAY_KEY_SECRET`).
- **Idempotency & Verification**: Payments are verified server-side before activating policies or changing quote statuses.

### 4. API & Infrastructure Controls
- **Rate Limiting**: Express rate limiting (`express-rate-limit`) is active across API endpoints to prevent brute-force attacks.
- **Security Headers**: `helmet` is enabled to enforce strict HTTP security headers (HSTS, CSP, X-Frame-Options).
- **CORS Policies**: Explicit origin restrictions prevent unauthorized cross-origin requests.

### 5. Automated Security Workflows
- **CodeQL SAST**: Automated static code security scanning runs weekly and on pull requests via `.github/workflows/security.yml`.
- **Dependabot**: Automated dependency vulnerability monitoring across all workspaces via `.github/dependabot.yml`.
- **CI Security Checks**: Automated `npm audit` and TypeScript typechecks run on every build via `.github/workflows/ci.yml`.

---

## 📢 Reporting a Vulnerability

If you discover a potential security vulnerability in this repository, please report it responsibly:

### 1. Contact Method
- **Private Disclosure**: Please report security vulnerabilities via **GitHub Security Advisories** (`Security` tab -> `Report a vulnerability`) or email security team / maintainer at **`security@askinsurance.com`**.
- **Do NOT**: Do not open a public GitHub issue for security vulnerabilities.

### 2. What to Include
When reporting a vulnerability, please provide:
1. Detailed description of the vulnerability and its potential impact.
2. Step-by-step proof-of-concept (PoC) or reproduction instructions.
3. Affected components (`/api`, `/admin`, `/mobile`, `/web`).
4. Any proposed fixes or mitigations.

### 3. Response SLA
- **Initial Acknowledgment**: Within **24–48 hours**.
- **Triage & Assessment**: Within **3 business days**.
- **Patch & Advisory Release**: Critical vulnerabilities patched within **7 days**.

---

## ❌ Out of Scope
The following testing activities are strictly prohibited:
- Denial of Service (DoS/DDoS) attacks against live infrastructure.
- Social engineering, phishing, or spam attacks targeting users or agents.
- Exfiltration of real user data from production databases.

Thank you for helping keep `ask-insurance` secure for everyone!
