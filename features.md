# Ask Insurance — Master Feature Specifications & Codebase Audit (`features.md`)

**Project:** Ask Insurance (Multi-Category Insurance Platform)  
**Modules:** Mobile App (React Native / Expo) + Admin Dashboard (Next.js / React) + Backend API (Express / Prisma / MySQL)  
**Design & Workflow Reference:** Inspired by PB Partners (PBP) & Echo Apps  

---

## 📊 Core Features Audit Summary Table

| Feature | Description | Status in Code |
| :--- | :--- | :---: |
| **Multi-Insurance Policy Management by Vehicle Number** | Central module to manage all classes of vehicle insurance using the vehicle registration number as the primary identifier, covering every insurance type by the platform. | [✓] |
| **Policy Selection Dropdown (Login Phase)** | A dropdown menu integrated at the login stage allowing the user to select the relevant policy/insurance type before proceeding into the app. | [✓] |
| **Fetch Policy Details via Registration Number** | Auto-fetch and display existing policy details by simply entering the vehicle registration number, reducing manual data entry. | [✓] |
| **Echo & PBPartners App Integration Reference** | Integration/reference module built in line with the Echo and PBPartners applications for data consistency and workflow alignment. | [✓] |
| **Endorsement & Revised Policy Download** | Feature to process policy endorsements and allow users to download the revised/updated policy document directly from the app. | [✓] |
| **Agent Renamed to POSP** | Rebranding of the 'Agent' role/label across the application to 'POSP' (Point of Sales Person), including all related screens and terminology. | [✓] |
| **Randomized User ID (with Email ID Retained)** | System-generated random ID used in place of the email ID as the primary identifier, while still retaining and storing the email ID in the user profile. | [✓] |
| **Auto Agent Assignment by Admin** | On registration, the admin automatically assigns a POSP/agent to the consumer/policyholder, granting that agent access rights to manage the customer, with visibility of the same to the assigning admin. | [✓] |
| **NCB (No Claim Bonus) Warning Alert** | Automated warning/alert triggered when a No Claim Bonus (NCB) discrepancy or risk condition is detected during policy processing. | [✓] |
| **POSP Onboarding Document Upload** | Document upload module for POSP onboarding — 10th or 12th mark sheet, Aadhar card, and PAN card. | [✓] |

---

## 📋 Features Implementation Checklist

- [✓] **Multi-Insurance Policy Management by Vehicle Number**: Central module to manage all vehicle insurance classes using registration number as primary identifier.
- [✓] **Policy Selection Dropdown (Login Phase)**: Dropdown menu integrated at the login stage allowing users to select policy type before entering app.
- [✓] **Fetch Policy Details via Registration Number**: Auto-fetch and display existing policy details using registration number.
- [✓] **Echo & PBPartners App Integration Reference**: PBPartners & Echo inspired dashboard, performance cards, recommended features, and product grids.
- [✓] **Endorsement & Revised Policy Download**: Process policy endorsements and allow users to download revised policy documents.
- [✓] **Agent Renamed to POSP**: Rebrand all occurrences of 'Agent' to 'POSP' (Point of Sales Person) across Database, API, App, and Admin Panel.
- [✓] **Randomized User ID (with Email ID Retained)**: System-generated random ID used in place of email ID as primary identifier while retaining email ID.
- [✓] **Auto Agent Assignment by Admin**: Admin automatically assigns a POSP/agent to the policyholder upon registration with full access rights and admin visibility.
- [✓] **NCB (No Claim Bonus) Warning Alert**: Automated warning alert triggered when an NCB discrepancy or risk condition is detected during policy processing.
- [✓] **POSP Onboarding Document Upload**: Document upload module for 10th or 12th mark sheet, Aadhaar card, and PAN card.

---

## 🎯 Detailed Feature Scope & In-House Specifications

### 1. Multi-Insurance Policy Management by Vehicle Number
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Centralized module to handle all vehicle insurance categories (Car, Two Wheeler, Commercial Vehicle) using the vehicle registration number (`DL-01-AB-1234`) as the primary key.
* **Cost**: **$0 (In-House Database Indexing & Search)**

### 2. Policy Selection Dropdown (Login Phase)
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Include an intuitive policy selection dropdown (Life, Health, Motor, Travel, Home, Commercial) during initial user onboarding or login stage before proceeding into the main application.
* **Cost**: **$0 (Client-Side UI Enhancement)**

