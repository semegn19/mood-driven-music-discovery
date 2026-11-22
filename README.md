# What Should I Listen To? ♫

An open-source, mood-driven music discovery platform. Built with an anti-algorithm philosophy: no accounts, no tracking, and no recommendation engines—just six distinct emotional frequencies paired with tailored visual worlds and high-performance CDN audio streaming.

---

## ✨ Features

- **Six Immersive Mood Worlds:**
  - 🌿 **Calm:** Ambient, soft folk, and slow morning frequencies.
  - 🎯 **Focused:** Minimal instrumental rhythms and signal tones for deep work.
  - 🌧️ **Melancholic:** After-hours dream pop and lonely street nocturnal soundscapes.
  - ⚡ **Energetic:** Breakbeats, indie dance, and high-adrenaline pulse.
  - 🌹 **Romantic:** Slow soul, velvet jazz, and intimate evening harmonies.
  - 💥 **Chaotic:** Unfiltered, eclectic neo-brutalist left turns and good noise.
- **Dynamic Theming & Motion:** Every mood dynamically alters the typography, grid layouts, color palettes, micro-interactions, and animations.
- **Production Audio Streaming:** Custom audio engine with persistent global playback, seek/scrub controls, volume management, previous/next track selection, and shuffle mode.
- **Global CDN Delivery:** Audio streamed directly via Supabase Storage Edge CDN using HTTP Range Requests (`206 Partial Content`) for instant start times and zero-lag seeking.
- **PostgreSQL Database Backend:** Track metadata, durations, and mood relations managed in Supabase PostgreSQL protected by Row-Level Security (RLS).
- **Keyboard Navigation:** Shortcut keys (`1`–`6` for instantaneous mood switching, `Space` for play/pause).

---

## 🏗️ Technical Architecture

```
                                  ┌───────────────────────────┐
                                  │   React 19 Client (Vite)  │
                                  └───────────┬───┬───────────┘
                                              │   │
                  1. Query Track Metadata     │   │  2. Stream Audio Chunks
                     (PostgREST / JSON)       │   │     (HTTP 206 Range)
                                              ▼   ▼
┌───────────────────────────────────────────────┐   ┌──────────────────────────────────────────┐
│             Supabase Database                 │   │          Supabase Storage CDN            │
│            (PostgreSQL 15+)                   │   │    (S3-Compatible Edge Object Storage)   │
│                                               │   │                                          │
│  - Table: public.tracks                       │   │  Bucket: "music" (Public)                │
│    (id, title, artist, mood, duration, path)  │   │  Structure: {mood}/{1..12}.mp3           │
│  - Row Level Security (RLS) policies          │   │  - Global Edge Caching                   │
│  - High-performance indexes on (mood, order)  │   │  - Partial Content (206) Byte Streaming  │
└───────────────────────────────────────────────┘   └──────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) | Component architecture & state orchestration |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | End-to-end type safety |
| **Build Tool** | [Vite 7](https://vite.dev/) | Instant HMR development and production bundling |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + Custom CSS | Design tokens, typography, and mood themes |
| **Animations** | [Motion](https://motion.dev/) | Layout transitions, gesture animations, and modal overlays |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Relational track catalog with RLS |
| **Media Delivery** | Supabase Storage CDN | Global edge audio chunk delivery (HTTP 206) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- (Optional) A free [Supabase](https://supabase.com/) account for remote cloud streaming

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mood-driven-music-discovery.git
cd mood-driven-music-discovery
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Needed only for running the automated CLI sync script (scripts/upload-audio.mjs)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

*(Note: If no Supabase credentials are provided, the application automatically falls back to static mock data so it runs out-of-the-box offline.)*

### 4. Database Setup (Supabase)

1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. This creates:
   - The `public.tracks` table with RLS read policies.
   - The `music` storage bucket with public read and upload policies.
   - Pre-seeded metadata for all 72 tracks across all 6 moods.

### 5. Uploading Audio Files

To stream real audio:
1. Place your MP3 files into a local folder: `public/music/<mood>/1.mp3`, `2.mp3`, ... `12.mp3`.
2. Run the sync command to push them to your Supabase Storage CDN:
   ```bash
   npm run sync:audio
   ```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts the Vite development server with hot-reload |
| `build` | `npm run build` | Compiles TypeScript and builds production distribution in `dist/` |
| `preview` | `npm run preview` | Previews the production build locally |
| `sync:audio` | `npm run sync:audio` | CLI utility to upload local audio files to Supabase Storage CDN |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
