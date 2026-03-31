# 🎵 Treblr — Music Career Simulation Game

Build your music empire one week at a time.

## Deploy to Vercel

### 1. Push to GitHub
Upload all files to a GitHub repo.

### 2. Import to Vercel
- Go to vercel.com → New Project → Import your GitHub repo
- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

### 3. Add Environment Variables
In Vercel project settings → Environment Variables, add:

```
MONGODB_URI = mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/treblr?retryWrites=true&w=majority
JWT_SECRET  = any_long_random_string
```

### 4. Deploy
Click Deploy. Done!

---

## How to Play

1. Register your artist name and pick your genre
2. Each week you get **3 actions** — spend them wisely
3. Pipeline: **Write → Record → Release** songs
4. **Promote**, **post on social**, **collaborate**, **tour** to grow
5. Click **Next Week** to advance time and see your streams
6. Watch your songs climb the **Global Top 100**
7. Respond to **random events** that can make or break your career
8. Goal: Reach **Legend** status (10M fans)

---

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Zustand, Recharts, Vite
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: MongoDB Atlas
- **Auth**: JWT

---

## Project Structure

```
treblr/
├── api/                        # Vercel serverless functions
│   ├── auth/
│   │   ├── register.js
│   │   ├── login.js
│   │   └── me.js
│   ├── game/
│   │   ├── action.js           # All 9 game actions
│   │   ├── advance-week.js     # Weekly progression
│   │   ├── state.js            # Full game state
│   │   └── event-choice.js     # Interactive events
│   ├── charts/
│   │   └── global.js
│   ├── artists/
│   │   └── leaderboard.js
│   ├── songs/
│   │   └── my.js
│   └── events/
│       └── my.js
│
├── lib/                        # Shared backend logic
│   ├── db.js                   # MongoDB connection (serverless-safe)
│   ├── cors.js                 # CORS headers
│   ├── authHelper.js           # JWT verification
│   ├── services.js             # Streaming algo, NPC system, charts, events
│   ├── gameEngine.js           # All action handlers + advanceWeek
│   └── models/
│       ├── User.js
│       ├── Song.js
│       └── models.js           # Artist, Chart, Event
│
├── src/                        # React frontend
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── lib/api.js              # Axios client
│   ├── store/gameStore.js      # Zustand global state
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   └── GamePage.jsx
│   └── components/
│       ├── layout/
│       │   ├── Sidebar.jsx
│       │   └── TopBar.jsx
│       ├── panels/
│       │   ├── Dashboard.jsx
│       │   ├── ActionsPanel.jsx
│       │   ├── StudioPanel.jsx
│       │   ├── ChartsPanel.jsx
│       │   ├── SocialPanel.jsx
│       │   ├── EventsPanel.jsx
│       │   ├── LeaderboardPanel.jsx
│       │   └── allPanels.jsx   # All panel implementations
│       └── ui/
│           └── Toast.jsx
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── vercel.json                 # Routing config
└── .env.example
```
