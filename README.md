# Markets Manager PWA

A modern, fast, and mobile-first Progressive Web App (PWA) designed for artisans, crafters, and small business owners to track market events, manage expenses, and analyze their overall profits.

Built with React and hosted on Vercel, this app uses a **Google Spreadsheet as a serverless database**, making it incredibly cost-effective (free) and easy to manage.

---

## ✨ Features
* **📱 Mobile-First PWA:** Installable directly on iOS and Android home screens for a native app experience.
* **🔐 Secure Access:** Protected by a custom PIN to keep your financial data private.
* **📅 Event Management:** Track upcoming and past markets, participation costs, income, and payment status.
* **💸 Expense Tracking:** Log general business expenses (materials, gas, equipment) separate from event fees.
* **📊 Dashboard & Statistics:** Interactive charts to visualize income, expenses, and profits by month, location, and event.
* **🔔 Smart Reminders:** Set actionable reminders for upcoming events (generates downloadable `.ics` calendar files).
* **🌍 Bilingual:** Full support for English and Italian seamlessly switchable from the UI.

---

## 🛠 Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **UI Components:** Radix UI primitives, Framer Motion (animations), Lucide React (icons), Recharts (charts)
* **State Management & i18n:** React Context / Custom Hooks, `react-i18next`
* **Backend:** Vercel Serverless Functions (`/api`)
* **Database:** Google Sheets API (via `googleapis`)

---

## 🏗 Architecture Overview
This app utilizes a serverless architecture to keep hosting costs at absolute zero while maintaining high performance.

1. **The Client:** A React Single Page Application (SPA) deployed on Vercel's Edge Network.
2. **The Proxy (Backend):** Vercel Serverless Functions (`/api/...`) securely handle incoming requests from the frontend. They authenticate the user's PIN against environment variables.
3. **The Database:** The Vercel functions securely communicate with the Google Sheets API using a Google Service Account. Your data is stored cleanly in a private Google Sheet, allowing you to manually view or export it anytime.

### Repository Structure
```text
├── api/                  # Vercel Serverless Functions (Node.js backend)
├── public/               # Static assets and PWA manifest
├── src/
│   ├── components/       # Reusable UI components (Dialogs, Nav, etc.)
│   ├── lib/              # State management and utilities
│   ├── locales/          # i18n translation files (en.json, it.json)
│   ├── pages/            # Main application screens (Reminders, Stats, etc.)
│   ├── Index.tsx         # Main entry point and routing
│   └── i18n.ts           # Translation configuration
├── .env.example          # Template for required environment variables
└── package.json          # Project dependencies
```

---

## 🚀 Setup & Deployment Guide

To deploy your own instance of this app, you need to set up a Google Service Account, prepare your Google Sheet, and deploy to Vercel.

### Step 1: Set up Google Sheets API & Service Account
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project (e.g., "Markets Manager DB").
3. Go to **APIs & Services > Library**, search for **Google Sheets API**, and click **Enable**.
4. Go to **APIs & Services > Credentials**.
5. Click **Create Credentials > Service Account**. Name it and complete the creation.
6. Once created, click on the Service Account, go to the **Keys** tab, click **Add Key > Create new key**, and select **JSON**.
7. Download the `.json` file. You will need the `client_email` and `private_key` from this file later.

### Step 2: Prepare the Google Sheet (The Database)
1. Create a new blank Google Sheet on your personal Google Drive.
2. Click **Share** in the top right corner.
3. Paste the `client_email` from your downloaded JSON file and grant it **Editor** access.
4. Rename the default tab at the bottom to `Markets`.
5. Create a second tab and name it `Expenses`.
6. Look at the URL of your Google Sheet. Copy the **Spreadsheet ID**.
   *(It's the long string of random characters between `/d/` and `/edit`)*
   `https://docs.google.com/spreadsheets/d/`**`YOUR_SPREADSHEET_ID_HERE`**`/edit`

### Step 3: Local Setup (Optional)
If you want to run the app locally on your machine:
1. Clone the repository: `git clone <your-repo-url>`
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory based on [`.env.example`](./env.example)
4. Run the development server: `npm run dev`

### Step 4: Deploy to Vercel
1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. Open the **Environment Variables** section and add the following keys exactly as they appear in your `.env` file:
   * `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   * `GOOGLE_PRIVATE_KEY` *(Ensure the string includes `\n` for line breaks exactly as formatted in the JSON file)*
   * `EXP_SHEET_NAME` & `MARKET_SHEET_NAME` *(The names of your Google Sheet tabs)*
   * `API_SECRET_PIN` *(Choose a memorable PIN for your login screen)*
5. Click **Deploy**.

🎉 **Your app is now live!** Open the Vercel URL on your phone, type your secret PIN, and tap "Add to Home Screen" to install the PWA.