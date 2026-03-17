# PULSE — Mobile App
## Team BIND | CSU AI Hackathon 2026

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Expo-specific packages
npx expo install expo-font expo-router expo-linear-gradient expo-splash-screen expo-status-bar
npx expo install @expo-google-fonts/dm-sans @expo-google-fonts/dm-serif-display
npx expo install react-native-svg
npx expo install @react-native-async-storage/async-storage

# 3. Set your LAN IP in services/api.ts
# Replace YOUR_LOCAL_IP with output of: ifconfig (Mac) or ipconfig (Windows)
# Example: const BASE_URL = 'http://192.168.1.42:5000';

# 4. Start the Flask backend (from pulse/ directory)
python run.py

# 5. Start Expo
npx expo start

# 6. Scan QR code with Expo Go app on your iPhone
```

---

## File Structure

```
app/
  _layout.tsx          ← Font loading, root Stack
  index.tsx            ← Onboarding redirect
  onboarding.tsx       ← Screen 01
  (tabs)/
    _layout.tsx        ← 5-tab bottom bar
    home.tsx           ← Screen 02: Dashboard
    log.tsx            ← Screen 03: Log Concern
    timeline.tsx       ← Screen 08: Timeline
    labs.tsx           ← Screen 09: Lab Results
    profile.tsx        ← Screen 11: Profile
  body-map.tsx         ← Screen 04: Body Map
  visit-prep.tsx       ← Screen 05: AI Visit Prep
  doctor-notes.tsx     ← Screen 06: Doctor Notes
  notes-extracted.tsx  ← Screen 07: Extraction Result
  loading.tsx          ← Screen 10: AI Processing

components/
  BodyMap.tsx          ← Tappable SVG body diagram (14 zones)
  ui/                  ← 15 shared components

constants/
  theme.ts             ← Colors, Fonts, Radius, FontSize
  bodyZones.ts         ← SVG zone definitions

services/
  api.ts               ← All Flask API calls (UPDATE BASE_URL)
```

---

## Demo Sequence (3-Minute Pitch)

1. **Timeline tab** — 7 days of escalating ankle data already seeded
2. **Log tab** — tap **🎯 Demo: Run Day 8 Agent Chain**
3. App navigates to **loading screen** (agents running)
4. **Visit Prep screen** appears with escalation + 5 questions
5. Navigate to **Doctor Notes** → paste note → Extract → Timeline

### Backup
If the backend is unreachable, every screen has graceful fallback to mock data.
The app will never crash on a failed API call.

---

## Pre-Demo Checklist

- [ ] `python run.py` running — green in terminal
- [ ] `GET /api/health` returns `{ ibm_ready: true }`
- [ ] `BASE_URL` in `services/api.ts` set to LAN IP
- [ ] Expo Go open on iPhone, QR scanned
- [ ] App open on **Log** tab, ready to tap Demo button
- [ ] Backup video ready on separate device
- [ ] 8-day ankle data visible on Timeline tab

---

## Team

| Name | Role | Files |
|------|------|-------|
| Christopher | PM + Pitch | slides, README, demo script |
| John | AI/ML Lead | granite.py, prep_agent.py |
| Han | AI/ML + Integration | extractor_agent.py, routes.py |
| Seth | Backend | app.py, config.py, storage.py |
| Frontend Dev | Frontend | index.html → this repo |

---

*Powered by IBM watsonx Orchestrate + IBM Granite*
*PULSE does not diagnose. It remembers, organizes, and advocates.*
