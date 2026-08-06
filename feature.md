# ASK Insurance — Free (In-House) Feature Specification (`feature.md`)

This document contains the finalized feature specification, codebase audit, and roadmap for **ASK Insurance**.

---

## 📊 Core Features Audit Summary Table

| Feature | Description | Status in Code |
| :--- | :--- | :---: |
| **Multi-Insurance Policy Management by Vehicle Number** | Central module to manage all classes of vehicle insurance using the vehicle registration number as the primary identifier, covering every insurance type by the platform. | [ ] |
| **Policy Selection Dropdown (Login Phase)** | A dropdown menu integrated at the login stage allowing the user to select the relevant policy/insurance type before proceeding into the app. | [ ] |
| **Fetch Policy Details via Registration Number** | Auto-fetch and display existing policy details by simply entering the vehicle registration number, reducing manual data entry. | [ ] |
| **Echo & PBPartners App Integration Reference** | Integration/reference module built in line with the Echo and PBPartners applications for data consistency and workflow alignment. | [x] |
| **Endorsement & Revised Policy Download** | Feature to process policy endorsements and allow users to download the revised/updated policy document directly from the app. | [ ] |
| **Agent Renamed to POSP** | Rebranding of the 'Agent' role/label across the application to 'POSP' (Point of Sales Person), including all related screens and terminology. | [ ] |
| **Randomized User ID (with Email ID Retained)** | System-generated random ID used in place of the email ID as the primary identifier, while still retaining and storing the email ID in the user profile. | [ ] |
| **Auto Agent Assignment by Admin** | On registration, the admin automatically assigns a POSP/agent to the consumer/policyholder, granting that agent access rights to manage the customer, with visibility of the same to the assigning admin. | [ ] |
| **NCB (No Claim Bonus) Warning Alert** | Automated warning/alert triggered when a No Claim Bonus (NCB) discrepancy or risk condition is detected during policy processing. | [ ] |
| **POSP Onboarding Document Upload** | Document upload module for POSP onboarding — 10th or 12th mark sheet, Aadhar card, and PAN card. | [x] |

---

## 📋 Features Implementation Checklist

- [ ] **Multi-Insurance Policy Management by Vehicle Number**: Central module to manage all vehicle insurance classes using registration number as primary identifier.
- [ ] **Policy Selection Dropdown (Login Phase)**: Dropdown menu integrated at the login stage allowing users to select policy type before entering app.
- [ ] **Fetch Policy Details via Registration Number**: Auto-fetch and display existing policy details using registration number.
- [x] **Echo & PBPartners App Integration Reference**: PBPartners & Echo inspired dashboard, performance cards, recommended features, and product grids.
- [ ] **Endorsement & Revised Policy Download**: Process policy endorsements and allow users to download revised policy documents.
- [ ] **Agent Renamed to POSP**: Rebrand all occurrences of 'Agent' to 'POSP' (Point of Sales Person) across Database, API, App, and Admin Panel.
- [ ] **Randomized User ID (with Email ID Retained)**: System-generated random ID used in place of email ID as primary identifier while retaining email ID.
- [ ] **Auto Agent Assignment by Admin**: Admin automatically assigns a POSP/agent to the policyholder upon registration with full access rights and admin visibility.
- [ ] **NCB (No Claim Bonus) Warning Alert**: Automated warning alert triggered when an NCB discrepancy or risk condition is detected during policy processing.
- [x] **POSP Onboarding Document Upload**: Document upload module for 10th or 12th mark sheet, Aadhaar card, and PAN card.

---

## 🎯 Feature Specifications & Scope Breakdown

### 1. Multi-Insurance Policy Management by Vehicle Number
* **Status**: [ ] Pending Implementation
* **Scope**: Centralized module to handle all vehicle insurance categories (Car, Two Wheeler, Commercial Vehicle) using the vehicle registration number (`DL-01-AB-1234`) as the primary key.

### 2. Policy Selection Dropdown (Login Phase)
* **Status**: [ ] Pending Implementation
* **Scope**: Include an intuitive policy selection dropdown (Life, Health, Motor, Travel, Home, Commercial) during initial user onboarding or login stage before proceeding into the main application.

### 3. Fetch Policy Details via Registration Number
* **Status**: [ ] Pending Implementation
* **Scope**: Auto-fetch and populate existing policy history, vehicle specifications, and coverage details simply by entering the vehicle registration number, significantly reducing manual data entry.

### 4. Echo & PBPartners App Integration Reference
* **Status**: [x] Implemented in Codebase
* **Scope**: Workflow alignment and UI benchmark integration modeled after Acko/Echo (for seamless B2C self-service) and PBPartners (for POSP performance, leads, and sales tracking).

### 5. Endorsement & Revised Policy Download
* **Status**: [ ] Pending Implementation
* **Scope**: Feature allowing users and POSPs to request financial & non-financial policy endorsements and download updated/revised policy PDF documents directly from the app.

### 6. Agent Renamed to POSP
* **Status**: [ ] Pending Implementation (Currently using `Agent` terminology in code/schema)
* **Scope**: Full system rebranding of the 'Agent' label to 'POSP' (Point of Sales Person) across Database schema (`pospId`), API endpoints (`/api/posp`), Mobile App tabs (`(posp)`), and Web Admin dashboard.

### 7. Randomized User ID (with Email ID Retained)
* **Status**: [ ] Pending Implementation
* **Scope**: System-generated random unique ID used as the primary identifier instead of email ID, while retaining and storing the email ID in the user profile for communications.

### 8. Auto Agent Assignment by Admin
* **Status**: [ ] Pending Implementation
* **Scope**: Upon customer registration, Admin automatically assigns a POSP/agent to the policyholder. Grants the POSP management rights over the customer while providing complete visibility to the assigning Admin.

### 9. NCB (No Claim Bonus) Warning Alert
* **Status**: [ ] Pending Implementation
* **Scope**: Automated alert system triggered during quote generation or renewal whenever an NCB discrepancy, declaration error, or risk condition is detected.

### 10. POSP Onboarding Document Upload
* **Status**: [x] Implemented in Codebase
* **Scope**: Dedicated document upload module for POSP onboarding — supporting 10th or 12th Educational Marksheet, Aadhaar Card, and PAN Card with Admin approval status.

---

## 🛠 Touchpoint Matrix

| Component | Files & Scope Affected |
| :--- | :--- |
| **Database Schema** | `api/prisma/schema.prisma` (Models: `User`, `Posp`, `Policy`, `Vehicle`, `Endorsement`, `Document`) |
| **Backend API** | `api/src/routes/admin.ts`, `api/src/routes/auth.ts`, `api/src/routes/posp.ts`, `api/src/routes/policies.ts` |
| **Customer Mobile App** | `mobile/src/app/(tabs)`, `mobile/src/app/quote.tsx`, `mobile/src/app/my-policies.tsx` |
| **POSP Mobile App** | `mobile/src/app/(posp)` (Document upload, assigned consumer list, lead management, sales metrics) |
| **Web Admin Panel** | `admin/app/dashboard` (POSP document verification, endorsement approvals, NCB alerts, auto-assignment) |
