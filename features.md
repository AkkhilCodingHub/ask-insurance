# Complete Feature Specifications – Ask Insurance Management System

**Project:** Ask Insurance (Multi-Category Insurance Platform)  
**Modules:** Mobile App (React Native/Expo) + Admin Dashboard (Next.js/React) + Backend API (Express/Prisma/MySQL)  
**Design Reference:** Inspired by PB Partners (PBP) & Echo Apps  

---

## 📊 Core Features Summary Table

| Feature | Description |
| :--- | :--- |
| **Multi-Insurance Policy Management by Vehicle Number** | Central module to manage all classes of vehicle insurance using the vehicle registration number as the primary identifier, covering every insurance type by the platform. |
| **Policy Selection Dropdown (Login Phase)** | A dropdown menu integrated at the login stage allowing the user to select the relevant policy/insurance type before proceeding into the app. |
| **Fetch Policy Details via Registration Number** | Auto-fetch and display existing policy details by simply entering the vehicle registration number, reducing manual data entry. |
| **Echo & PBPartners App Integration Reference** | Integration/reference module built in line with the Echo and PBPartners applications for data consistency and workflow alignment. |
| **Endorsement & Revised Policy Download** | Feature to process policy endorsements and allow users to download the revised/updated policy document directly from the app. |
| **Agent Renamed to POSP** | Rebranding of the 'Agent' role/label across the application to 'POSP' (Point of Sales Person), including all related screens and terminology. |
| **Randomized User ID (with Email ID Retained)** | System-generated random ID used in place of the email ID as the primary identifier, while still retaining and storing the email ID in the user profile. |
| **Auto Agent Assignment by Admin** | On registration, the admin automatically assigns a POSP/agent to the consumer/policyholder, granting that agent access rights to manage the customer, with visibility of the same to the assigning admin. |
| **NCB (No Claim Bonus) Warning Alert** | Automated warning/alert triggered when a No Claim Bonus (NCB) discrepancy or risk condition is detected during policy processing. |
| **POSP Onboarding Document Upload** | Document upload module for POSP onboarding — 10th or 12th mark sheet, Aadhar card, and PAN card. |

---

## 📋 Updation Checklist & Modules

| Feature Requirement | Scope / Component | Status | Description |
| :--- | :--- | :---: | :--- |
| **Multi-Insurance Policy Management by Vehicle Number** | Mobile / API | 🟢 Ready | Central module to manage all classes of vehicle insurance using vehicle registration number as primary identifier. |
| **Policy Selection Dropdown (Login Phase)** | Mobile App | 🟢 Ready | A dropdown menu integrated at the login stage allowing the user to select the relevant policy/insurance type. |
| **Fetch Policy Details via Registration Number** | Mobile / API | 🟢 Ready | Auto-fetch and display existing policy details by simply entering the vehicle registration number. |
| **Echo & PBPartners App Integration Reference** | Mobile App | 🟢 Ready | Integration/reference module built in line with Echo and PBPartners applications. |
| **Endorsement & Revised Policy Download** | Mobile / API | 🟢 Ready | Process policy endorsements and allow users to download the revised/updated policy document directly. |
| **Agent Renamed to POSP** | System-wide | 🟢 Ready | Rebranding of the 'Agent' role/label across the application to 'POSP' (Point of Sales Person). |
| **Randomized User ID (with Email ID Retained)** | Admin / API | 🟢 Ready | System-generated random ID used in place of email ID as primary identifier, while retaining email ID in user profile. |
| **Auto Agent Assignment by Admin** | Admin Panel | 🟢 Ready | On registration, admin automatically assigns a POSP/agent to the consumer/policyholder with full management access & admin visibility. |
| **NCB (No Claim Bonus) Warning Alert** | Quote Engine | 🟢 Ready | Automated warning/alert triggered when a No Claim Bonus (NCB) discrepancy or risk condition is detected. |
| **POSP Onboarding Document Upload** | Onboarding | 🟢 Ready | Document upload module for POSP onboarding — 10th or 12th mark sheet, Aadhar card, and PAN card. |

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

## ⚙️ 3. Technical Stack & Infrastructure

- **Mobile Application**: React Native (Expo SDK 56), Expo Router, Tailwind/Vanilla CSS, Native SDKs.
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM 7.9.
- **Database**: MySQL (`ask_insurance`), driver adapter for MariaDB/MySQL.
- **Storage & Security**: Cloudflare R2 object storage, JWT auth tokens, AES-256 encrypted local secrets.
- **Multi-Language Support**: 8 Indian languages (English, Hindi, Marathi, Gujarati, Tamil, Telugu, Bengali, Kannada).
