# QwikChat ⚡️💬

A **Proof of Concept** real-time group chat application built with [Qwik](https://qwik.dev/) and [QwikCity](https://qwik.dev/qwikcity/overview/), demonstrating Qwik's resumability, SSR capabilities, server actions, and full-stack features with MongoDB as the database.

🌐 **Live Demo:** [https://qwik-poc.onrender.com](https://qwik-poc.onrender.com)

---

## 🚀 Features

- **Authentication** — Username-based login with auto-registration; sessions stored as HTTP cookies (7-day expiry)
- **Chat Rooms** — Create and join multiple chat rooms; real-time-like message polling
- **Messaging** — Send, receive, delete, and clear messages with emoji support
- **Typing Indicators** — Server-side typing indicator state via API endpoints
- **User Profiles** — View and edit your profile; avatar auto-generated via DiceBear
- **Analytics Dashboard** — View total messages, total rooms, and recent message activity
- **SSR + Resumability** — All pages use Qwik's `routeLoader$` for SSR data fetching and `routeAction$` for server-side mutations

---

## 🛠️ Tech Stack

| Layer       | Technology                                                                        |
| ----------- | --------------------------------------------------------------------------------- |
| Framework   | [Qwik](https://qwik.dev/) + QwikCity                                              |
| Server      | [Express.js](https://expressjs.com/)                                              |
| Database    | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)       |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com/)                                       |
| Build Tool  | [Vite](https://vitejs.dev/)                                                       |
| Language    | TypeScript                                                                        |
| Schema (DB) | [Prisma schema](./prisma/schema.prisma) (for reference; Mongoose used at runtime) |

---

## 📁 Project Structure

```
qwik-app/
├── prisma/
│   └── schema.prisma          # DB schema reference (User, Room, RoomMember, Message)
├── public/                    # Static assets (favicon, manifest, robots.txt)
└── src/
    ├── components/
    │   ├── analytics/         # AnalyticsPanel component
    │   ├── chat/              # ChatBox, ChatInput, EmojiPicker, MessageItem, MessageList
    │   ├── router-head/       # <head> meta management
    │   └── sidebar/           # Sidebar & RoomSidebar components
    ├── lib/
    │   ├── context.ts         # Qwik context (ChatContext)
    │   ├── db.ts              # MongoDB connection + Mongoose models
    │   └── types.ts           # Shared TypeScript types
    └── routes/
        ├── index.tsx          # Root redirect (/chat or /login)
        ├── login/             # Login / auto-register page
        ├── chat/              # Chat layout + room list
        │   └── [roomId]/      # Dynamic chat room page
        ├── create/            # Create new room page
        ├── analytics/         # Analytics dashboard
        ├── profile/           # User profile page
        ├── users/             # User list + [userId] detail
        └── api/
            ├── rooms/         # REST: list / create rooms
            │   └── [roomId]/
            │       └── typing/  # Typing indicator endpoint
            └── api/messages/  # REST: send / delete / clear messages
```

---

## ⚙️ Prerequisites

- **Node.js** `^18.17.0 || ^20.3.0 || >=21.0.0`
- **MongoDB** running locally on `mongodb://localhost:27017/qwik-chat` or provide a `MONGODB_URI` env variable

---

## 🏁 Getting Started

### 1. Install dependencies

```shell
npm install
```

### 2. Configure environment

Create a `.env` file in the `qwik-app/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/qwik-chat
```

### 3. Run in development mode

```shell
npm start
# or
npm run dev
```

> Vite SSR dev server starts. Open [http://localhost:5173](http://localhost:5173)

---

## 🔨 Available Scripts

| Script            | Description                             |
| ----------------- | --------------------------------------- |
| `npm start`       | Start Vite SSR dev server               |
| `npm run build`   | Full production build (client + server) |
| `npm run preview` | Preview production build locally        |
| `npm run serve`   | Run the Express production server       |
| `npm run lint`    | Lint source files with ESLint           |
| `npm run fmt`     | Format code with Prettier               |

---

## 🏗️ Production Build & Serve

```shell
npm run build
npm run serve
```

Then visit [http://localhost:8080/](http://localhost:8080/)

---

## 🧠 Qwik Concepts Demonstrated

| Concept                          | Where used                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `routeLoader$`                   | SSR data loading in every page (chat room, analytics, profile)                       |
| `routeAction$` + `zod$`          | Form submissions with server-side validation (login, create room, send message)      |
| `server$`                        | Streaming / server-only functions for real-time message polling                      |
| `useVisibleTask$`                | Client-side side effects (polling, scroll-to-bottom)                                 |
| `useContext` / `createContextId` | Global chat context shared across components                                         |
| `useSignal` / `useStore`         | Fine-grained reactive state                                                          |
| `cacheControl`                   | Per-route cache headers (analytics: `public, max-age=60`; chat: `private, no-store`) |
| `<Resource>`                     | Async resource rendering                                                             |

---

## 📚 References

- [Qwik Docs](https://qwik.dev/)
- [QwikCity Routing](https://qwik.dev/qwikcity/routing/overview/)
- [Vite](https://vitejs.dev/)
- [Mongoose](https://mongoosejs.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