### 3. Fetch Policy Details via Registration Number
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Auto-fetch and populate existing policy history, vehicle specifications, and coverage details simply by entering the vehicle registration number, significantly reducing manual data entry.
* **Cost**: **$0 (In-House Database & Local Cache Lookup)**

### 4. Echo & PBPartners App Integration Reference
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Workflow alignment and UI benchmark integration modeled after Acko/Echo (for seamless B2C self-service) and PBPartners (for POSP performance, leads, and sales tracking).
* **Cost**: **$0 (Frontend Layout & UX Implementation)**

### 5. Endorsement & Revised Policy Download
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Feature allowing users and POSPs to request financial & non-financial policy endorsements and download updated/revised policy PDF documents directly from the app.
* **Cost**: **$0 (In-House PDF Generation Engine)**

### 6. Agent Renamed to POSP
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Full system rebranding of the 'Agent' label to 'POSP' (Point of Sales Person) across Database schema (`pospId`), API endpoints (`/api/posp`), Mobile App tabs (`(posp)`), and Web Admin dashboard.
* **Cost**: **$0 (Refactoring & Terminology Update)**

### 7. Randomized User ID (with Email ID Retained)
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: System-generated random unique ID used as the primary identifier instead of email ID, while retaining and storing the email ID in the user profile for communications.
* **Cost**: **$0 (Backend Authentication & Schema Logic)**

### 8. Auto Agent Assignment by Admin
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Upon customer registration, Admin automatically assigns a POSP/agent to the policyholder. Grants the POSP management rights over the customer while providing complete visibility to the assigning Admin.
* **Cost**: **$0 (RBAC & Admin Governance Rules)**

### 9. NCB (No Claim Bonus) Warning Alert
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Automated alert system triggered during quote generation or renewal whenever an NCB discrepancy, declaration error, or risk condition is detected.
* **Cost**: **$0 (Client-Side & Server-Side Rule Validation)**

### 10. POSP Onboarding Document Upload
* **Status**: `[✓] Implemented in Codebase`
* **Scope**: Dedicated document upload module for POSP onboarding — supporting 10th or 12th Educational Marksheet, Aadhaar Card, and PAN Card with Admin approval status.
* **Cost**: **$0 (Cloudflare R2 Storage & Admin Review Queue)**

---

## 📱 1. POSP Mobile Application (React Native / Expo)

### A. Top Navigation Bar & Global Components
- **Profile Avatar**: Quick access to POSP Profile, Settings, and Language selector.
- **Notification Center**: Real-time alerts with unread badge counter.
- **Help & Support**: Direct shortcut to Support Tickets (`? Tickets`).
- **Rewards & Gifts Widget**: Gamified reward points and agent achievements icon.
- **Floating Support Chat Widget**: Floating chat bubble accessible across screens.
- **Bottom Navigation Bar**: 5 main tabs (`Home`, `Sell`, `Leads`, `Renewals`, `Bookings`).

---

### B. POSP Home Dashboard
- **My Performance Overview Widget**:
  - Timeframe filter dropdown (`This month`, `Today`, `Custom range`).
  - **Policies Sold Count** (e.g., 18 policies).
  - **Total Premium Amount** (e.g., ₹3.51 Lakhs).
  - **Renewals Count** (e.g., 0 renewals).
- **Total Premium Breakdown Sheet (Interactive Modal)**:
  - Category-wise premium distribution breakdown:
    - **Commercial Vehicle**: ₹3.01 Lakhs
    - **Car**: ₹25,861
    - **Health**: ₹16,731
    - **Two Wheeler**: ₹7,070
    - **Personal Accident**: ₹366
- **Recommended For You Section**:
  - `PBP One` shortcut
  - `Contests` & Performance leaderboards
  - `My Tickets` status tracker
  - `My Brand` co-branded marketing collateral generator
- **Sell Now Action Grid**:
  - Instant access to Car, Two Wheeler, Commercial Vehicle, Health.
  - `View All Products` modal link.
- **Quick Links Bar**:
  - My Brand materials
  - Activity Points tracker
  - Contact Relationship Manager (`Contact RM`) button

---

### C. Insurance Catalog & Sales Module (`Sell` Tab)
- **Fulfillment Mode Toggle**:
  - `Online` (Instant policy issuance)
  - `Request Quote` (Offline lead & customized quotation pipeline)
- **General Insurance Offerings**:
  - 🚗 **Car Insurance** (Reg number lookup, NCB warning, Addon filters)
  - 🛵 **Two Wheeler Insurance** (Quick quote & renewal)
  - 🚛 **Commercial Vehicle Insurance** (Heavy & light commercial vehicles)
  - 🏥 **Health Insurance** (Individual, family floater, critical illness)
  - 🏠 **Home Insurance** (Structure & content coverage)
  - ✈️ **Travel Insurance** (Domestic & international travel)
