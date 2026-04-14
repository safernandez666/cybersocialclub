# CLAUDE.md — Cyber Social Club (CSC)

## Project Overview

Cyber Social Club is a membership platform for cybersecurity professionals (CISOs, managers, analysts, partners, sponsors). Features include member registration with approval workflow, digital QR credentials, event management, and a member directory.

**Slogan:** "Where Cyber Minds Connect"

## Architecture

```
Next.js (App Router) → Vercel (serverless)
    ├── Pages: Landing, Register, Member Profile, Events, Directory
    ├── API Routes: /api/members, /api/events, /api/verify
    └── Supabase: PostgreSQL + Auth + Storage
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui + framer-motion + lucide-react
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google, LinkedIn, email/password)
- **Storage:** Supabase Storage (member photos, event images)
- **QR:** react-qrcode-logo
- **Deploy:** Vercel

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Orange | #E87B1E | Primary, CTAs, accents |
| Brown | #5C2D0E | Text, dark accents |
| Amber | #F4A834 | Highlights, gradients |
| Wine | #8B2E1A | Secondary accents |
| Dark BG | #1A0F08 | Background |

CSS variables: `--csc-orange`, `--csc-brown`, `--csc-amber`, `--csc-wine`, `--csc-dark`

## Logos

- `public/logos/logo-dark.png` — For light backgrounds (dark text)
- `public/logos/logo-light.png` — For dark backgrounds (light text)

## Commands

```bash
npm run dev       # Development server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
```

## Key Patterns

- **Dark theme by default** — warm brown tones, not cold grays
- **Member IDs:** Format `CSC-NNNN` (e.g., CSC-0001), sequential
- **Role types:** CISO, Manager, Analyst, Partner, Sponsor
- **API Routes:** `src/app/api/` — standard REST with JSON responses
- **Data fetching:** Server components where possible, client hooks for interactive pages
- **Forms:** Multi-step wizard pattern with step indicator (numbered circles)
- **Components:** Use shadcn/ui primitives, extend as needed

## Database Schema (Supabase)

```sql
-- Members
members (
  id UUID PRIMARY KEY,
  member_number TEXT UNIQUE,     -- CSC-0001
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  role_type TEXT,                 -- CISO, Manager, Analyst, Partner, Sponsor
  linkedin_url TEXT,
  years_experience INTEGER,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Events
events (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  location TEXT,
  type TEXT,                      -- meetup, conference, workshop, social
  image_url TEXT,
  max_attendees INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Event Registrations
event_registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  member_id UUID REFERENCES members(id),
  registered_at TIMESTAMP DEFAULT NOW()
)
```

## File Structure

```
src/
  app/
    page.tsx              — Landing page
    layout.tsx            — Root layout (dark theme, Inter font)
    globals.css           — Tailwind + CSC brand variables
    register/page.tsx     — 3-step registration wizard
    member/[id]/page.tsx  — Public member verification
    events/page.tsx       — Events listing (TODO)
    directory/page.tsx    — Member directory (TODO)
    api/
      members/route.ts    — Members CRUD (TODO)
      events/route.ts     — Events CRUD (TODO)
  components/
    navbar.tsx            — Top navigation
    member-card.tsx       — Digital membership card
  lib/
    utils.ts              — Utility functions
    supabase.ts           — Supabase client (TODO)
```
