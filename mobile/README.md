# 🫀 PULSE
### *Your health, remembered.*

> An AI-powered health companion for young adults navigating healthcare on their own for the first time — built on IBM watsonx and IBM Granite.

---

<div align="center">

**[Team BIND](https://github.com/JCedrix) · CSU AI Hackathon 2026 · Powered by IBM watsonx**

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![IBM Watson](https://img.shields.io/badge/IBM_watsonx-1261FE?style=for-the-badge&logo=ibm&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

---

## 🧠 What is Pulse?

When you turn 18, you're suddenly managing your own healthcare alone. No parent reminding you, no record of what your doctor said, no idea what questions to ask.

**Pulse fixes that.**

Pulse is a mobile health companion that helps young adults log symptoms, prepare for doctor visits, understand their medical records, and build a personal health timeline — all powered by IBM Granite AI agents.

> *Pulse does not diagnose. It remembers, organizes, and advocates.*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Body Map** | Tap to log where it hurts — 24 zones, front and back view |
| 🤖 **AI Auto-Categorization** | IBM Granite suggests which specialist you need automatically |
| 📈 **Pattern Detection** | Detects escalation across your symptom history over time |
| 📋 **Visit Prep** | Generates personalized doctor questions based on your symptoms |
| 📷 **Post-Visit Upload** | Take a photo or upload a PDF of your doctor notes |
| 🔍 **AI Extraction** | IBM Granite pulls out diagnosis, prescriptions, and follow-up date |
| 📅 **Health Timeline** | Every visit, concern, and report saved to your personal record |
| 🔐 **Private Accounts** | JWT authentication — your health data belongs only to you |

---

## 🤖 The AI Agents

Pulse runs **4 IBM Granite agents** that chain together in real time.

```
User logs concern
       │
       ▼
┌─────────────────────┐
│  Agent 1            │  ← Categorizes specialist, logs concern
│  Check-in Agent     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Agent 2            │  ← Scans history, detects escalation
│  Pattern Detection  │     monitor / see_doctor / urgent
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Agent 3            │  ← Generates personalized doctor questions
│  Visit Prep Agent   │     informed by escalation decision
└─────────────────────┘

After appointment:

┌─────────────────────┐
│  Agent 4            │  ← Reads doctor notes (text, PDF, photo)
│  Extractor Agent    │     returns structured medical summary
└─────────────────────┘
```

### Agent Details

🟥 **Agent 1 — Check-in Agent** (`prep_agent.py`)
Reads your body area, description, and urgency. Uses IBM Granite to generate a personalized visit prep and auto-suggest a specialist category.

🟧 **Agent 2 — Pattern Detection Agent** (`pattern_agent.py`)
Scans your full concern history for a body area. Determines if symptoms are escalating and returns `monitor`, `see_doctor`, or `urgent` with a plain-language explanation.

🟨 **Agent 3 — Visit Prep Agent** (`prep_agent.py`)
Takes the escalation decision from Agent 2 and generates personalized questions tailored to your specific symptoms, severity, and trend.

🟦 **Agent 4 — Extractor Agent** (`extractor_agent.py`)
After your appointment, reads raw doctor notes and extracts diagnosis, prescriptions, key advice, and follow-up date in patient-friendly language.

---

## 🏗️ Tech Stack

### Frontend
- **React Native** + **Expo** — iOS and Android
- **Expo Router** — file-based navigation
- **React Native SVG** — interactive body map
- **AsyncStorage** — persistent local auth token

### Backend
- **FastAPI** — REST API
- **SQLite** — persistent user-scoped storage
- **JWT Authentication** — private health data per user
- **IBM watsonx Granite** — `ibm/granite-4-h-small` model

### AI
- **IBM watsonx AI** — all 4 agents call the Granite model directly
- Real API calls on every request — no simulated responses
- Graceful fallback to rule-based logic when IBM is unavailable

---

## 🚀 Getting Started

### Backend

```bash
cd backend
pip install fastapi "uvicorn[standard]" python-dotenv pydantic python-multipart reportlab pypdf ibm-watsonx-ai
```

Create a `.env` file in `/backend`:
```
IBM_API_KEY=your_key_here
IBM_PROJECT_ID=your_project_id_here
IBM_URL=https://us-south.ml.cloud.ibm.com/
JWT_SECRET=your_secret_here
```

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd mobile
npm install
npx expo install expo-font expo-router expo-splash-screen expo-document-picker expo-image-picker
npx expo install @expo-google-fonts/bebas-neue @expo-google-fonts/dm-sans @expo-google-fonts/dm-serif-display
npx expo install react-native-svg @react-native-async-storage/async-storage
```

Update `mobile/services/api.ts`:
```ts
export const API_BASE_URL = 'http://YOUR_IP:8000';
```

```bash
npx expo start
```

---

## 🎬 Demo Sequence

1. 🔐 **Sign up** — create your private account
2. 🗺️ **Body Map** — tap a zone, log a concern
3. 🤖 **AI Demo tab** — tap **Fire All 3 Agents** — watch the chain run live
4. 📋 **Visit Prep** — see escalation decision + personalized doctor questions
5. 📷 **Records tab** — tap **+**, upload doctor notes or take a photo
6. 🔍 **AI Extraction** — see diagnosis and prescriptions pulled out automatically
7. 📅 **Timeline** — view your complete health record

---

## 🔮 Future & Scalability

- 🌍 **Multilingual support** — IBM Granite translation for non-English speaking patients and first-generation Americans
- 🏥 **EHR integration** — Epic and MyChart connectivity so Pulse becomes part of the official medical record
- ⌚ **Wearable ingestion** — Apple Health and Fitbit for passive symptom tracking
- 📊 **Predictive escalation** — train on anonymized patterns to predict deterioration before it becomes an emergency
- 🤝 **Clinic partnerships** — Pulse as a patient intake and follow-up tool at scale

> The infrastructure is already built for it — multi-user, persistent, authenticated, AI-native from day one.

---

## 👥 Team BIND

| Name | Role |
|------|------|
| Christopher | PM + Pitch |
| John | AI/ML Lead |
| Han | AI/ML + Integration |
| Seth | Backend |

---

<div align="center">

*Powered by IBM watsonx · IBM Granite · CSU AI Hackathon 2026*

**Pulse does not diagnose. It remembers, organizes, and advocates.**

</div>