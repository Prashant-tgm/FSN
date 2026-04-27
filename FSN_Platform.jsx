import { useState, useEffect, useRef } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');`;

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green-900: #0D2B1D;
    --green-800: #14532D;
    --green-700: #166534;
    --green-600: #16A34A;
    --green-100: #DCFCE7;
    --green-50: #F0FDF4;
    --amber-700: #B45309;
    --amber-600: #D97706;
    --amber-400: #FBBF24;
    --amber-100: #FEF3C7;
    --amber-50: #FFFBEB;
    --red-600: #DC2626;
    --red-100: #FEE2E2;
    --sky-600: #0284C7;
    --sky-100: #E0F2FE;
    --purple-600: #7C3AED;
    --purple-100: #EDE9FE;
    --cream: #FAFAF5;
    --warm-white: #FFFFFF;
    --stone-900: #1C1917;
    --stone-700: #44403C;
    --stone-500: #78716C;
    --stone-300: #D6D3D1;
    --stone-200: #E7E5E4;
    --stone-100: #F5F5F4;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.10);
  }
  body { font-family: var(--font-body); background: var(--cream); color: var(--stone-900); line-height: 1.6; }
  button { cursor: pointer; font-family: var(--font-body); }
  input, select, textarea { font-family: var(--font-body); }
  a { text-decoration: none; color: inherit; }
  .scroll-lock { overflow: hidden; }
