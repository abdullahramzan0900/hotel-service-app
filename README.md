# Grand Sapphire Hotel — QR Guest Services System

A full-stack hotel service platform: guests scan a permanent QR code in their room to request
room service, order food, or report an issue — all without an app install. Staff manage
everything from a live admin dashboard.

## Project structure

```
hotel-service-app/
├── backend/     Node/Express API + MongoDB (via Mongoose)
└── web-app/     ONE React + SCSS app — serves both the guest QR flow (/r/:token/...)
                 and the staff dashboard (/admin/...) from a single site
```

Guests visiting `/r/<token>` see the room service / food / issue flow.
Staff visiting `/admin` see the login and dashboard.
Both run from the same dev server / same deployed site — there is only one frontend to build and host.

## How it works (recap of the design)

- **One QR code per room, printed once, never reprinted.** The QR encodes a long random
  token (e.g. `/r/8f3a9c2e...`) that the backend maps to a room number server-side. The
  room number is never trusted from anything the browser sends — it's always looked up
  from the token.
- **Every single submission** (room service / food order / issue) asks the guest fresh for
  name, email, and UK mobile number — there's no persistent login/session to manage.
- **Room active/inactive gate.** Staff check a room in/out from the dashboard. Requests are
  only accepted while a room is marked "active," so an old QR photo becomes useless the
  moment a guest checks out.
- **Priority levels.** Every room service/issue request can be marked Normal or 🔴 Urgent by
  the guest, and urgent+unresolved rows are highlighted red on the dashboard.
- **Food orders are never charged immediately.** They go in as "Pending," staff Approve or
  Reject from the dashboard, and only approved orders are added to the room's running bill.
  The guest gets an email the moment their order is approved (or rejected).
- **Live dashboard** via Socket.io — new requests/orders appear without refreshing.

## What's new in this version

- **Real menu seeded** from your printed menu (Starters, Pizza, Kids Meal, Soft Drinks,
  Chicken Dishes, Vegetarian Dishes, Sides) — with descriptions, in `backend/seed.js`
- **Menu item images hosted on Bunny.net CDN** — upload a photo per dish from the admin
  Menu page, it's stored on Bunny Storage and served via your Bunny Pull Zone
- **Pagination** on the Requests and Food Orders tables in the admin dashboard
- **Analytics & Reports page** — revenue by day, request volume by day, requests by
  type/priority, top-selling items, all via MongoDB aggregation queries, with charts
  (line/bar/pie) built using Recharts

## Setting up Bunny.net for images

1. Sign up at https://bunny.net
2. Create a **Storage Zone** (this is where images physically live)
3. Create a **Pull Zone** linked to that storage zone (this is the public CDN URL images
   get served from)
4. In the Storage Zone settings, copy the **FTP & API password** — this is your
   `BUNNY_STORAGE_API_KEY`
5. Fill in `backend/.env`:
   ```
   BUNNY_STORAGE_ZONE=your_storage_zone_name
   BUNNY_STORAGE_API_KEY=your_storage_zone_password
   BUNNY_STORAGE_REGION=          # leave blank unless you picked a specific region
   BUNNY_PULL_ZONE_URL=https://your-pull-zone.b-cdn.net
   ```
6. Restart the backend — you can now upload images per menu item from the admin dashboard's
   Menu page. Until this is configured, uploads will show a clear error message rather than
   failing silently.

## Prerequisites

- Node.js 18+ and npm installed locally

## 0. Get a MongoDB database

You need a real MongoDB instance running before starting the backend. Two easy options:

**Option A — MongoDB Atlas (free, cloud, no install)**
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Add your IP to the network access list (or allow all for testing)
3. Create a database user, then copy your connection string — looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hotel_service`

**Option B — Local MongoDB**
1. Install MongoDB Community Server: https://www.mongodb.com/docs/manual/administration/install-community/
2. Start it (`mongod`) — it'll listen on `mongodb://127.0.0.1:27017` by default

