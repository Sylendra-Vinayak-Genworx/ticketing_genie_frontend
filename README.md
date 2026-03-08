# Ticketing Genie — React Frontend

A fully-featured, production-grade React + TypeScript + Tailwind CSS frontend for the Ticketing Genie support platform.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env

# 3. Edit .env with your API URLs
# VITE_AUTH_API_URL=http://localhost:8001/api/v1
# VITE_TICKETING_API_URL=http://localhost:8000

# 4. Start dev server
npm run dev

# 5. Visit http://localhost:5173
```

## 🏗️ Project Structure

```
src/
├── app/                   # Store, rootReducer, middleware, routes
├── assets/                # Images, fonts, icons
├── config/                # env.ts, constants.ts
├── components/
│   ├── ui/                # Badge, Avatar, Modal, SLATimer
│   └── common/            # PageHeader, LoadingSpinner, Pagination, StatusStepper
├── features/
│   ├── auth/              # Login, Signup, authSlice, authService, useAuth
│   ├── tickets/           # ticketsSlice, ticketService, useTickets
│   ├── analytics/         # analyticsService
│   ├── sla/               # slaService
│   ├── keywords/          # keywordService
│   └── users/             # (extend as needed)
├── hooks/                 # useAppDispatch, useAppSelector
├── layouts/               # DashboardLayout (sidebar + topbar)
├── lib/                   # axios.ts (interceptors, token refresh)
├── pages/                 # DashboardPage, TicketsListPage, TicketDetailPage, ...
├── services/              # (global API base types)
├── styles/                # globals.css (Tailwind)
├── types/                 # All TypeScript interfaces
└── utils/                 # formatDate, getSLAStatus, cn, ...
```

## 🎭 Role-Based Access

| Role          | Dashboard | Tickets      | Analytics | SLA | Keywords | Users |
|---------------|-----------|--------------|-----------|-----|----------|-------|
| user          | ✅        | Own only     | ❌        | ❌  | ❌       | ❌    |
| support_agent | ✅        | Assigned     | ❌        | ❌  | ❌       | ❌    |
| team_lead     | ✅        | All          | ✅        | ✅  | ✅       | ❌    |
| admin         | ✅        | All          | ✅        | ✅  | ✅       | ✅    |

## 🔐 Authentication

- JWT access token stored in `localStorage`
- Refresh token stored as HttpOnly cookie (auto-sent)
- Token auto-refreshed 60 seconds before expiry via middleware
- 401 responses trigger automatic refresh + retry via Axios interceptor

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **Vite** — fast dev server & bundler  
- **Tailwind CSS 3** — utility-first styling
- **Redux Toolkit** — state management
- **React Router v6** — client-side routing
- **Axios** — HTTP with interceptors
- **Recharts** — analytics charts
- **React Hot Toast** — toast notifications
- **date-fns** — date formatting
- **Lucide React** — icons

## 📦 Build

```bash
npm run build       # Production build
npm run preview     # Preview production build
```