- **Life Insurance Offerings**:
  - 📈 **Investment 2.0** (`NEW` tagged modern ULIP/savings plans)
  - 🤖 **PBP Nivesh Mitra** (AI-guided investment & retirement advisor)
  - 🛡️ **Term Online** (Pure protection term plans)
  - 💵 **Dollar Based Investment** (Offshore/USD investment options)
  - 📄 **Term Offline** (Custom term quotes requiring underwriting)

---

### D. Advanced Quote Sorting & Filtering Drawer
- **Sidebar Category Navigation**:
  - `Last year's addons`
  - `Addons` (active tab)
  - `Accident covers`
  - `Accessories cover`
  - `Insurer type`
  - `Insurer`
  - `Deductibles`
  - `Discounts`
  - `Sort by` (Price low-to-high, High-to-low, Claim Settlement Ratio)
- **Rider & Add-on Checkbox Selection**:
  - ☑️ **Zero Depreciation**
  - ☑️ **24x7 Roadside Assistance (RSA)**
  - ☑️ **Engine Protection Cover**
  - ☑️ **Consumables Cover**
  - ☑️ **Key & Lock Replacement**
  - ☑️ **Return to Invoice (Invoice Price Cover)**
  - ☑️ **Tyre Protector**
  - ☑️ **Loss of Personal Belongings**
  - ☑️ **Daily Allowance**
  - ☑️ **Rim Damage Cover**
  - ☑️ **NCB Protector** (Prevents NCB loss on claims)
- **Action Controls**:
  - `Clear` filters reset
  - `Apply Filters` primary action button

---

### E. POSP Onboarding & KYC Module
- **Registration**: Phone OTP login + Random POSP ID generation + optional Email ID.
- **Document Verification Uploads**:
  - 📄 **10th / 12th Marksheet** (Educational qualification proof for POSP certification)
  - 🆔 **Aadhaar Card** (Front & Back identity/address proof)
  - 💳 **PAN Card** (Tax verification & payout setup)
- **Verification Workflow**:
  - Document status badge (`Pending`, `Verified`, `Rejected`).
  - Instant admin notification upon submission.

---

## 🖥️ 2. Admin Management Panel (Next.js / React)

### A. Immediate POSP Assignment & Control
- **Auto/Instant POSP Assignment**: Admin automatically assigns a POSP to any incoming consumer or policyholder upon registration.
- **POSP Delegated Powers**: POSP is granted permission to access, update, and manage policyholder records, quote histories, and documents.
- **Real-Time Admin Visibility**: Admin dashboard displays live mapping of POSPs to assigned policyholders and active transactions.

---

### B. Policy Endorsement & Management
- **Endorsement Pipeline**: Submit and process changes (name corrections, address updates, vehicle registration changes).
- **Revised Policy Download**: Auto-generate and store revised policy PDFs for download by POSPs and policyholders.

---

### C. Insurance Company & Brokerage Control
- **Company Directory**: Manage insurance carriers, active products, and slab rules.
- **Brokerage Slabs**: Configurable payout tiers per product category.
- **Commission Release**: Track earned vs. released brokerage per POSP.

---

### D. Claims & Renewals Management
- **NCB Validation**: Flags NCB discrepancies between previous policy and current declaration.
- **Automated Expiry Alerts**: 30-day, 15-day, and 7-day renewal reminder notifications.
- **Claim Timeline**: End-to-end claim submission, document audit, and settlement tracker.

---

## 🛠 Touchpoint Matrix

| Component | Files & Scope Affected |
| :--- | :--- |
| **Database Schema** | `api/prisma/schema.prisma` (Models: `User`, `Posp`, `Policy`, `Vehicle`, `Endorsement`, `Document`) |
| **Backend API** | `api/src/routes/admin.ts`, `api/src/routes/auth.ts`, `api/src/routes/posp.ts`, `api/src/routes/policies.ts` |
| **Customer Mobile App** | `mobile/src/app/(tabs)`, `mobile/src/app/quote.tsx`, `mobile/src/app/my-policies.tsx` |
| **POSP Mobile App** | `mobile/src/app/(posp)` (Document upload, assigned consumer list, lead management, sales metrics) |
| **Web Admin Panel** | `admin/app/dashboard` (POSP document verification, endorsement approvals, NCB alerts, auto-assignment) |
