# VoltNet - Decentralized Energy Grid Simulator - PRD

## Problem Statement
Build a modern P2P energy trading platform where users (households) can BUY or SELL surplus solar energy using a bidding system with simulated blockchain transactions and dynamic pricing. Currency in Indian Rupees (₹). Full authentication system.

## Architecture
- **Frontend**: React.js + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI (Python) + MongoDB
- **Auth**: JWT tokens (bcrypt password hashing)
- **Charts**: Recharts (AreaChart, BarChart)
- **Blockchain**: Simulated (SHA-256 hash chain)

## User Personas
1. **Energy Buyer** - Households needing to purchase clean energy
2. **Energy Seller** - Households with surplus solar energy to sell
3. **Admin** - Platform admin (admin@voltnet.com)

## Core Requirements
- Full auth (signup/login with name, email, password, address)
- Role selection (buyer/seller)
- Simulated wallet generation
- Energy order creation (buy/sell with price bidding)
- Greedy matching algorithm
- Blockchain transaction ledger
- Market stats & efficiency scoring
- Smart notifications/alerts
- INR (₹) currency throughout

## What's Been Implemented (March 27, 2026)
- [x] Landing page with hero section
- [x] Signup page (name, email, password, address)
- [x] Login page with validation
- [x] JWT authentication with session management
- [x] Role selection (buyer/seller)
- [x] Simulated wallet connect
- [x] Dashboard with welcome message, address display
- [x] Token balance (₹10,000 starting), energy balance
- [x] Price trend chart (AreaChart)
- [x] Supply vs demand chart (BarChart)
- [x] Order form (buy/sell)
- [x] Marketplace with order book
- [x] Greedy matching engine
- [x] Market efficiency score
- [x] Blockchain ledger with expandable blocks
- [x] Smart notifications (buy/sell timing, efficiency)
- [x] INR currency (₹) across all pages
- [x] Protected routes (redirect to login)
- [x] Logout functionality
- [x] Dark theme with neon green/blue

## Prioritized Backlog
### P0 (Critical) - Done
- Auth system, trading, matching, blockchain

### P1 (High)
- Multi-user demo with pre-seeded users
- Auto-refresh dashboard data on interval
- Transaction history export

### P2 (Medium)
- User profile editing
- Historical chart zoom/filter
- Order book depth visualization
- Admin panel for managing users

### P3 (Low)
- Dark/light theme toggle
- PWA support
- Email notifications simulation
- Leaderboard for top traders

## Next Tasks
1. Add auto-refresh interval on dashboard (polling)
2. Pre-seed demo users for hackathon presentation
3. Add profile edit page (update name, address)
4. Add order book depth chart visualization
