# Tactical Analysis 🧠🔥

A full-stack scouting and analytics tool for competitive esports teams.  
Generates **AI-powered scouting reports and counter-strategies** using real match data from GRID.gg.

Currently supports **Valorant**

## ✨ Features

- 🔍 **Team search by name** (with aliases like SEN, FNC, LOUD)
- 📊 **Automatic match & round analysis** using GRID endstate data
- 🤖 **AI-generated scouting reports**
  - Playstyle summary
  - Strengths & weaknesses
  - Counter-strategy recommendations
- 📈 **Quick metrics dashboard**
  - Series count
  - Total rounds
  - Attack & pistol win rates
  - First blood rate
  - Average round duration
- 💾 **Backend caching**
  - Team search results
  - Match endstates (disk cache)
  - Prevents API rate-limit issues
- 🖥️ **Modern UI**
  - Side-by-side report & metrics
  - Sticky metrics panel
  - Scrollable report body for long reports
  - Smooth auto-scroll on search
- ⚡ **Fast iteration**
  - Cached data reused across requests
  - No redundant API calls

## 🧱 Tech Stack

### Frontend

- **React + TypeScript**
- Custom CSS (glassmorphism / neon style)
- Smooth scrolling & responsive layout

### Backend

- **Node.js + Express**
- GRID.gg GraphQL API
- Disk-based caching (`/cache`)
- OpenAI (for scouting report generation)

---

## 📂 Project Structure

├── backend/
│ ├── index.ts # Express server
│ ├── grid/ # GRID API helpers
│ ├── metrics/ # Match & round aggregation logic
│ ├── ai/ # AI report generation
│ └── cache/ # Cached endstates & searches
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── layout/
│ │ │ │ ├── header.tsx
│ │ │ │ └── content.tsx
│ │ ├── types/
│ │ ├── App.tsx
│ │ └── content.css
│ └── index.html
