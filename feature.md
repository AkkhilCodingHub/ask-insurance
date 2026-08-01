# ASK Insurance — Free (In-House) Feature Specification (`feature.md`)

This document contains the finalized, zero-external-cost feature specification and roadmap for **ASK Insurance**, filtered strictly to include **in-house, zero-API-cost features**.

---

## 📋 Free Features Checklist (Zero External API Cost)

- [ ] **Agent → POSP Terminology Rename**: Rename all occurrences of **Agent** to **POSP** (Point of Sales Person) across Database, API, Mobile App, and Admin Panel.
- [ ] **Login Phase Policy Selection Dropdown**: Add a policy type selection dropdown menu during the user login / onboarding phase.
- [ ] **POSP Verification Document Uploads**: Allow POSPs to upload **10th / 12th Educational Marksheet**, **Aadhaar Card**, and **PAN Card** with manual Admin verification.
- [ ] **Policy Endorsement & Revised PDF Downloads**: Enable policy change requests (financial & non-financial) and downloading **Revised Policy PDFs** upon Admin approval.
- [ ] **Random Unique System ID & Dual Auth**: Generate a random system ID (e.g. `ASK-USR-89421`) for users while supporting login via **Random ID**, **Email ID**, or **Phone Number**.
- [ ] **Instant Admin POSP Assignment & Governance**: Admins can immediately allocate a dedicated POSP to a policyholder with full management access and real-time Superadmin visibility.
- [ ] **No Claim Bonus (NCB) Warning System**: Raise client-side and API warnings when NCB percentages (0%, 20%, 25%, 35%, 45%, 50%) are misdeclared or impacted by past claims.
- [ ] **Acko & PBPartners App Reference UX**: Align customer self-service UI with **Acko (Echo)** and POSP portal workflow with **PBPartners**.
- [ ] **Manual Vehicle Registration Number Input & Search**: Allow capturing and filtering vehicle registration numbers (`DL-01-AB-1234`) stored in-house in DB.

---

## 🎯 Feature Specifications & Scope Breakdown

### 1. Agent → POSP Global Rename
* **Scope**: Refactor all database models (`Admin` role, `agentId` → `pospId`), API endpoints (`/api/admin/posp`), Mobile App screens (`(posp)` tab), and Web Admin dashboards from **Agent** to **POSP** to comply with IRDAI regulations.
* **Cost**: **$0 (In-House Code Refactor)**
* **Estimated Effort**: 1 Day

### 2. Login Phase Policy Selection Dropdown
* **Scope**: Include an intuitive policy selection dropdown (Life, Health, Motor, Travel, Home, Business) during initial user onboarding or login to customize the user's dashboard view.
* **Cost**: **$0 (Client-Side UI Enhancement)**
* **Estimated Effort**: 0.5 Days

### 3. POSP Verification Document Uploads (10/12th Marksheet, Aadhaar, PAN)
* **Scope**: Build document upload pickers (Photos/PDFs) for POSP applicants. Save documents securely to cloud storage (S3/R2) and provide an Admin review queue (`Pending` → `Verified` / `Rejected`).
* **Cost**: **$0 (Uses existing storage bucket & manual Admin review)**
* **Estimated Effort**: 1 Day

### 4. Policy Endorsements & Revised Policy PDF Downloads
* **Scope**: Allow policyholders/POSPs to submit financial (Sum Insured, Add-ons) and non-financial (Name, Address, Nominee) endorsement requests. Upon Admin approval, compile and offer the updated **Revised Policy PDF** for download.
* **Cost**: **$0 (In-House PDF rendering engine)**
* **Estimated Effort**: 2 Days

### 5. Random Unique System ID & Dual Identifier Authentication
* **Scope**: Generate a unique system ID (`ASK-USR-XXXXX` / `ASK-POSP-XXXXX`) upon registration. Update authentication controllers to accept **Random ID**, **Email ID**, or **Phone Number**.
* **Cost**: **$0 (Backend schema & controller logic)**
* **Estimated Effort**: 1 Day

### 6. Instant Admin POSP Assignment & Superadmin Governance
* **Scope**: Allow Admins to immediately assign a POSP to handle a customer or policyholder. Assigned POSPs gain access to assist in quote creation and claim filing, while Superadmins retain 100% audit visibility.
* **Cost**: **$0 (RBAC permissions & database linkage)**
* **Estimated Effort**: 1 Day

### 7. No Claim Bonus (NCB) Misdeclaration Warning System
* **Scope**: Add client-side & backend validation rules during motor policy renewal. Display prominent warning alerts if a user/POSP inputs an ineligible NCB tier or if recent settled claims invalidate the NCB discount.
* **Cost**: **$0 (In-House validation logic)**
* **Estimated Effort**: 0.5 Days

### 8. Acko & PBPartners App Design Benchmarking
* **Scope**: Implement clean 1-tap quote cards inspired by **Acko (Echo)** for direct customers, and structured lead/commission management for POSPs inspired by **PBPartners**.
* **Cost**: **$0 (Frontend styling & layout design)**
* **Estimated Effort**: 1.5 Days

---

## 🛠 Touchpoint Matrix

| Component | Files & Scope Affected |
| :--- | :--- |
| **Database Schema** | `api/prisma/schema.prisma` (Rename `agentId` → `pospId`, add random user ID, endorsement status, POSP document fields) |
| **Backend API** | `api/src/routes/admin.ts`, `api/src/routes/users.ts`, `api/src/routes/policies.ts` |
| **Customer Mobile App** | `mobile/src/app/(tabs)`, `mobile/src/app/quote.tsx`, `mobile/src/app/my-policies.tsx` |
| **POSP Mobile App** | `mobile/src/app/(posp)` (Document upload, assigned consumer list, lead management) |
| **Web Admin Panel** | `admin/app/dashboard` (POSP document verification, endorsement approvals, NCB warnings, POSP assignment) |