`;

const mockProblems = [
  { id: "p1", title: "Contaminated Drinking Water in Rajouri Villages", category: "water", location: { village: "Rajouri", state: "J&K" }, urgency: "critical", status: "open", description: "Three villages in Rajouri district have been facing severe water contamination issues for over 2 years. The only water source is a shared well that has tested positive for arsenic and bacterial contamination. Over 800 families are affected, with rising cases of waterborne illness in children under 12.", peopleAffected: 3200, upvoteCount: 142, solutionCount: 4, tags: ["water", "contamination", "rural", "health"], postedBy: { name: "Priya Singh", role: "ngo", org: "WaterFirst India" }, media: [], createdAt: "2026-02-14", featured: true },
  { id: "p2", title: "Crop Loss Due to Irregular Monsoon — Marathwada Farmers", category: "agriculture", location: { village: "Aurangabad", state: "Maharashtra" }, urgency: "high", status: "in_progress", description: "Smallholder farmers in Marathwada are losing 40–60% of kharif crop yields due to erratic rainfall patterns. Traditional farming methods offer no drought resistance. 1,200 farm families face food insecurity and debt cycles. A low-cost, scalable water retention and crop diversification solution is urgently needed.", peopleAffected: 5000, upvoteCount: 98, solutionCount: 7, tags: ["agriculture", "drought", "farming", "climate"], postedBy: { name: "Amit Patil", role: "bop_user" }, media: [], createdAt: "2026-01-28", featured: true },
  { id: "p3", title: "No Secondary School Within 30km — Sundargarh Tribal Belt", category: "education", location: { village: "Sundargarh", state: "Odisha" }, urgency: "high", status: "open", description: "Children from 14 tribal villages in Sundargarh district have no access to secondary education. The nearest government school is 32 km away — unreachable without transport. Girls are disproportionately affected, with most dropping out after Class 8. The community needs a hybrid learning solution that works with limited electricity and no internet.", peopleAffected: 640, upvoteCount: 76, solutionCount: 3, tags: ["education", "tribal", "girls", "offline"], postedBy: { name: "Nandita Behera", role: "ngo", org: "EduReach NGO" }, media: [], createdAt: "2026-03-02", featured: false },
  { id: "p4", title: "Women Unable to Access Healthcare During Pregnancy", category: "health", location: { village: "Barmer", state: "Rajasthan" }, urgency: "critical", status: "open", description: "In remote Barmer villages, over 200 pregnant women annually cannot access antenatal care due to social restrictions and lack of women health workers. The nearest PHC is 45 km away. Maternal mortality in this block is 3x the national average. A community-based, women-led health monitoring solution is needed.", peopleAffected: 800, upvoteCount: 115, solutionCount: 5, tags: ["health", "maternal", "women", "remote"], postedBy: { name: "Dr. Fatima Khan", role: "ngo", org: "Sehat Saheli" }, media: [], createdAt: "2026-02-20", featured: true },
  { id: "p5", title: "Open Defecation & Lack of Community Sanitation in Bundelkhand", category: "water", location: { village: "Jhansi", state: "Uttar Pradesh" }, urgency: "medium", status: "under_trial", description: "Despite government schemes, 6 villages in Jhansi district still lack functional community toilets. Existing structures are unusable due to poor construction and no water supply. The community needs a low-cost, maintainable sanitation model that villagers can manage themselves.", peopleAffected: 2100, upvoteCount: 54, solutionCount: 2, tags: ["sanitation", "ODF", "infrastructure"], postedBy: { name: "Suresh Kumar", role: "bop_user" }, media: [], createdAt: "2026-03-10", featured: false },
  { id: "p6", title: "Fishing Community Losing Livelihood to Climate Change", category: "livelihood", location: { village: "Nagapattinam", state: "Tamil Nadu" }, urgency: "high", status: "open", description: "Coastal fishing communities in Nagapattinam are facing declining fish yields due to changing ocean temperatures. Traditional nets and boat designs are no longer effective. 300 fishing families urgently need an affordable solution to maintain income — whether through modified techniques, diversified livelihoods, or early-warning weather tools.", peopleAffected: 1200, upvoteCount: 88, solutionCount: 6, tags: ["fishing", "livelihood", "coastal", "climate"], postedBy: { name: "Muthu Selvam", role: "bop_user" }, media: [], createdAt: "2026-01-15", featured: false },
  { id: "p7", title: "Lack of Cold Storage Causing Post-Harvest Losses in Chhattisgarh", category: "agriculture", location: { village: "Raipur", state: "Chhattisgarh" }, urgency: "medium", status: "solved", description: "Vegetable farmers in 8 villages near Raipur lose 35–50% of their tomato and onion harvest annually due to lack of affordable cold storage. Produce spoils within 48 hours of harvest. A community-shared, low-electricity cold storage solution could save lakhs of rupees in annual losses.", peopleAffected: 900, upvoteCount: 67, solutionCount: 4, tags: ["agriculture", "post-harvest", "cold-storage"], postedBy: { name: "Rekha Verma", role: "ngo", org: "Krishi Vikas" }, media: [], createdAt: "2025-11-20", featured: false },
  { id: "p8", title: "No Electricity in 12 Villages — Solar Microgrid Needed", category: "energy", location: { village: "Dantewada", state: "Chhattisgarh" }, urgency: "high", status: "in_progress", description: "12 villages in Dantewada, including several Adivasi hamlets, have been off-grid for years. Government grid extension has been delayed. Students cannot study after sunset, health centres cannot refrigerate vaccines, and women walk miles for kerosene. A solar microgrid solution appropriate for sub-100W per household demand is urgently needed.", peopleAffected: 3500, upvoteCount: 131, solutionCount: 8, tags: ["energy", "solar", "off-grid", "tribal"], postedBy: { name: "Anjali Naidu", role: "ngo", org: "Urja Samiti" }, media: [], createdAt: "2026-03-18", featured: true },
];

const mockSolutions = {
  p1: [
    { id: "s1", title: "Low-Cost Bio-Sand Filtration System", submittedBy: { name: "Rohan Mehta", role: "innovator", university: "IIT Bombay" }, description: "A community-scale bio-sand filter constructed from locally available materials — sand, gravel, and PVC piping — removes 99% of bacterial contamination and reduces arsenic to safe levels. The filter requires no electricity, costs ₹3,800 per unit, and serves 15–20 families. We have successfully piloted this in Bihar.", status: "accepted", impactScore: 78, upvoteCount: 64, techTags: ["Water Treatment", "DIY", "Low-Cost"], costEstimate: 3800, createdAt: "2026-02-20" },
    { id: "s2", title: "Solar-Powered Reverse Osmosis Unit", submittedBy: { name: "Priya Nair", role: "innovator", university: "NIT Calicut" }, description: "A community RO unit powered by 2 solar panels. Removes arsenic, fluoride, and bacteria. Produces 500L/day of clean water. Capital cost ₹45,000, zero running cost. We can help source components at NGO pricing.", status: "submitted", impactScore: 65, upvoteCount: 41, techTags: ["Solar", "RO", "Community"], costEstimate: 45000, createdAt: "2026-03-01" },
  ],
  p2: [
    { id: "s3", title: "Polyhouse Drip Irrigation + Crop Diversification Model", submittedBy: { name: "Vikram Rao", role: "innovator", university: "VNIT Nagpur" }, description: "A subsidised polyhouse tunnel with integrated drip irrigation reduces water consumption by 60% while enabling year-round cultivation of high-value vegetables. Combined with crop diversification training, this model increased farmer income by 40% in our Vidarbha pilot.", status: "under_trial", impactScore: 82, upvoteCount: 89, techTags: ["Drip Irrigation", "Polyhouse", "AgriTech"], costEstimate: 22000, createdAt: "2026-02-05" },
  ],
  p8: [
    { id: "s4", title: "50W Solar Home System with BatteryCluster", submittedBy: { name: "Deepak Joshi", role: "innovator", university: "IIT Delhi" }, description: "A modular 50W solar panel with a shared battery cluster (12V 100Ah lithium) serves 5 households. The system powers 4 LED lights, phone charging, and a small fan per home. Total cost ₹18,000 for a 5-household cluster — ₹3,600 per family. Local youth can be trained for maintenance in 3 days.", status: "accepted", impactScore: 91, upvoteCount: 112, techTags: ["Solar", "Off-Grid", "Community Energy"], costEstimate: 18000, createdAt: "2026-03-25" },
  ],
};

const mockBlogs = [
  { id: "b1", slug: "bio-sand-filter-rajouri", title: "How a ₹3,800 Filter Is Changing Lives in Rajouri", author: { name: "Rohan Mehta", avatar: "RM", role: "innovator" }, category: "innovation_story", excerpt: "What started as a final-year project became a pilot that now serves 400 families. Here's the full story of designing, failing, and finally deploying a bio-sand filter in rural J&K.", clapCount: 214, readTime: 8, publishedAt: "2026-04-02", featured: true },
  { id: "b2", slug: "co-creation-lessons", title: "5 Lessons from 6 Months of Co-Creating with Farmers", author: { name: "Vikram Rao", avatar: "VR", role: "innovator" }, category: "field_report", excerpt: "The most important thing I learned in Marathwada wasn't about irrigation — it was about listening. Co-creation is not a checkbox. It is everything.", clapCount: 187, readTime: 6, publishedAt: "2026-03-22", featured: false },
  { id: "b3", slug: "wall-of-fame-gold-2026", title: "FSN Gold 2026: Meet the 3 Solutions That Proved It", author: { name: "FSN Editorial", avatar: "FE", role: "admin" }, category: "field_report", excerpt: "Three solutions earned Gold on the FSN Wall of Fame this year. All three were born from problems posted by communities. All three were built with communities. This is their story.", clapCount: 342, readTime: 10, publishedAt: "2026-04-10", featured: true },
  { id: "b4", slug: "solar-microgrid-dantewada", title: "Dantewada Has Light Now", author: { name: "Deepak Joshi", avatar: "DJ", role: "innovator" }, category: "innovation_story", excerpt: "After 14 months and 3 failed designs, the solar microgrid in Dantewada's 12 villages is live. Here's an honest account of what worked, what didn't, and what we learned.", clapCount: 298, readTime: 12, publishedAt: "2026-04-08", featured: true },
];

const wallOfFame = [
  { id: "w1", tier: "gold", solution: { title: "Solar BatteryCluster Microgrid", innovator: "Deepak Joshi", university: "IIT Delhi" }, problem: { title: "No Electricity — Dantewada", category: "energy" }, impact: "3,500 people powered. 12 villages. 14 months.", impactScore: 91, year: 2026 },
  { id: "w2", tier: "gold", solution: { title: "Polyhouse Drip Model", innovator: "Vikram Rao", university: "VNIT Nagpur" }, problem: { title: "Marathwada Crop Loss", category: "agriculture" }, impact: "40% income increase for 1,200 farm families.", impactScore: 87, year: 2026 },
  { id: "w3", tier: "silver", solution: { title: "Bio-Sand Filtration System", innovator: "Rohan Mehta", university: "IIT Bombay" }, problem: { title: "Contaminated Water — Rajouri", category: "water" }, impact: "400 families have clean water daily.", impactScore: 78, year: 2026 },
  { id: "w4", tier: "silver", solution: { title: "Community RO Unit", innovator: "Priya Nair", university: "NIT Calicut" }, problem: { title: "Water Crisis — Bihar", category: "water" }, impact: "250 families served. Under trial.", impactScore: 65, year: 2026 },
  { id: "w5", tier: "bronze", solution: { title: "Mobile Health Worker App", innovator: "Arun Kumar", university: "IIIT Hyderabad" }, problem: { title: "Maternal Health — Barmer", category: "health" }, impact: "Community feedback ongoing.", impactScore: 52, year: 2026 },
  { id: "w6", tier: "bronze", solution: { title: "Shared Cold Storage Unit", innovator: "Sneha Gupta", university: "BIT Mesra" }, problem: { title: "Post-Harvest Losses — Chhattisgarh", category: "agriculture" }, impact: "8 villages. Pilot complete.", impactScore: 48, year: 2025 },
];

const CATEGORIES = ["All", "agriculture", "health", "water", "education", "livelihood", "infrastructure", "energy", "other"];
const URGENCY = ["All", "critical", "high", "medium", "low"];
const STATUS = ["All", "open", "in_progress", "under_trial", "solved"];

const categoryColors = {
  agriculture: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  health: { bg: "#FEE2E2", text: "#991B1B", dot: "#DC2626" },
  water: { bg: "#E0F2FE", text: "#075985", dot: "#0284C7" },
  education: { bg: "#EDE9FE", text: "#5B21B6", dot: "#7C3AED" },
  livelihood: { bg: "#DCFCE7", text: "#166534", dot: "#16A34A" },
  infrastructure: { bg: "#F3F4F6", text: "#374151", dot: "#6B7280" },
  energy: { bg: "#FEF9C3", text: "#854D0E", dot: "#CA8A04" },
  other: { bg: "#F5F5F4", text: "#57534E", dot: "#78716C" },
};

const urgencyColors = { critical: "#DC2626", high: "#D97706", medium: "#2563EB", low: "#16A34A" };
const tierConfig = {
  gold: { label: "Gold", bg: "#FEF9C3", border: "#CA8A04", text: "#713F12", star: "★★★" },
  silver: { label: "Silver", bg: "#F1F5F9", border: "#94A3B8", text: "#334155", star: "★★" },
  bronze: { label: "Bronze", bg: "#FEF3C7", border: "#D97706", text: "#78350F", star: "★" },
};

function Badge({ category }) {
  const c = categoryColors[category] || categoryColors.other;
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {category}
    </span>
  );
}

function UrgencyPill({ urgency }) {
  const colors = { critical: { bg: "#FEE2E2", text: "#991B1B" }, high: { bg: "#FEF3C7", text: "#92400E" }, medium: { bg: "#E0F2FE", text: "#075985" }, low: { bg: "#DCFCE7", text: "#166534" } };
  const c = colors[urgency] || colors.low;
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {urgency}
    </span>
  );
}

function StatusPill({ status }) {
  const map = { open: { label: "Open", bg: "#DCFCE7", text: "#166534" }, in_progress: { label: "In Progress", bg: "#E0F2FE", text: "#075985" }, under_trial: { label: "Under Trial", bg: "#EDE9FE", text: "#5B21B6" }, solved: { label: "Solved", bg: "#DCFCE7", text: "#14532D" }, closed: { label: "Closed", bg: "#F5F5F4", text: "#57534E" } };
  const s = map[status] || map.open;
  return <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>{s.label}</span>;
}

function Avatar({ name, size = 36, bg = "#166534" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.35, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function ProblemCard({ problem, onClick }) {
  return (
    <div onClick={() => onClick(problem)} style={{ background: "#fff", borderRadius: 16, border: "1px solid #E7E5E4", padding: "20px 22px", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 12 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Badge category={problem.category} />
          <UrgencyPill urgency={problem.urgency} />
        </div>
        <StatusPill status={problem.status} />
      </div>
      <div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "#1C1917", lineHeight: 1.4, marginBottom: 6 }}>{problem.title}</h3>
        <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{problem.description}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Avatar name={problem.postedBy.name} size={24} bg="#166534" />
        <span style={{ fontSize: 12, color: "#78716C" }}>{problem.postedBy.name}</span>
        {problem.postedBy.role === "ngo" && <span style={{ fontSize: 11, background: "#DCFCE7", color: "#166534", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>NGO ✓</span>}
      </div>
      <div style={{ borderTop: "1px solid #F5F5F4", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ fontSize: 12, color: "#78716C", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
            {problem.upvoteCount}
          </span>
          <span style={{ fontSize: 12, color: "#78716C", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            {problem.solutionCount} solutions
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#A8A29E" }}>📍 {problem.location.village}, {problem.location.state}</span>
      </div>
    </div>
  );
}

function SolutionCard({ solution, expanded = false }) {
  const statusColors = { accepted: { bg: "#DCFCE7", text: "#166534" }, submitted: { bg: "#E0F2FE", text: "#075985" }, under_trial: { bg: "#EDE9FE", text: "#5B21B6" }, implemented: { bg: "#FEF9C3", text: "#713F12" }, rejected: { bg: "#FEE2E2", text: "#991B1B" } };
  const sc = statusColors[solution.status] || statusColors.submitted;
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "#1C1917", lineHeight: 1.4 }}>{solution.title}</h4>
        <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{solution.status.replace("_", " ")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Avatar name={solution.submittedBy.name} size={26} bg="#D97706" />
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1917" }}>{solution.submittedBy.name}</span>
          <span style={{ fontSize: 11, color: "#78716C" }}> · {solution.submittedBy.university}</span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.65, marginBottom: 12 }}>{solution.description}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {solution.techTags.map(t => (
          <span key={t} style={{ background: "#F5F5F4", color: "#44403C", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{t}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#78716C" }}>💰 ₹{solution.costEstimate?.toLocaleString()} est.</span>
          <span style={{ fontSize: 12, color: "#78716C" }}>▲ {solution.upvoteCount}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: "#78716C" }}>Impact Score</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: solution.impactScore >= 80 ? "#16A34A" : solution.impactScore >= 60 ? "#D97706" : "#78716C" }}>{solution.impactScore}</span>
        </div>
      </div>
    </div>
  );
}

function Navbar({ page, setPage, setAuthModal }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = [
    { label: "Problems", id: "problems" },
    { label: "Wall of Fame", id: "wall-of-fame" },
    { label: "Blog", id: "blog" },
  ];
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,245,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setPage("landing")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #166534, #14532D)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="#fff" /><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="#fff" strokeWidth="1.5" /><path d="M12 8v4M12 16h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#14532D", letterSpacing: "-0.01em" }}>FSN</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {navLinks.map(l => (
            <button key={l.id} onClick={() => setPage(l.id)} style={{ background: "none", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: page === l.id ? "#14532D" : "#57534E", cursor: "pointer", transition: "all 0.15s", background: page === l.id ? "#DCFCE7" : "none" }}>
              {l.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setAuthModal("login")} style={{ background: "none", border: "1px solid #D6D3D1", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "#44403C", cursor: "pointer" }}>Log in</button>
          <button onClick={() => setAuthModal("register")} style={{ background: "#166534", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Join FSN</button>
        </div>
      </div>
    </nav>
  );
}

function LandingPage({ setPage, onProblemClick }) {
  const stats = [
    { label: "Problems Posted", value: "500+", icon: "🌾" },
    { label: "Solutions Submitted", value: "300+", icon: "💡" },
    { label: "Communities Reached", value: "180+", icon: "🏘️" },
    { label: "Impact Score Avg", value: "71/100", icon: "📊" },
  ];
  const howItWorks = [
    { step: "01", title: "Post a Problem", desc: "Communities & NGOs document grassroots challenges with photos, location, and structured details.", color: "#E0F2FE", accent: "#0284C7" },
    { step: "02", title: "Innovators Respond", desc: "Students, researchers & professionals browse, evaluate, and submit co-designed solutions.", color: "#DCFCE7", accent: "#16A34A" },
    { step: "03", title: "Co-Create Together", desc: "Innovators and problem-holders collaborate in a shared workspace with messaging and tasks.", color: "#FEF3C7", accent: "#D97706" },
    { step: "04", title: "Measure Real Impact", desc: "Structured feedback loops validate deployed solutions. Proven impact earns Wall of Fame recognition.", color: "#EDE9FE", accent: "#7C3AED" },
  ];
  const featured = mockProblems.filter(p => p.featured).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E7E5E4", padding: "80px 24px 72px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 20, padding: "5px 14px", marginBottom: 24, fontSize: 12, fontWeight: 600, color: "#166534" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
            Now live — Phase 2 with Co-Creation Hub
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 700, lineHeight: 1.18, color: "#1C1917", marginBottom: 20, letterSpacing: "-0.02em" }}>
            Where Grassroots Problems<br />
            <span style={{ color: "#166534" }}>Meet Real Solutions</span>
          </h1>
          <p style={{ fontSize: 17, color: "#57534E", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 36px", fontWeight: 300 }}>
            FSN connects BOP communities and NGOs with student innovators — enabling structured problem documentation, co-created solutions, and validated real-world impact.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setPage("problems")} style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Browse Problems →
            </button>
            <button onClick={() => setPage("wall-of-fame")} style={{ background: "#fff", color: "#166534", border: "1px solid #D6D3D1", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
              View Wall of Fame ★
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#14532D", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 2 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "20px 16px" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#86EFAC", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "72px 24px", background: "#FAFAF5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, color: "#1C1917", marginBottom: 10 }}>How FSN Works</h2>
            <p style={{ fontSize: 15, color: "#78716C", maxWidth: 480, margin: "0 auto" }}>A transparent, collaborative process from problem discovery to proven impact</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
            {howItWorks.map(h => (
              <div key={h.step} style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 16, padding: "24px 22px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: h.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: h.accent }}>{h.step}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, marginBottom: 8, color: "#1C1917" }}>{h.title}</h3>
                <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.65 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Problems */}
      <section style={{ padding: "64px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "#1C1917" }}>Featured Problems</h2>
              <p style={{ fontSize: 14, color: "#78716C", marginTop: 4 }}>Real challenges from communities that need your attention</p>
            </div>
            <button onClick={() => setPage("problems")} style={{ background: "none", border: "1px solid #D6D3D1", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#57534E", cursor: "pointer" }}>View all →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {featured.map(p => <ProblemCard key={p.id} problem={p} onClick={onProblemClick} />)}
          </div>
        </div>
      </section>

      {/* WoF Teaser */}
      <section style={{ padding: "64px 24px", background: "#14532D" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Wall of Fame</h2>
          <p style={{ fontSize: 15, color: "#86EFAC", lineHeight: 1.7, marginBottom: 28 }}>Solutions that have demonstrably changed lives earn Bronze, Silver, or Gold recognition. Real impact. Public proof.</p>
          <button onClick={() => setPage("wall-of-fame")} style={{ background: "#D97706", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>See Recognized Solutions ★</button>
        </div>
      </section>

      {/* Recent Blog */}
      <section style={{ padding: "64px 24px", background: "#FAFAF5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "#1C1917" }}>From the Field</h2>
              <p style={{ fontSize: 14, color: "#78716C", marginTop: 4 }}>Stories, learnings, and insights from FSN innovators</p>
            </div>
            <button onClick={() => setPage("blog")} style={{ background: "none", border: "1px solid #D6D3D1", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#57534E", cursor: "pointer" }}>Read all →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {mockBlogs.filter(b => b.featured).map(b => (
              <div key={b.id} style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 16, padding: "22px", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em" }}>{b.category.replace("_", " ")}</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "#1C1917", lineHeight: 1.4 }}>{b.title}</h3>
                <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.6, flex: 1 }}>{b.excerpt.slice(0, 110)}...</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={b.author.name} size={22} bg="#166534" />
                    <span style={{ fontSize: 11, color: "#78716C" }}>{b.author.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#A8A29E" }}>👏 {b.clapCount} · {b.readTime} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 24px", background: "#fff", borderTop: "1px solid #E7E5E4" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "#1C1917", marginBottom: 10 }}>Have a Problem? Have a Solution?</h2>
          <p style={{ fontSize: 15, color: "#78716C", marginBottom: 28, lineHeight: 1.7 }}>Whether you're from a community facing a challenge, an NGO documenting ground-level issues, or a student with an idea — FSN is your platform.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Post a Problem</button>
            <button style={{ background: "#fff", color: "#1C1917", border: "1px solid #D6D3D1", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Submit a Solution</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProblemsPage({ onProblemClick }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = mockProblems.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase()));
    const matchCat = catFilter === "All" || p.category === catFilter;
    const matchUrgency = urgencyFilter === "All" || p.urgency === urgencyFilter;
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchCat && matchUrgency && matchStatus;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "most_upvoted") return b.upvoteCount - a.upvoteCount;
    if (sortBy === "most_solutions") return b.solutionCount - a.solutionCount;
    if (sortBy === "most_urgent") { const u = { critical: 4, high: 3, medium: 2, low: 1 }; return u[b.urgency] - u[a.urgency]; }
    return 0;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "#1C1917", marginBottom: 6 }}>Problem Feed</h1>
        <p style={{ fontSize: 14, color: "#78716C" }}>Browse {mockProblems.length} documented challenges from communities across India</p>
      </div>

      {/* Search + Sort */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A8A29E" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search problems, tags..." style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "9px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13, background: "#fff", cursor: "pointer" }}>
          <option value="newest">Newest</option>
          <option value="most_upvoted">Most Upvoted</option>
          <option value="most_solutions">Most Solutions</option>
          <option value="most_urgent">Most Urgent</option>
        </select>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", padding: "12px 14px", background: "#fff", border: "1px solid #E7E5E4", borderRadius: 10 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600, marginRight: 2 }}>CATEGORY</span>
          {CATEGORIES.slice(0, 6).map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ background: catFilter === c ? "#166534" : "#F5F5F4", color: catFilter === c ? "#fff" : "#57534E", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: catFilter === c ? 600 : 400 }}>{c}</button>
          ))}
        </div>
        <div style={{ width: 1, background: "#E7E5E4", margin: "0 4px" }} />
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600, marginRight: 2 }}>URGENCY</span>
          {URGENCY.map(u => (
            <button key={u} onClick={() => setUrgencyFilter(u)} style={{ background: urgencyFilter === u ? "#D97706" : "#F5F5F4", color: urgencyFilter === u ? "#fff" : "#57534E", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: urgencyFilter === u ? 600 : 400 }}>{u}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, color: "#78716C" }}>{filtered.length} problem{filtered.length !== 1 ? "s" : ""} found</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
        {filtered.map(p => <ProblemCard key={p.id} problem={p} onClick={onProblemClick} />)}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "#A8A29E" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 15 }}>No problems match your filters. Try adjusting the search.</p>
        </div>
      )}
    </div>
  );
}

function ProblemDetailPage({ problem, onBack }) {
  const solutions = mockSolutions[problem.id] || [];
  const [tab, setTab] = useState("overview");
  const [showSolutionForm, setShowSolutionForm] = useState(false);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 13, color: "#78716C", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
        ← Back to Problems
      </button>

      {/* Header */}
      <div style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 16, padding: "28px 28px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <Badge category={problem.category} />
          <UrgencyPill urgency={problem.urgency} />
          <StatusPill status={problem.status} />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "#1C1917", lineHeight: 1.3, marginBottom: 14 }}>{problem.title}</h1>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #F5F5F4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar name={problem.postedBy.name} size={30} bg="#166534" />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1917" }}>{problem.postedBy.name}</span>
              {problem.postedBy.org && <span style={{ fontSize: 12, color: "#78716C" }}> · {problem.postedBy.org}</span>}
            </div>
            {problem.postedBy.role === "ngo" && <span style={{ fontSize: 11, background: "#DCFCE7", color: "#166534", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>NGO ✓</span>}
          </div>
          <span style={{ fontSize: 12, color: "#A8A29E" }}>📍 {problem.location.village}, {problem.location.state}</span>
          <span style={{ fontSize: 12, color: "#A8A29E" }}>📅 {problem.createdAt}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "People Affected", value: problem.peopleAffected?.toLocaleString() || "N/A", color: "#FEE2E2", tcolor: "#991B1B" },
            { label: "Upvotes", value: problem.upvoteCount, color: "#DCFCE7", tcolor: "#166534" },
            { label: "Solutions", value: problem.solutionCount, color: "#EDE9FE", tcolor: "#5B21B6" },
          ].map(m => (
            <div key={m.label} style={{ background: m.color, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.tcolor, fontFamily: "var(--font-display)" }}>{m.value}</div>
              <div style={{ fontSize: 11, color: m.tcolor, opacity: 0.8, fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {problem.tags.map(t => <span key={t} style={{ background: "#F5F5F4", color: "#44403C", fontSize: 11, padding: "3px 8px", borderRadius: 6 }}>#{t}</span>)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid #E7E5E4", paddingBottom: 0 }}>
        {["overview", "solutions", "co-create"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", padding: "8px 16px", fontSize: 13.5, fontWeight: tab === t ? 600 : 400, color: tab === t ? "#166534" : "#78716C", cursor: "pointer", borderBottom: tab === t ? "2px solid #166534" : "2px solid transparent", marginBottom: -1, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 14, padding: "24px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Full Description</h2>
          <p style={{ fontSize: 14, color: "#44403C", lineHeight: 1.8 }}>{problem.description}</p>
          <div style={{ marginTop: 20, padding: 16, background: "#FFFBEB", borderRadius: 10, border: "1px solid #FEF3C7" }}>
            <p style={{ fontSize: 13, color: "#92400E", fontWeight: 500 }}>📌 This problem is verified and needs attention. If you have a solution idea, submit it to help this community.</p>
          </div>
        </div>
      )}

      {tab === "solutions" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: "#57534E", fontWeight: 500 }}>{solutions.length} solution{solutions.length !== 1 ? "s" : ""} submitted</span>
            <button onClick={() => setShowSolutionForm(!showSolutionForm)} style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Submit Solution</button>
          </div>
          {showSolutionForm && (
            <div style={{ background: "#fff", border: "1px solid #BBF7D0", borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Submit Your Solution</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Solution title" style={{ padding: "9px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13 }} />
                <textarea placeholder="Describe your approach, materials, and estimated cost..." rows={4} style={{ padding: "9px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13, resize: "vertical" }} />
                <input placeholder="Technology tags (e.g., Solar, IoT, Low-Cost)" style={{ padding: "9px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Submit</button>
                  <button onClick={() => setShowSolutionForm(false)} style={{ background: "#F5F5F4", color: "#57534E", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {solutions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#A8A29E", background: "#fff", borderRadius: 14, border: "1px solid #E7E5E4" }}>
              <p>No solutions yet. Be the first innovator to respond!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {solutions.map(s => <SolutionCard key={s.id} solution={s} />)}
            </div>
          )}
        </div>
      )}

      {tab === "co-create" && (
        <div style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Co-Creation Hub</h2>
          <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.7, marginBottom: 16 }}>Connect directly with the problem poster or an NGO facilitator to co-design and iterate on your solution. The shared workspace gives you messaging, task tracking, and file sharing.</p>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>✅ This problem has an NGO facilitator available — {problem.postedBy.org || "direct contact"}</p>
          </div>
          <button style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Request Co-Creation →</button>
        </div>
      )}
    </div>
  );
}

function WallOfFamePage() {
  const [tierFilter, setTierFilter] = useState("all");
  const filtered = tierFilter === "all" ? wallOfFame : wallOfFame.filter(w => w.tier === tierFilter);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #14532D 0%, #0D2B1D 100%)", borderRadius: 20, padding: "40px 36px", marginBottom: 32, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Wall of Fame</h1>
        <p style={{ fontSize: 15, color: "#86EFAC", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>Solutions that have demonstrably changed lives. Validated by communities. Recognized by FSN.</p>
      </div>

      {/* Tier Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["all", "gold", "silver", "bronze"].map(t => (
          <button key={t} onClick={() => setTierFilter(t)} style={{ background: tierFilter === t ? (t === "gold" ? "#CA8A04" : t === "silver" ? "#94A3B8" : t === "bronze" ? "#D97706" : "#166534") : "#fff", color: tierFilter === t ? "#fff" : "#57534E", border: `1px solid ${tierFilter === t ? "transparent" : "#D6D3D1"}`, borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: tierFilter === t ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
            {t === "gold" ? "★★★ Gold" : t === "silver" ? "★★ Silver" : t === "bronze" ? "★ Bronze" : "All Tiers"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {filtered.map(entry => {
          const tc = tierConfig[entry.tier];
          return (
            <div key={entry.id} style={{ background: "#fff", border: `2px solid ${tc.border}`, borderRadius: 16, padding: "22px 22px 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, background: tc.bg, borderBottomLeftRadius: 12, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: tc.text }}>{tc.star} {tc.label}</div>
              <div style={{ marginTop: 8 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "#1C1917", lineHeight: 1.4, marginBottom: 6 }}>{entry.solution.title}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Avatar name={entry.solution.innovator} size={28} bg="#166534" />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1917" }}>{entry.solution.innovator}</span>
                    <span style={{ fontSize: 11, color: "#78716C" }}> · {entry.solution.university}</span>
                  </div>
                </div>
                <div style={{ background: "#F5F5F4", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "#78716C" }}>Problem solved: </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#1C1917" }}>{entry.problem.title}</span>
                </div>
                <p style={{ fontSize: 13, color: "#44403C", lineHeight: 1.6, marginBottom: 12 }}>✅ {entry.impact}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#78716C" }}>FSN {entry.year}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#78716C" }}>Impact Score</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: entry.impactScore >= 80 ? "#16A34A" : entry.impactScore >= 60 ? "#D97706" : "#78716C", fontFamily: "var(--font-display)" }}>{entry.impactScore}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlogPage({ onPostClick }) {
  const [catFilter, setCatFilter] = useState("all");
  const cats = ["all", "field_report", "innovation_story", "how_to", "research", "opinion"];
  const filtered = catFilter === "all" ? mockBlogs : mockBlogs.filter(b => b.category === catFilter);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "#1C1917", marginBottom: 6 }}>Knowledge Platform</h1>
        <p style={{ fontSize: 14, color: "#78716C" }}>Field reports, innovation stories, and lessons from the ground</p>
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{ background: catFilter === c ? "#166534" : "#fff", color: catFilter === c ? "#fff" : "#57534E", border: "1px solid #D6D3D1", borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontWeight: catFilter === c ? 600 : 400, textTransform: "capitalize" }}>{c.replace("_", " ")}</button>
        ))}
      </div>

      {/* Featured post */}
      {catFilter === "all" && mockBlogs[0] && (
        <div onClick={() => onPostClick(mockBlogs[0])} style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 18, padding: "28px 28px", marginBottom: 24, cursor: "pointer", display: "grid", gridTemplateColumns: "1fr 200px", gap: 24, alignItems: "center" }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#DCFCE7", borderRadius: 20, padding: "3px 10px", marginBottom: 10, fontSize: 11, fontWeight: 600, color: "#166534" }}>FEATURED</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#1C1917", lineHeight: 1.3, marginBottom: 10 }}>{mockBlogs[0].title}</h2>
            <p style={{ fontSize: 14, color: "#57534E", lineHeight: 1.7, marginBottom: 14 }}>{mockBlogs[0].excerpt}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={mockBlogs[0].author.name} size={28} bg="#166534" />
              <span style={{ fontSize: 12, color: "#78716C" }}>{mockBlogs[0].author.name} · {mockBlogs[0].readTime} min read</span>
              <span style={{ fontSize: 12, color: "#A8A29E" }}>👏 {mockBlogs[0].clapCount}</span>
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #14532D, #166534)", borderRadius: 12, height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>💧</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
        {filtered.map(b => (
          <div key={b.id} onClick={() => onPostClick(b)} style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 16, padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em" }}>{b.category.replace(/_/g, " ")}</span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "#1C1917", lineHeight: 1.4, flex: 1 }}>{b.title}</h3>
            <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.6 }}>{b.excerpt.slice(0, 100)}...</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar name={b.author.name} size={22} bg="#166534" />
                <span style={{ fontSize: 11, color: "#78716C" }}>{b.author.name}</span>
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E" }}>👏 {b.clapCount} · {b.readTime}m</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogPostPage({ post, onBack }) {
  const [claps, setClaps] = useState(post.clapCount);
  const [clapped, setClapped] = useState(false);
  const handleClap = () => { if (!clapped) { setClaps(c => c + 1); setClapped(true); } };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 13, color: "#78716C", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
        ← Back to Blog
      </button>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em" }}>{post.category.replace(/_/g, " ")}</span>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, color: "#1C1917", lineHeight: 1.25, marginBottom: 20 }}>{post.title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #E7E5E4" }}>
        <Avatar name={post.author.name} size={36} bg="#166534" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1917" }}>{post.author.name}</div>
          <div style={{ fontSize: 12, color: "#78716C" }}>{post.publishedAt} · {post.readTime} min read</div>
        </div>
      </div>
      <div style={{ fontSize: 15.5, color: "#1C1917", lineHeight: 1.85, marginBottom: 32 }}>
        <p style={{ marginBottom: 18 }}>{post.excerpt}</p>
        <p style={{ marginBottom: 18 }}>The journey began in late 2024, when a brief post on a community forum caught the attention of a final-year engineering student. "I was scrolling through problem listings on FSN and I came across this one. 800 families. Contaminated water. I couldn't scroll past it," Rohan recalled.</p>
        <p style={{ marginBottom: 18 }}>The first prototype failed. The second iteration was better but leaked under pressure. By the third design — built in a garage with locally sourced PVC and sand — something worked. The bio-sand filter removed 99% of bacterial contamination and reduced arsenic to safe levels.</p>
        <blockquote style={{ borderLeft: "3px solid #166534", paddingLeft: 16, margin: "24px 0", color: "#44403C", fontStyle: "italic", fontSize: 15 }}>
          "The moment the first family drank clean water from our filter, everything else — the failed prototypes, the sleepless nights — ceased to matter."
        </blockquote>
        <p style={{ marginBottom: 18 }}>Today, 47 filters are deployed across 3 villages. Rohan has trained 8 local youth to build and maintain the units. The total cost per filter remains under ₹4,000. The impact score on FSN reached 78 — earning a Silver on the Wall of Fame.</p>
        <p>For anyone considering doing the same: the technology is the easy part. The community is everything. Build with them, not for them.</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", background: "#fff", border: "1px solid #E7E5E4", borderRadius: 12 }}>
        <button onClick={handleClap} style={{ background: clapped ? "#DCFCE7" : "#F5F5F4", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, color: clapped ? "#166534" : "#57534E", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          👏 {claps}
        </button>
        <span style={{ fontSize: 13, color: "#78716C" }}>{clapped ? "Thanks for appreciating this!" : "Click to appreciate this story"}</span>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose }) {
  const [tab, setTab] = useState(mode);
  const roles = ["BOP Community Member", "NGO / Organization", "Innovator / Student"];
  const [selectedRole, setSelectedRole] = useState(roles[2]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, padding: "32px 28px", position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", fontSize: 18, color: "#78716C", cursor: "pointer" }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#14532D" }}>FSN</div>
          <p style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>Frugal Solutions Network</p>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "#F5F5F4", borderRadius: 10, padding: 4 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? "#fff" : "transparent", border: "none", borderRadius: 8, padding: "7px", fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? "#14532D" : "#78716C", cursor: "pointer", textTransform: "capitalize" }}>{t === "login" ? "Log In" : "Register"}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tab === "register" && (
            <>
              <input placeholder="Full Name" style={{ padding: "10px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13 }} />
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#78716C", marginBottom: 6, display: "block" }}>I AM A</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {roles.map(r => (
                    <button key={r} onClick={() => setSelectedRole(r)} style={{ flex: 1, background: selectedRole === r ? "#DCFCE7" : "#F5F5F4", border: `1px solid ${selectedRole === r ? "#86EFAC" : "#E7E5E4"}`, borderRadius: 8, padding: "6px 4px", fontSize: 10, fontWeight: selectedRole === r ? 600 : 400, color: selectedRole === r ? "#166534" : "#57534E", cursor: "pointer", textAlign: "center", lineHeight: 1.3 }}>{r.split(" ").slice(0, 2).join(" ")}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <input type="email" placeholder="Email address" style={{ padding: "10px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13 }} />
          <input type="password" placeholder="Password" style={{ padding: "10px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13 }} />
          {tab === "register" && <input placeholder="Phone (for OTP login)" style={{ padding: "10px 12px", border: "1px solid #D6D3D1", borderRadius: 8, fontSize: 13 }} />}
          <button style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
            {tab === "login" ? "Log In" : "Create Account"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E7E5E4" }} />
            <span style={{ fontSize: 11, color: "#A8A29E" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#E7E5E4" }} />
          </div>
          <button style={{ background: "#fff", border: "1px solid #D6D3D1", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center", color: "#1C1917" }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

function Footer({ setPage }) {
  return (
    <footer style={{ background: "#1C1917", color: "#fff", padding: "40px 24px 24px", marginTop: 0 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 28, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#86EFAC", marginBottom: 8 }}>FSN</div>
            <p style={{ fontSize: 12, color: "#A8A29E", lineHeight: 1.7 }}>Frugal Solutions Network. Connecting communities with innovators since 2026.</p>
          </div>
          {[
            { heading: "Platform", links: ["Browse Problems", "Submit Solution", "Wall of Fame", "Blog"] },
            { heading: "Community", links: ["For NGOs", "For Innovators", "For BOP Users", "Impact Reports"] },
            { heading: "Company", links: ["About FSN", "Terms", "Privacy", "Contact"] },
          ].map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#78716C", letterSpacing: "0.06em", marginBottom: 10 }}>{col.heading.toUpperCase()}</div>
              {col.links.map(l => <div key={l} style={{ fontSize: 13, color: "#D6D3D1", marginBottom: 6, cursor: "pointer" }}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #2C2A28", paddingTop: 18, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#57534E" }}>© 2026 Frugal Solutions Network. All rights reserved.</span>
          <span style={{ fontSize: 12, color: "#57534E" }}>Built with purpose. Designed for impact.</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [authModal, setAuthModal] = useState(null);

  const handleProblemClick = (problem) => {
    setSelectedProblem(problem);
    setPage("problem-detail");
    window.scrollTo(0, 0);
  };
  const handlePostClick = (post) => {
    setSelectedPost(post);
    setPage("blog-post");
    window.scrollTo(0, 0);
  };
  const handleBack = () => {
    if (page === "problem-detail") setPage("problems");
    else if (page === "blog-post") setPage("blog");
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = FONTS + GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      <Navbar page={page} setPage={(p) => { setPage(p); window.scrollTo(0, 0); }} setAuthModal={setAuthModal} />
      <main style={{ flex: 1 }}>
        {page === "landing" && <LandingPage setPage={setPage} onProblemClick={handleProblemClick} />}
        {page === "problems" && <ProblemsPage onProblemClick={handleProblemClick} />}
        {page === "problem-detail" && selectedProblem && <ProblemDetailPage problem={selectedProblem} onBack={handleBack} />}
        {page === "wall-of-fame" && <WallOfFamePage />}
        {page === "blog" && <BlogPage onPostClick={handlePostClick} />}
        {page === "blog-post" && selectedPost && <BlogPostPage post={selectedPost} onBack={handleBack} />}
      </main>
      <Footer setPage={setPage} />
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  );
}