## 1. Backend setup

```bash
cd backend
npm install
```

Open `.env` and set `MONGODB_URI` to whichever connection string you got in step 0:

```
MONGODB_URI=mongodb://127.0.0.1:27017/hotel_service
# or for Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hotel_service
```

Then:

```bash
npm start       # runs on http://localhost:5000
```

The database, admin login, demo rooms (10,11,12,20,21,22,30,31,32,33), and the full menu are
created **automatically the first time the server connects** — no separate seed command needed.
On every later restart it checks first and only creates what's missing, so it's always safe to
run `npm start` again without duplicating data. (If you ever want to run the seed manually for
any reason, `npm run seed` still works standalone.)

Default admin login after first startup: **admin / admin123** — change this in production.

The `.env` file also controls:
- `JWT_SECRET` — change this to a long random string before going live
- `SMTP_*` — fill in real SMTP credentials to enable the "order approved" emails (works with
  Gmail SMTP, SendGrid, Postmark, etc. — currently a placeholder so emails will silently fail
  until configured, everything else works fine without it)
- `FRONTEND_URL` — must match wherever the web app is hosted, since this is
  the URL baked into every room's QR code

**Data storage:** all data (Rooms, Requests, FoodOrders, MenuItems, AdminUsers) is stored in
MongoDB via Mongoose models in `backend/models/`. If the backend can't reach MongoDB it will
hang trying to connect (Mongoose's default behavior) rather than crash immediately — check
that your `MONGODB_URI` is correct and that MongoDB is actually running/reachable if `npm start`
seems to hang with no "Connected to MongoDB" message.

## 2. Web app setup (guest flow + admin dashboard, one app)

```bash
cd web-app
npm install
npm run dev    # runs on http://localhost:5173
```

- Guest QR flow: `http://localhost:5173/r/<token>` — get a real token by logging into the
  admin dashboard and clicking "View QR" on any room
- Staff dashboard: `http://localhost:5173/admin` — log in with `admin / admin123`

## Generating & printing real QR codes

1. Log into the admin dashboard → **Rooms**
2. Click **"View QR"** on any room → this shows the scannable QR code and its underlying URL
3. Right-click → Save Image (or screenshot) → send to print
4. That QR is now permanent for that room. Never delete/recreate the room unless the room
   itself is being physically decommissioned.

## Guest flow

1. Guest scans the room's QR → lands on `/r/<token>`
2. If the room isn't checked in yet → sees "Room Not Currently Active"
3. Once staff check the room in → guest sees Room [number] and 3 options: Room Service,
   Order Food, Report an Issue
4. Every submission asks for name, email, UK mobile — validated both client and server side
5. Food orders go to "Pending Approval" until staff act on them

## Staff flow

1. Log into the dashboard
2. **Overview** — live counts of new requests, urgent items, pending orders, active rooms
3. **Requests** — filter New / In Progress / Resolved, update status per request
4. **Food Orders** — filter Pending / Approved / Rejected, Approve or Reject each order
   (approving adds the total to that room's bill and emails the guest)
5. **Rooms** — check guests in/out, view each room's QR, see running bill totals
6. **Menu** — add, hide, or delete food items

## Production checklist before going live

- Replace `JWT_SECRET` with a long random value
- Change the default admin password (or add a proper admin user management screen)
- Configure real SMTP credentials for order approval/rejection emails
- Set `FRONTEND_URL` to your real production domain before generating/printing QR
  codes — the token itself won't change, but the base URL is baked into the QR image, so
  generate final QR images only once the production domain is finalized
- Consider moving from lowdb to MongoDB/Postgres if traffic grows significantly
- Serve both frontends over HTTPS (required for camera-based QR scanning flows generally,
  and for guest trust)
- Add a proper reverse proxy / process manager (e.g. Nginx + PM2) in front of the backend
