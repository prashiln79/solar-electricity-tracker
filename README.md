# ☀️ Solar Electricity Tracker

A modern, universal rooftop solar monitoring and net-metering tracker app built for Indian homeowners. Powered by **React Native (Expo)**, **TypeScript**, and **Expo Router**.

Designed with **Material Design 3** aesthetics featuring a Green, White, and Yellow solar theme, complete with dynamic data visualization, settings personalization, and dark mode support.

---

## 🚀 Key Features

*   **🏠 Live Status Dashboard**: Real-time tracking of Today's Solar Generation (kWh), Current Solar Power (kW), Household Usage (kWh), Grid Imports, Grid Exports, and Net Energy balance.
*   **📊 Performance History**: Daily hourly bell curves, monthly generation blocks, yearly analytics, and monthly savings tables.
*   **🌱 Environmental & Savings Analytics**: Calculate lifetime financial returns, grid bill reduction percentages, carbon offsets (kg CO₂), and equivalent trees planted.
*   **⚙️ Customized Local Settings**: Adjust solar plant capacity size (kW), grid import rates, grid export feed-in rates (₹/kWh), installation state policies, and toggle Light/Dark color themes.
*   **📱 Universal Support**: Built for iOS, Android, and Web using responsive layout grids and native tab bars.

---

## 📐 Indian Net Metering Calculations

Under Indian DISCOM net metering guidelines, solar savings are computed dynamically across the app as follows:

1.  **Self-Consumption**: 
    $$\text{Self Consumption (kWh)} = \max(0, \text{Today's Generation} - \text{Grid Export})$$
2.  **Financial Savings (Today)**:
    $$\text{Today's Savings (₹)} = (\text{Self Consumption} \times \text{Import Tariff}) + (\text{Grid Export} \times \text{Export Tariff}) - (\text{Grid Import} \times \text{Import Tariff})$$
3.  **Carbon Offset**:
    $$\text{CO}_2 \text{ Reduced (kg)} = \text{Lifetime Generation (kWh)} \times 0.82 \text{ kg CO}_2/\text{kWh (India grid avg)}$$
4.  **Trees Equivalent**:
    $$\text{Trees Equivalent} = \frac{\text{CO}_2 \text{ Reduced (kg)}}{22 \text{ kg (avg annual absorption per tree)}}$$

---

## 📂 Project Structure

```text
solar-electricity-tracker/
├── assets/                  # PNG icons and branding graphic templates
├── src/
│   ├── app/                 # Expo Router file-based pages
│   │   ├── _layout.tsx      # Root layout wrapped with AppContextProvider
│   │   ├── index.tsx        # Home Dashboard tab
│   │   ├── history.tsx      # Daily/Monthly/Yearly charts and logs
│   │   ├── savings.tsx      # Financial & Eco statistics
│   │   └── settings.tsx     # DISCOM Tariffs & Capacity configuration
│   ├── components/          # Reusable Material UI components
│   │   ├── app-tabs.tsx     # Native bottom tab bar triggers
│   │   ├── app-tabs.web.tsx # Custom web absolute navigation bar
│   │   ├── stat-card.tsx    # Card displaying metric values & units
│   │   ├── status-card.tsx  # Interactive live inverter status
│   │   ├── summary-card.tsx # Visualized eco impact stats
│   │   └── chart-card.tsx   # Native view-based area/bar charts
│   ├── constants/
│   │   └── theme.ts         # Colors (Light/Dark mode), Spacers, & Fonts
│   └── context/
│       └── AppContext.tsx   # Global state and simulation logic provider
```

---

## ⚙️ Development Setup

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Running Locally
Run the development packager:

*   **Start Packager**: `npx expo start`
*   **Android (Emulator/Device)**: `npm run android`
*   **iOS (Simulator/Device)**: `npm run ios`
*   **Web Portal**: `npm run web`

---

## 🎨 Theme & Typography

*   **Colors**: Custom HSL tailored palettes with light/dark adaptive tokens. Focuses on **Deep Forest Green** (`#1B5E20`), **Solar Gold** (`#F5B041`), **Grid Blue** (`#1F618D`), and adaptive surface backgrounds.
*   **Aesthetics**: Glassmorphic borders, soft Material Design 3 elevations, circular symbol containers, and card progress meters.
