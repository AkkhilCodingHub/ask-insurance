# Complete Feature Specifications – Ask Insurance Management System

**Project:** Ask Insurance (Multi-Category Insurance Platform)  
**Modules:** Mobile App (React Native/Expo) + Admin Dashboard (Next.js/React) + Backend API (Express/Prisma/MySQL)  
**Design Reference:** Inspired by PB Partners (PBP) & Echo Apps  

---

## 📋 Executive Summary & Updation Checklist

| Feature Requirement | Scope / Component | Status | Description |
| :--- | :--- | :---: | :--- |
| **Vehicle Lookup via Reg Number** | Mobile / API | 🟢 Ready | Instant policy detail & vehicle spec fetch using vehicle registration number. |
| **Login Phase Policy Dropdown** | Mobile App | 🟢 Ready | Policy selection dropdown menu during login/onboarding phase. |
| **POSP Rebranding** | System-wide | 🟢 Ready | Rebranded all "Agent" terminology to **POSP** (Point of Sales Person). |
| **Random ID Generator** | Admin / API | 🟢 Ready | Generates unique Random POSP/User ID alongside optional email ID. |
| **Immediate Admin POSP Assignment** | Admin Panel | 🟢 Ready | Admin assigns POSP immediately with full power to manage & access consumers/policyholders with real-time admin monitoring. |
| **Policy Endorsement & Revised Downloads** | Mobile / API | 🟢 Ready | Policy endorsement request flow and revised policy PDF downloads. |
| **NCB Warning System** | Quote Generator | 🟢 Ready | Automatic warning trigger when No Claim Bonus (NCB) changes or exceeds eligibility. |
| **POSP Verification Documents** | Onboarding | 🟢 Ready | Required verification docs: 10th/12th Marksheet, Aadhaar Card, PAN Card. |
| **Echo & PB Partners UI Alignment** | Mobile App | 🟢 Ready | Modern UI layout with performance cards, recommended features, and product grids. |

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
- **Instant POSP Assignment**: Admin can immediately assign an active POSP to any incoming consumer or lead.
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
