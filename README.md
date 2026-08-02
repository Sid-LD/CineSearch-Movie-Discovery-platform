# 🎬 CineSearch — Movie Discovery Platform

<div align="center">

![CineSearch Banner](https://img.shields.io/badge/CineSearch-Movie%20Discovery%20Platform-6366f1?style=for-the-badge&logo=film&logoColor=white)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Appwrite](https://img.shields.io/badge/Appwrite-BaaS-FD366E?style=flat-square&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com/)
[![TMDB](https://img.shields.io/badge/TMDB-API-01B4E4?style=flat-square&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-F55036?style=flat-square&logo=meta&logoColor=white)](https://groq.com/)

**A full-stack movie discovery app with AI chat, tiered ticket booking, and Stripe payments.**

[Features](#-features) • [Architecture](#-system-architecture) • [API Docs](#-api-endpoints) • [Setup](#-local-setup) • [Project Structure](#-project-structure)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Smart Movie Search** | Real-time debounced search across millions of movies via TMDB API |
| 🔥 **Platform Trending** | Community-driven top 5 trending — based on what *your* users actually search |
| 🎬 **Rich Movie Details** | Full info modal: backdrop, poster, rating, runtime, genres, cast, trailer |
| 🎭 **Cast & Trailers** | Top 8 cast members with headshots + official YouTube trailer playback |
| 🔐 **Authentication** | Secure sign up / login / logout via Appwrite (session-based, bcrypt hashed) |
| 📋 **Personal Watchlist** | Add / remove movies; persisted per user in Appwrite database |
| ⭐ **User Reviews** | Authenticated star ratings (1–5) and text reviews per movie |
| 🎟️ **3-Tier Ticket Booking** | VIP Recliner ($25) / Standard ($15) / Economy ($10) — individual counters |
| 💳 **Stripe Checkout** | Secure redirect to Stripe hosted page; server-side price enforcement |
| 🔒 **Per-User Tickets** | Tickets stored under user-specific localStorage key — isolated per account |
| 🤖 **CineAI Chatbot** | Floating AI assistant powered by Groq + LLaMA 3.3 70B |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              REACT FRONTEND  (Vite :5173)             │   │
│  │                                                       │   │
│  │  AuthContext (Global Auth State) ────────────────┐    │   │
│  │                                                  ▼    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐  │   │
│  │  │  Navbar  │  │ Search   │  │  MovieDetailModal   │  │   │
│  │  │  Tickets │  │ MovieCard│  │  3-Tier Booking     │  │   │
│  │  │ Watchlist│  │ Trending │  │  Reviews / Cast     │  │   │
│  │  └──────────┘  └──────────┘  └─────────────────────┘  │   │
│  │                                                       │   │
│  │  ┌─────────────────────┐  ┌──────────────────────┐   │   │
│  │  │     AuthModal       │  │   MovieChatbot (AI)  │   │   │
│  │  └─────────────────────┘  └──────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
          │               │              │             │
          ▼               ▼              ▼             ▼
  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │   APPWRITE   │  │   TMDB   │  │   GROQ   │  │ EXPRESS  │
  │   (Cloud)    │  │   API    │  │   API    │  │ BACKEND  │
  │              │  │          │  │ LLaMA 3.3│  │  :4242   │
  │ • Auth       │  │ • Search │  │  70B     │  │          │
  │ • Watchlist  │  │ • Details│  │ • Chat   │  │ Stripe   │
  │ • Reviews    │  │ • Cast   │  └──────────┘  │ Proxy +  │
  │ • Trending   │  │ • Trailers│               │ Pricing  │
  └──────────────┘  └──────────┘                └────┬─────┘
                                                      │
                                              ┌───────▼──────┐
                                              │   STRIPE     │
                                              │   (Cloud)    │
                                              │ • Checkout   │
                                              │ • Line Items │
                                              └──────────────┘
```

---

## 🔄 Data Flow Diagrams

### Movie Search Flow
```
User types "Batman"
      │
      ▼
useDebounce (500ms delay)
      │
      ▼
GET /search/movie?query=Batman  →  TMDB API
      │
      ▼
setMovieList(data.results)  →  React re-renders MovieCards
      │
      ▼ (if query has results)
updateSearchCount("batman", topResult)  →  Appwrite DB upsert
```

### 3-Tier Ticket Booking Flow
```
User selects tiers  (e.g. VIP×1, Standard×2)
      │
      ▼
POST /api/create-checkout-session
  Body: { movie, tierCounts: { vip:1, standard:2, economy:0 } }
      │
      ▼
server.js  →  build Stripe line_items (server-side prices)
  ├─ "Inception — VIP Recliner Ticket"  × 1  @ $25.00
  └─ "Inception — Standard Ticket"      × 2  @ $15.00
      │
      ▼
stripe.checkout.sessions.create({ line_items, metadata })
      │
      ▼
window.location.href = session.url  ←  Stripe Checkout page
      │
      ▼  (After successful payment)
Redirect → ?success=true&session_id=cs_xxx
      │
      ▼
GET /api/checkout-session/cs_xxx  →  retrieve metadata
      │
      ▼
Save ticket to localStorage["my_tickets_USER_ID"]
```

### Authentication Flow
```
User submits AuthModal
      │
      ├─ Sign Up  →  account.create()  →  Appwrite (bcrypt hashes password)
      │               account.createEmailPasswordSession()
      │
      ├─ Login    →  account.createEmailPasswordSession()  →  httpOnly session cookie
      │
      └─ App Load →  account.get() (reads cookie)  →  restore user in AuthContext
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | Component-based UI with HMR |
| **Styling** | Vanilla CSS | Dark theme, glassmorphism, animations |
| **Auth & DB** | Appwrite Cloud | Session auth, watchlist, reviews, trending |
| **Movie Data** | TMDB API | Movies, cast, trailers (800k+ titles) |
| **AI Chat** | Groq + LLaMA 3.3 70B | Movie recommendation chatbot |
| **Payments** | Stripe Checkout | PCI-DSS compliant hosted payment |
| **Backend** | Node.js + Express | Stripe proxy + server-side tier pricing |
| **Storage** | localStorage (per-user) | Ticket history, isolated per account |

---

## 📡 API Endpoints

### Backend API — `localhost:4242`

#### `POST /api/create-checkout-session`
Creates a Stripe Checkout Session with dynamic tiered line items.

**Request Body:**
```json
{
  "movie": {
    "id": 157336,
    "title": "Inception",
    "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"
  },
  "tierCounts": {
    "vip": 1,
    "standard": 2,
    "economy": 0
  },
  "totalTickets": 3,
  "totalPrice": 55
}
```

**Response `200`:**
```json
{
  "id": "cs_test_a1b2c3...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2..."
}
```

**Tier Pricing (server-side enforced):**

| Tier Key | Name | Price |
|---|---|---|
| `vip` | VIP Recliner Ticket 👑 | $25.00 |
| `standard` | Standard Ticket 🎬 | $15.00 |
| `economy` | Economy Ticket 🍿 | $10.00 |

> ⚠️ Prices are defined **only** in `server.js`. The client cannot override them.

---

#### `GET /api/checkout-session/:sessionId`
Retrieves a completed Stripe Checkout Session to extract ticket metadata.

**Response `200`:**
```json
{
  "id": "cs_test_a1b2c3...",
  "payment_status": "paid",
  "metadata": {
    "movieId": "157336",
    "movieTitle": "Inception",
    "moviePoster": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    "ticketCount": "3",
    "totalPrice": "55",
    "tierBreakdown": "1x VIP, 2x Standard"
  }
}
```

---

### External APIs Used

#### TMDB API (`api.themoviedb.org/3`)

| Method | Endpoint | Used For |
|---|---|---|
| `GET` | `/discover/movie?sort_by=popularity.desc` | Default movie list |
| `GET` | `/search/movie?query={q}` | Movie search |
| `GET` | `/movie/{id}` | Movie details |
| `GET` | `/movie/{id}/credits` | Cast & crew |
| `GET` | `/movie/{id}/videos` | Trailers |

#### Groq API

| Field | Value |
|---|---|
| Endpoint | `https://api.groq.com/openai/v1/chat/completions` |
| Model | `llama-3.3-70b-versatile` |
| Max Tokens | `500` |
| Temperature | `0.8` |

---

## 📁 Project Structure

```
React_Project Movie discovery app/
│
├── README.md
├── .gitignore
│
├── backend/                          ← Node.js + Express server
│   ├── .env                          ← STRIPE_SECRET_KEY, PORT, FRONTEND_URL
│   ├── package.json
│   └── server.js                     ← Tiered Stripe checkout session routes
│
└── react/                            ← React + Vite frontend
    ├── .env                          ← VITE_TMDB_API_KEY, VITE_APPWRITE_*, VITE_GROQ_API_KEY
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                   ← Root: global state, ticket management, search
        ├── main.jsx                  ← Entry point, AuthProvider wrapper
        ├── index.css                 ← Global dark theme styles + animations
        ├── appwrite.js               ← Trending analytics functions
        ├── appwriteAuth.js           ← Auth, watchlist, reviews CRUD
        │
        ├── context/
        │   └── AuthContext.jsx       ← Global auth state + useAuth hook
        │
        └── components/
            ├── Navbar.jsx            ← Logo, tickets badge, watchlist badge, user menu
            ├── Search.jsx            ← Search input
            ├── MovieCard.jsx         ← Movie poster card
            ├── MovieDetailModal.jsx  ← Details, cast, trailer, reviews, 3-tier booking
            ├── AuthModal.jsx         ← Sign up / Login form
            ├── WatchlistPage.jsx     ← Saved movies list
            ├── TicketsModal.jsx      ← Purchased ticket history (per-user)
            ├── MovieChatbot.jsx      ← CineAI floating chat widget
            └── Spinner.jsx           ← Loading spinner
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js ≥ 18, npm ≥ 9
- Accounts: [TMDB](https://www.themoviedb.org/), [Appwrite](https://appwrite.io/), [Stripe](https://stripe.com/), [Groq](https://console.groq.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/Sid-LD/CineSearch-Movie-Discovery-platform.git
cd "CineSearch-Movie-Discovery-platform"
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
FRONTEND_URL=http://localhost:5173
PORT=4242
```

```bash
npm run dev
# Backend running on http://localhost:4242
```

### 3. Frontend Setup
```bash
cd react
npm install
```

Create `react/.env`:
```env
VITE_TMDB_API_KEY=your_tmdb_bearer_token

VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_search_analytics_collection_id
VITE_APPWRITE_WATCHLIST_COLLECTION_ID=your_watchlist_collection_id
VITE_APPWRITE_REVIEWS_COLLECTION_ID=your_reviews_collection_id

VITE_GROQ_API_KEY=your_groq_api_key
```

```bash
npm run dev
# App running on http://localhost:5173
```

---

## 🔑 Environment Variables Reference

### `backend/.env`
| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (`sk_test_...`) |
| `FRONTEND_URL` | ✅ | Frontend origin for Stripe redirects |
| `PORT` | ❌ | Backend port (default: `4242`) |

### `react/.env`
| Variable | Required | Description |
|---|---|---|
| `VITE_TMDB_API_KEY` | ✅ | TMDB Read Access Token (Bearer) |
| `VITE_APPWRITE_PROJECT_ID` | ✅ | Appwrite project ID |
| `VITE_APPWRITE_DATABASE_ID` | ✅ | Appwrite database ID |
| `VITE_APPWRITE_COLLECTION_ID` | ✅ | `search_analytics` collection ID |
| `VITE_APPWRITE_WATCHLIST_COLLECTION_ID` | ✅ | `watchlist` collection ID |
| `VITE_APPWRITE_REVIEWS_COLLECTION_ID` | ✅ | `reviews` collection ID |
| `VITE_GROQ_API_KEY` | ✅ | Groq API key |

---

## 💳 Stripe Test Cards

| Scenario | Card Number | Expiry | CVV |
|---|---|---|---|
| ✅ Payment succeeds | `4242 4242 4242 4242` | Any future | Any 3 digits |
| ❌ Payment declined | `4000 0000 0000 0002` | Any future | Any 3 digits |
| 🔐 3D Secure | `4000 0025 0000 3155` | Any future | Any 3 digits |

---

## 🗄️ Appwrite Collections Schema

### `search_analytics`
| Field | Type | Description |
|---|---|---|
| `searchTerm` | String | Lowercase search query |
| `count` | Integer | Incremented each search |
| `movie_id` | Integer | TMDB ID of top result |
| `poster_url` | String | Movie poster URL |

### `watchlist`
| Field | Type | Description |
|---|---|---|
| `user_id` | String | Appwrite user `$id` |
| `movie_id` | String | TMDB movie ID |
| `title` | String | Movie title |
| `poster_url` | String | Poster image URL |
| `vote_average` | Float | TMDB rating |
| `release_date` | String | Release date |

### `reviews`
| Field | Type | Description |
|---|---|---|
| `user_id` | String | Appwrite user `$id` |
| `username` | String | Display name |
| `movie_id` | String | TMDB movie ID |
| `movie_title` | String | Movie title |
| `rating` | Integer | 1–5 stars |
| `review_text` | String | Review content |
| `created_at` | String | ISO 8601 timestamp |

---

## 🧠 Key Design Decisions

**Server-Side Price Enforcement:** Tier prices are defined only in `server.js`. The client sends ticket counts (intent) — the server sets the actual price. This prevents price manipulation via intercepted API requests.

**Per-User Ticket Isolation:** Tickets use `localStorage["my_tickets_${userId}"]`. A `useEffect([user])` reloads the correct ticket list on every account switch — preventing cross-account data leakage.

**Debounced Search:** 500ms debounce via `react-use` fires exactly 1 API call instead of 1 per keystroke — preventing rate limit exhaustion and race conditions.

**Parallel API Fetching:** `Promise.all([details, credits, videos])` fires 3 TMDB requests simultaneously — 3× faster than sequential awaits.

**Deduplication on Redirect:** `sessionId` checked against existing tickets before saving. `history.replaceState()` cleans the URL to prevent re-processing on refresh.

---

## 🚀 Deployment

### Frontend → Vercel
1. Connect GitHub repo (auto-detected as Vite)
2. Add all `VITE_*` env vars in Vercel dashboard
3. Build command: `npm run build` | Output: `dist`

### Backend → Railway / Render
1. Set root directory to `backend/`
2. Add `STRIPE_SECRET_KEY` + `FRONTEND_URL` (Vercel URL)
3. Update CORS: `app.use(cors({ origin: 'https://your-app.vercel.app' }))`

---

## 📄 License

MIT License © 2025 Siddharth

---

<div align="center">
Built with ❤️ using React, Node.js, Appwrite, Stripe & Groq
</div>
