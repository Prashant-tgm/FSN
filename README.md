# FSN — Frugal Solutions Network
 
> FSN bridges BOP communities and NGOs facing hyper-local challenges with student innovators, researchers, and engineers ready to build frugal, sustainable solutions.

---

## What is FSN?

FSN (Frugal Solutions Network) is a structured, impact-driven platform that makes the process of solving ground-level problems transparent and collaborative — from problem discovery to proven, deployed solutions.

It operates on a simple but powerful belief: the communities closest to a problem understand it best, and the innovators best positioned to solve it need a structured bridge to reach them.

---

## How It Works

| Step | Who | What Happens |
|------|-----|-------------|
| **01 — Post a Problem** | BOP community members & NGOs | Document real challenges with location, urgency, affected population, and structured details |
| **02 — Innovators Respond** | Students, researchers, engineers | Browse verified problems, evaluate context, and submit co-designed solutions |
| **03 — Co-Create Together** | Both parties | Collaborate in a shared workspace with messaging, task tracking, and file sharing |
| **04 — Measure Real Impact** | FSN + Community | Structured feedback loops validate deployed solutions; proven impact earns Wall of Fame recognition |

---

## Platform Features

### Problem Feed
- Browse 500+ documented community challenges across India
- Filter by **category** (water, agriculture, health, education, livelihood, energy, infrastructure)
- Filter by **urgency** (critical / high / medium / low) and **status** (open / in-progress / under-trial / solved)
- Full-text search across titles, descriptions, and tags
- Sort by newest, most upvoted, most solutions, or most urgent

### Solution Submission
- Any registered innovator can submit solutions to open problems
- Each solution includes a title, methodology description, technology tags, and cost estimate
- Solutions receive an **Impact Score** (0–100) based on feasibility, cost, and community validation

### Co-Creation Hub
- Directly connect innovators with problem posters or NGO facilitators
- Shared workspace for iterative design — not just one-off submissions
- NGO-verified problems get a dedicated facilitator

### Wall of Fame
- Recognises solutions with **demonstrable real-world impact**
- Three tiers: **★★★ Gold**, **★★ Silver**, **★ Bronze**
- Public proof of impact with detailed community outcomes

### Knowledge Platform (Blog)
- Field reports, innovation stories, how-to guides, and research
- Written by innovators who have worked on FSN problems
- Categories: Field Report, Innovation Story, How-To, Research, Opinion

### Authentication
- Role-based registration: **BOP Community Member**, **NGO / Organisation**, **Innovator / Student**
- Email/password and Google OAuth login

---

## Repository Structure

```
FSN/
├── fsn-frontend/          # Production React/TypeScript web app
├── fsn-backend/           # API server (Node.js / TypeScript)
├── FSN_Platform.jsx       # Full-platform prototype (single-file demo)
├── .vscode/               # Editor configuration
├── LICENSE                # MIT
└── README.md
```

---

## Tech Stack

### Frontend (`fsn-frontend/`)

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Data Fetching | React Query (TanStack Query) |
| Animations | Framer Motion |
| Routing | React Router v6 |
| Architecture | Feature-folder |

### Design System

| Token | Value |
|-------|-------|
| Primary Font | Playfair Display (display / headings) |
| Body Font | Plus Jakarta Sans |
| Primary Color | Forest Green `#166534` |
| Accent Color | Warm Amber `#D97706` |
| Background | Cream `#FAFAF5` |

### Backend (`fsn-backend/`)

TypeScript-based API server. (See `/fsn-backend` for setup details.)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Frontend

```bash
cd fsn-frontend
npm install
npm run dev
```

The dev server will start at `http://localhost:5173`.

### Backend

```bash
cd fsn-backend
npm install
npm run dev
```

### Prototype (no setup required)

