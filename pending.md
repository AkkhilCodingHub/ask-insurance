# Pending Tasks & Progress - ask-insurance

## Overview
AI-powered Multi-Provider Insurance Platform (ASK Insurance) with live quote calculation engines, PolicyBazaar-style customer & agent web portals, POSP agent authentication, and mobile app.

---

## 📋 Comprehensive Feature Worklist

### 1. Vehicle Details Fetching for Motor Policies
- [x] Automated registration number lookup via mParivahan / SurePass API (`/api/vehicles/rc-fetch/:registrationNumber`).
- [x] Auto-population of vehicle make, model, variant, fuel type, cubic capacity, registration year, RTO, engine, and chassis numbers.
- [x] Debounced typing handler with clean normalization (`DL01AB1234`).

### 2. Live Policy Quote Fetching & Showcase
- [x] Multi-provider live quote engine for partner insurers (HDFC ERGO, ICICI Lombard, Tata AIG, Go Digit, Bajaj Allianz, Reliance General, SBI General, Star Health, Niva Bupa).
- [x] PolicyBazaar-style comparison cards displaying Claim Settlement Ratio (CSR %), customer rating, NCB discount, base premium, GST breakdown, and addon toggles.

### 3. Smart Intent & Search-Based In-App Policy Recommendations
- [x] Search & keyword intent detection engine for in-app policy recommendation cards.
- [x] Context-aware triggers:
  - Car / Bike keywords -> Motor Policy notification card (50% NCB rollover, IDV calculator)
  - Hospital / Medical keywords -> Health Insurance notification card (Hospitalization & Critical Illness)
  - Flight / Trip / Evacuation keywords -> Travel Insurance card (Medical Emergencies: Emergency hospitalization & evacuation; Trip Disruptions: Non-refundable costs; Baggage/Passport Cover: Lost/stolen luggage & misplaced passports; Personal Liability: Legal liabilities for bodily injury or property damage)
  - Family / Security keywords -> Term Life Insurance recommendation card (Pure protection)

### 4. Comprehensive In-App Notification Hub
- [x] Automated notifications for upcoming policy expiration (5-day warning banner).
- [x] Pending renewal alerts with 1-click renewal link.
- [x] Real-time updates for newly issued policies and claim status changes.

### 5. POSP Agent Portal & Dual Auth System
- [x] POSP Registration & onboarding workflow with document verification.
- [x] Dual-authentication system allowing logins via Email (`agent@ask-insurance.in`) AND auto-generated POSP ID (e.g. `AS734450`).
- [x] PolicyBazaar-style agent management interface for tracking client quotes, issued policies, and commission payouts.

### 6. Modern Lively Web Platform (`web` workspace)
- [x] Complete overhaul of Next.js web application with modern typography, glassmorphism, and smooth Framer Motion micro-animations.
- [x] Interactive PolicyBazaar-style insurance calculators for Motor, Health, Travel, and Life insurance.
- [x] Header/Footer links for Google Play Store, Apple App Store, and Admin Portal (`http://localhost:3001`).

### 7. Production App Builds & Cloud Latency Optimization
- [x] Local Android & iOS release build compilation (`app-release.apk`).
- [x] Cloud deployment configuration (Railway / Docker / Vercel / Render) optimized for sub-300ms backend response times.

### 8. Policy Detail Page Fixes, Checkout Summary & IDV Calculation
- [x] Pre-payment checkout summary screen detailing comprehensive premium breakdown, vehicle/policy summary, statutory taxes, and NCB.
- [x] Custom Third-Party liability input supporting decimal values (e.g., `7.5` Lakhs / `0.5` Cr).
- [x] Floating AI Chat button visibility fix: Automatically hide floating chat icon on policy detail / quote screens so it doesn't obstruct "Get Quote" and "Proceed to Pay" buttons.
- [x] PolicyBazaar IDV calculation engine for 0–5 years (IRDAI depreciation schedule) and >5 years (10% annual reduction or mutual agreement controls).

### 9. Latency & Bundle Size Performance Optimization
- [x] Optimize mobile bundle size via Hermes engine tuning, asset compression, and code splitting.
- [x] Server response latency optimization (Target: **100–300 ms** response time) using connection pooling, Gzip compression, and endpoint caching.

### 10. Codebase Refactoring & Line Minimization
- [x] Codebase Refactoring & Line Minimization: Cleaned redundant boilerplate, consolidated helper logic, removed verbose comments, and ensured human-quality code architecture across mobile, web, and backend services.

---

## 🚫 Rules & Directives
- **NO GIT COMMITS OR PUSHES** before presenting complete changes and obtaining explicit user review.

