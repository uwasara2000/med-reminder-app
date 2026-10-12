# 💊 DoseCare - Medication Reminder App (Elderly & Universal Friendly)

An accessible, fail-safe medication reminder application built with **React Native (Expo)** on the frontend and **Node.js + Express.js** on the backend. Designed specifically for everyone, especially the elderly, to take their medications reliably, prevent missed doses, keep family caregivers informed, and track pill stock.

---

## 🌟 Key Features

1. **👴 Senior-Friendly Accessible UI**:
   - High-contrast color themes (WCAG AAA compliant).
   - Extra-large fonts and big touch targets (buttons $\ge 56\text{px}$).
   - Clear visual pill representations (tablet, capsule, syrup, inhaler, drops with color badges).
   - Dynamic Senior Mode switch.

2. **🔊 Voice & Text-to-Speech (TTS) Announcements**:
   - Speaks aloud reminders clearly at a comfortable cadence:
     > *"It is 08:00 AM. Time for your Lisinopril, 10mg (1 pink tablet) before your meal. Remember to take in the morning with a full glass of water."*
   - "Read Today's Doses" button to review all pending pills verbally.

3. **⏰ Fail-Safe Alarms & Dosing Tracker**:
   - Categorized by time of day: 🌅 **Morning**, ☀️ **Afternoon**, 🌆 **Evening**, 🌙 **Night**.
   - One-Tap Quick Actions: **TAKE NOW** (decrements stock & logs timestamp), **SNOOZE 15m**, **SKIP**.
   - Fullscreen alarm modal with vibration and voice announcement loop.

4. **👩‍⚕️ Caregiver & Family Sync**:
   - 6-character patient link code (e.g. `CARE88`).
   - Remote caregiver dashboard showing adherence score, taken/missed count, and missed-dose alerts.

5. **📦 Inventory & Refill Warnings**:
   - Automatic pill count decrement on every taken dose.
   - Refill alerts when stock falls below safety threshold ($\le 5$ pills).
   - 1-tap refill restock logging.

6. **🚨 Emergency & Doctor Quick-Dial**:
   - One-touch phone dialing for cardiologist, primary doctor, pharmacist, and family emergency contacts.

---

## 🏗️ Project Structure

```
med-reminder-app/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Auth, Medications, Schedules, Caregivers, Emergency
│   │   ├── db/               # JSON-persistent database layer (ACID-safe)
│   │   ├── middleware/       # JWT Authentication guard
│   │   ├── routes/           # REST API routes (/api/auth, /api/medications, /api/schedules, etc.)
│   │   ├── utils/            # Auth helpers (bcrypt, jwt) & Preloaded seed data
│   │   └── server.js         # Main Express app
│   ├── test/                 # Automated API test suite
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/       # DoseCard, PillVisualizer, AlarmModal, Header
    │   ├── context/          # AuthContext, MedicationContext
    │   ├── screens/          # HomeScreen, AddMedication, Prescriptions, Adherence, Caregiver, Login, Settings
    │   ├── services/         # Axios API, SpeechService (TTS), NotificationService
    │   └── theme/            # Accessible colors & Senior typography scaling
    ├── App.js                # Navigation & Provider root
    ├── app.json              # Expo configuration
    └── package.json
```

---

## 🚀 Getting Started

### 1. Start the Backend API (Node.js + Express)

```bash
cd "C:\Users\Uwasara Gunathunga\.gemini\antigravity\scratch\med-reminder-app\backend"
npm install
npm run seed     # (Auto-seeds with demo patient Arthur & caregiver Sarah)
npm start        # Starts server on http://localhost:5000
```

To run the automated backend test suite:
```bash
npm test
```

### 2. Start the Frontend App (React Native with Expo)

```bash
cd "C:\Users\Uwasara Gunathunga\.gemini\antigravity\scratch\med-reminder-app\frontend"
npm install
npx expo start
```

- Press **`w`** in the terminal to open in your Web Browser.
- Or scan the QR code with the **Expo Go** app on your physical iPhone or Android device.
- Press **`a`** for Android Emulator or **`i`** for iOS Simulator.

---

## 🔑 Demo Accounts (Ready to Test Out-of-the-Box)

The app comes with **1-Tap Quick Demo buttons** on the login screen:

1. **👴 Patient Account (Arthur Pendelton)**
   - **Email**: `arthur@example.com`
   - **Password**: `password123`
   - **Caregiver Code**: `CARE88`
   - **Prescriptions**: Lisinopril (Blood Pressure), Metformin (Diabetes), Glucosamine (Joints), Melatonin (Sleep Aid - low stock warning).

2. **👩‍⚕️ Caregiver Account (Sarah Pendelton)**
   - **Email**: `sarah@example.com`
   - **Password**: `password123`
   - **Monitors**: Arthur's live adherence and low-stock medications.
