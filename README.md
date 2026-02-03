# Tactical Analysis 🧠🔥

A full-stack AI-powered scouting assistant for competitive esports teams.  
Interact with a conversational analyst to get strategic insights, metrics, and counter-play recommendations using real match data from GRID.gg.

Currently supports **Valorant and League of Legends**.

---

## ✨ Features

- 💬 **Conversational AI analyst**
  - Chat with an AI scouting assistant
  - Ask natural-language questions about teams, maps, agents, and playstyles
  - Context-aware follow-up questions supported

- 🎮 **Game-aware analysis**
  - Valorant-specific understanding
  - Team tendencies, strengths, weaknesses, and macro patterns
  - Map and side-based insights

- 🤖 **AI-generated insights**
  - Playstyle breakdowns
  - Strategic advantages and vulnerabilities
  - Counter-strategy suggestions based on opponent behavior

- 📊 **On-demand metrics**
  - Series and round statistics
  - Attack, defense, and pistol performance
  - First blood rate and average round duration

- 💾 **Smart backend caching**
  - Team searches and match endstates cached on disk
  - Reduces API usage and prevents rate-limit issues
  - Faster responses for repeated queries

- 🖥️ **Chat-first UI**
  - Conversational interface instead of static reports
  - Metrics surfaced inline when relevant
  - Smooth scrolling and responsive layout

---

## 🧱 Tech Stack

### Frontend
- React + TypeScript
- Tailwind CSS
- Smooth scrolling & responsive layout

### Backend
- Node.js + Express
- GRID.gg GraphQL API
- Disk-based caching
- OpenAI (for scouting report generation)

---

## 🚀 How to Run

### Backend
```bash
cd supabase
npm install
npm run dev
```

### Frontend
```bash
cd src
npm install
npm run dev
```
