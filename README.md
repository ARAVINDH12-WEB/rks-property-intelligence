# 🏢 RKS PROPERTY INTELLIGENCE — Master Real Estate Command Center & Public Portal

> **Next-Generation Real Estate Inventory, Intelligence & Public Booking Platform for RKS**

![License](https://img.shields.io/badge/License-MIT-amber.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![React](https://img.shields.io/badge/React-18-cyan.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PGlite-blue.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-emerald.svg)

---

## 🌟 Key Capabilities

### 1. 🌐 Public-Facing Portal (Viewer Mode)
- **Public Inventory Exploration**: Browse 58 surveyed plots and premium projects across Chennai, Bangalore, Hyderabad, and Coimbatore.
- **Dynamic Pricing Engine**: Visual hierarchy prioritized by $\text{Property} \to \text{Area (Sq.Ft)} \to \text{Rate (/Sq.Ft)} \to \text{Total Price} \to \text{Availability}$.
- **Multi-Unit Sizing Conversions**: Auto-calculated values in **Sq.Ft, Cents, Grounds, Sq.Meters, Acres, and Guntas**.
- **🚗 Free Site Visit Booking**: Schedule site inspections with optional complimentary cab pickup & drop.

### 2. 🔐 Luxury Sign In & Staff Authentication
- **Two-in-One Auth Modal**:
  - **Sign In**: With 1-Click Instant Demo Logins (`Director/Admin`, `Portfolio Manager`, `Sales Officer`, `Customer`).
  - **Create Account**: Public user and buyer registration with instant session creation.
- **👥 Team Members Management**: Admin/Manager can invite staff, assign granular roles (`ADMIN`, `MANAGER`, `EMPLOYEE`, `VIEWER`), and set credentials.

### 3. 🤖 AI Real Estate Concierge with WhatsApp Alerts
- **AI Property Assistant**: Grounded in 58 surveyed plots, legal approvals (DTCP/RERA/CMDA), and pricing tiers (**₹850/sq.ft** standard, **₹900/sq.ft** for Plots 2 & 3).
- **Automatic Human Escalation**: Detects price negotiation, custom discounts, or bank loan inquiries and **dispatches an automated WhatsApp alert to the RKS sales team (`+91 98400 11223`)**!

### 4. 📊 6-Step Excel/CSV Import Wizard & Exporter
- **Import Pipeline**: File Upload $\to$ Structural Inspection $\to$ Column Auto-Mapping $\to$ Strict Validation $\to$ Live Staging Preview $\to$ Database Commit.
- **Excel & CSV Export**: Export inventory with formatted Indian currency numbers (₹).

---

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet Maps, Canvas Confetti.
- **Backend**: Node.js, Express, TypeScript, JWT, BCrypt, Zod, Multer, XLSX.
- **Database**: PostgreSQL (PGlite embedded relational engine with full SQL support).
- **Deployment**: Vercel Serverless & Static SPA (`vercel.json`), Node.js unified production server.

---

## 🚀 Quick Start (Local Setup)

```bash
# 1. Install all dependencies
npm --prefix server install
npm --prefix client install

# 2. Start development servers
# Terminal 1: Backend API (Port 5000)
npm run dev:server

# Terminal 2: Frontend UI (Port 5173)
npm run dev:client
```

Open **`http://localhost:5173`** in your browser.

---

## 🚢 Production Deployment

```bash
# Build production client and server
npm run build

# Start unified production server (Port 5000, 0.0.0.0)
npm start
```

---

## 🧪 Test Suites

```bash
# Run relational database & API tests
npx tsx server/src/test-api.ts

# Run WhatsApp notification & AI Concierge tests
npx tsx server/src/test-ai-chat.ts

# Run authentication & member registration tests
npx tsx server/src/test-auth-members.ts
```

---

## 👥 Demo Credentials

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Director (Admin)** | `admin@rks.com` | `admin123` | Full inventory control, team management, delete, import, export, settings |
| **Portfolio Manager** | `manager@rks.com` | `manager123` | Edit rates, add properties, view reports, manage team members |
| **Sales Officer** | `employee@rks.com` | `employee123` | View inventory, manage site visits, update reservation status |
| **Customer / Viewer** | `viewer@rks.com` | `viewer123` | Browse properties, book site visits, chat with AI concierge |