`FSN_Platform.jsx` is a fully self-contained React component that demonstrates the complete platform — Landing, Problem Feed, Problem Detail, Wall of Fame, Blog, and Auth — with realistic mock data. Drop it into any React sandbox (e.g. [Claude Artifacts](https://claude.ai), StackBlitz, or CodeSandbox) to run instantly.

---

## Problem Categories

| Category | Description |
|----------|-------------|
| 🌊 Water | Contamination, sanitation, access |
| 🌾 Agriculture | Crop loss, irrigation, post-harvest |
| 🏥 Health | Maternal care, remote access, community health |
| 📚 Education | Rural access, offline learning, dropout prevention |
| 💼 Livelihood | Fishing, artisans, income diversification |
| ⚡ Energy | Solar microgrids, off-grid electrification |
| 🏗️ Infrastructure | Roads, sanitation structures, connectivity |

---

## Platform Stats (Phase 2 Launch)

- **500+** problems posted
- **300+** solutions submitted
- **180+** communities reached
- **71 / 100** average impact score

---

## User Roles

**BOP Community Member** — Residents and individuals facing ground-level challenges who document problems and provide feedback on solutions.

**NGO / Organisation** — Verified organisations that post problems on behalf of communities, facilitate co-creation, and validate deployed outcomes.

**Innovator / Student** — Engineers, researchers, and students who browse problems and submit frugal, actionable solutions.

---

## Impact Scoring

Each submitted solution receives an Impact Score (0–100) based on:
- Technical feasibility and cost-effectiveness
- Community upvotes and feedback
- Deployment outcomes reported by the NGO or problem poster

Scores above **80** earn Wall of Fame eligibility.

---

## Wall of Fame — 2026 Highlights

| Tier | Solution | Innovator | Impact |
|------|----------|-----------|--------|
| ★★★ Gold | Solar BatteryCluster Microgrid | Deepak Joshi, IIT Delhi | 3,500 people powered across 12 villages |
| ★★★ Gold | Polyhouse Drip Irrigation Model | Vikram Rao, VNIT Nagpur | 40% income increase for 1,200 farm families |
| ★★ Silver | Bio-Sand Filtration System | Rohan Mehta, IIT Bombay | 400 families with daily clean water |

---

## Roadmap & Future Plans

FSN is being built across four defined phases. Phases 1 and 2 are complete or in progress. The following outlines what is planned next.

### Phase 3 — Growth *(Months 9–12)*

**Multilingual Support**
The platform will launch with English and expand to five regional Indian languages — Hindi, Tamil, Telugu, Marathi, and Bengali — to ensure BOP users in non-English-speaking communities can post problems, read solutions, and engage in their native language. Google Cloud Translation API will handle auto-translation with a human review option for accuracy.

**Android Mobile App**
A React Native app targeting Android-first (primary device for BOP and rural users) will bring the full FSN experience to mobile. The app shares a large portion of business logic with the web frontend through shared hooks and API clients.

**Offline Mode**
A critical accessibility feature for low-connectivity rural environments. Users will be able to view cached problems and compose draft submissions offline, with background sync triggering automatically on reconnection. Implementation via Workbox service workers.

**NGO Impact Reports**
NGOs will gain a dedicated reporting dashboard to download structured impact reports — covering their posted problems, solution outcomes, and community feedback data — formatted for donor reporting and internal review.

**Impact Score Algorithm (Validated)**
The impact scoring formula will be validated with NGO partners before being hardcoded. The final composite score (0–100) will weight: feedback rating (40 pts), solution adoption rate (30 pts), community endorsements from verified BOP/NGO users (20 pts), and a recency decay factor (10 pts).

---

### Phase 4 — Scale *(Year 2+)*

**iOS App**
Following Android launch and user feedback, a native iOS app will be released to broaden reach beyond Android-only users.

**AI-Powered Problem–Solution Matching**
An intelligent matching engine will surface the most relevant solutions to newly posted problems, and recommend open problems to innovators based on their skills and past submissions. The implementation approach is under evaluation — candidates include GPT-based semantic embeddings, a fine-tuned local model, and hybrid keyword + vector search.

**WhatsApp Bot for BOP Onboarding**
Given that many BOP users are not comfortable with web forms, a WhatsApp-based onboarding and problem-posting bot will allow communities to document problems through conversational messages and photos — no app download required. Integration options include Twilio WhatsApp API and Meta Cloud API.

**Grant & Funding Integration**
A funding layer will connect verified, high-impact solutions with grant opportunities, CSR funds, and social impact investors — allowing innovators and NGOs to apply for funding directly within the platform.

**Government API Integrations**
Planned integrations with government data portals and scheme databases will allow FSN to cross-reference posted problems with existing government programmes and flag potential funding or support pathways for communities.

**International Expansion**
Following a validated India-first model, FSN will open to BOP communities and innovator networks in other developing regions — beginning with South Asia and Sub-Saharan Africa.

---

### Ongoing Technical Decisions

The following architectural decisions are currently open and will be resolved during active development sprints:

| Decision | Options Under Evaluation |
|----------|--------------------------|
| Blog rich-text editor | TipTap vs BlockNote vs Quill (SSR compatibility is the deciding factor) |
| Video storage & transcoding | Direct S3 upload vs Mux / Cloudflare Stream for adaptive streaming |
| Content moderation | Human-only review vs automated hate-speech detection + human review layer |
| Impact score formula weights | Hardcoded vs NGO-partner-validated weights before v1 launch |

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## Contributing

FSN is in active development. Contributions, issue reports, and feedback are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

*Built with purpose. Designed for impact.*
