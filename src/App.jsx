import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const GENRES = [
  { id: "afrobeats", label: "Afrobeats", emoji: "🥁", bonus: "charisma", color: "#FF6B35" },
  { id: "hiphop",    label: "Hip-Hop",   emoji: "🎤", bonus: "hustle",   color: "#9B59B6" },
  { id: "pop",       label: "Pop",       emoji: "🌟", bonus: "talent",   color: "#E91E8C" },
  { id: "rnb",       label: "R&B",       emoji: "🎷", bonus: "network",  color: "#1DB954" },
  { id: "alt",       label: "Alternative",emoji:"🎸", bonus: "talent",   color: "#00BCD4" },
];

const CITIES = [
  { id: "lagos",   label: "Lagos",   scene: "Afrobeats Hub",     bonus: 1.3 },
  { id: "london",  label: "London",  scene: "Global Crossroads", bonus: 1.2 },
  { id: "atlanta", label: "Atlanta", scene: "Trap Capital",      bonus: 1.2 },
  { id: "accra",   label: "Accra",   scene: "Highlife Rising",   bonus: 1.1 },
  { id: "toronto", label: "Toronto", scene: "Multicultural Mix", bonus: 1.15},
];

const NPC_ARTISTS = [
  { id:"burna",   name:"Burna Boy",      genre:"afrobeats", fans:2800000, clout:92, talent:17, rivalry:0.3, collab:0.7, city:"lagos",   avatar:"🦅" },
  { id:"wizkid",  name:"Wizkid",         genre:"afrobeats", fans:3200000, clout:95, talent:18, rivalry:0.2, collab:0.8, city:"lagos",   avatar:"⭐" },
  { id:"drake",   name:"Drake",          genre:"hiphop",    fans:5000000, clout:98, talent:16, rivalry:0.4, collab:0.5, city:"toronto", avatar:"🦉" },
  { id:"kendrick",name:"Kendrick Lamar", genre:"hiphop",    fans:4200000, clout:97, talent:20, rivalry:0.5, collab:0.3, city:"atlanta", avatar:"👑" },
  { id:"sza",     name:"SZA",            genre:"rnb",       fans:3800000, clout:94, talent:19, rivalry:0.1, collab:0.9, city:"atlanta", avatar:"🌙" },
  { id:"taylorswift",name:"Taylor Swift",genre:"pop",       fans:6000000, clout:99, talent:18, rivalry:0.2, collab:0.4, city:"london",  avatar:"💛" },
  { id:"sabrina", name:"Sabrina Carpenter",genre:"pop",     fans:2500000, clout:88, talent:17, rivalry:0.2, collab:0.6, city:"london",  avatar:"🍒" },
  { id:"tyler",   name:"Tyler, The Creator",genre:"alt",    fans:3100000, clout:93, talent:20, rivalry:0.3, collab:0.5, city:"atlanta", avatar:"🌹" },
  { id:"rema",    name:"Rema",           genre:"afrobeats", fans:1900000, clout:85, talent:17, rivalry:0.2, collab:0.8, city:"lagos",   avatar:"🎯" },
  { id:"tems",    name:"Tems",           genre:"rnb",       fans:2100000, clout:87, talent:19, rivalry:0.1, collab:0.9, city:"lagos",   avatar:"🌊" },
];

const LABELS = [
  {
    id: "empire_sounds",
    name: "Empire Sounds",
    tier: "indie",
    tierLabel: "Indie Label",
    advance: 800000,
    artistSplit: 55,
    labelSplit: 45,
    marketingMult: 1.4,
    contractWeeks: 52,
    creativeControl: 85,
    minClout: 8,
    minFans: 500,
    reputation: "artist-friendly",
    desc: "Growing indie that lets artists breathe. Less money, more freedom.",
    color: "#3dffa0",
    pressureThreshold: 3,
    demands: ["1 single per quarter", "3 social posts/week"],
  },
  {
    id: "nova_records",
    name: "Nova Records",
    tier: "mid",
    tierLabel: "Mid-Size Label",
    advance: 3500000,
    artistSplit: 35,
    labelSplit: 65,
    marketingMult: 2.1,
    contractWeeks: 104,
    creativeControl: 60,
    minClout: 20,
    minFans: 3000,
    reputation: "commercial",
    desc: "Serious marketing budget. They'll push you hard but want hits.",
    color: "#5cc8ff",
    pressureThreshold: 2,
    demands: ["1 album per year", "Approve all visuals", "5 social posts/week"],
  },
  {
    id: "titan_music",
    name: "Titan Music Group",
    tier: "major",
    tierLabel: "Major Label",
    advance: 15000000,
    artistSplit: 18,
    labelSplit: 82,
    marketingMult: 4.5,
    contractWeeks: 260,
    creativeControl: 25,
    minClout: 45,
    minFans: 15000,
    reputation: "corporate",
    desc: "Global machine. Massive advances but they own your sound, image, everything.",
    color: "#f5c842",
    pressureThreshold: 1,
    demands: ["2 albums per year", "Approve all creative", "10 social/week", "Mandatory tours"],
  },
  {
    id: "apex_360",
    name: "Apex 360",
    tier: "major",
    tierLabel: "360 Deal Label",
    advance: 20000000,
    artistSplit: 12,
    labelSplit: 88,
    marketingMult: 5.0,
    contractWeeks: 312,
    creativeControl: 15,
    minClout: 55,
    minFans: 25000,
    reputation: "360-deal",
    desc: "Biggest advance in the game. They take a cut of EVERYTHING: tours, merch, brand deals.",
    color: "#ff5c7a",
    pressureThreshold: 1,
    demands: ["Full creative override", "40% of all revenue streams", "5-year lock-in"],
  },
  {
    id: "independent",
    name: "Independent",
    tier: "indie",
    tierLabel: "Independent Artist",
    advance: 0,
    artistSplit: 100,
    labelSplit: 0,
    marketingMult: 1.0,
    contractWeeks: 0,
    creativeControl: 100,
    minClout: 0,
    minFans: 0,
    reputation: "free",
    desc: "You own everything. No advance, no support — just you.",
    color: "#888",
    pressureThreshold: 99,
    demands: [],
  },
];

const LABEL_EVENTS = [
  { id:"push_single", label:"📢 Label Wants a Single", desc:"Your label is pressuring you to drop a track within 2 weeks.", pressure: true, choice: true, options:[{text:"Drop something (any quality)",effect:{pressure:-2,clout:1}},{text:"Push back",effect:{pressure:1,labelRel:-5}}] },
  { id:"creative_clash", label:"🎨 Creative Clash", desc:"Label hates your new direction. They want you to sound more commercial.", pressure: false, choice: true, options:[{text:"Comply (lose creative pts)",effect:{creativeOverride:10,fans:200,money:500000}},{text:"Stand your ground",effect:{labelRel:-8,clout:2}}] },
  { id:"promo_push", label:"🚀 Label Runs a Promo", desc:"Your label just spent big on your campaign.", pressure: false, choice: false, effect:{fans:800,clout:4,money:1000000} },
  { id:"label_beef", label:"😤 Label Dispute", desc:"Label accuses you of breach of contract over a side feature.", pressure: true, choice: true, options:[{text:"Settle (pay ₦500k)",effect:{money:-500000,labelRel:3}},{text:"Fight it legally",effect:{money:-1000000,labelRel:-10,clout:-2}}] },
  { id:"dropped", label:"🚫 You're Being Dropped", desc:"Your label says numbers aren't there. They want to let you go.", pressure: true, choice: true, options:[{text:"Accept (go independent)",effect:{dropped:true}},{text:"Renegotiate (need clout 30+)",effect:{renegotiate:true}}] },
  { id:"bonus", label:"💰 Performance Bonus", desc:"Exceeded streaming targets. Label cuts you a bonus.", pressure: false, choice: false, effect:{money:2000000,labelRel:5} },
  { id:"360_cut", label:"✂️ 360 Revenue Cut", desc:"Your 360 label just took their cut of your latest tour earnings.", pressure: true, choice: false, effect:{money:-1500000} },
  { id:"recoup_warning", label:"⚠️ Recoup Notice", desc:"Label says advance still hasn't been recouped. Pressure increases.", pressure: true, choice: false, effect:{pressure:2,labelRel:-3} },
];

const RANDOM_EVENTS = [
  { id:"viral",    label:"🔥 Went Viral",        desc:"A clip blew up. The algorithm loves you right now.",     effect:{fans:1200,clout:6},  neg:false },
  { id:"sync",     label:"🎬 Netflix Sync Deal",  desc:"Your track landed in a major series. Streams exploding.", effect:{money:8000000,fans:600,clout:4}, neg:false },
  { id:"collab_req",label:"🤝 Collab Request",   desc:"A top artist wants a feature on their album.",           effect:{fans:500,money:2000000,clout:3}, neg:false },
  { id:"beef",     label:"😤 Public Beef",        desc:"Another artist came for you on social. Handle it.",      effect:{fans:300,clout:-3},  neg:true  },
  { id:"bad_press",label:"📰 Bad Interview",      desc:"A clip went around. People are talking — not nicely.",   effect:{clout:-4,fans:-200}, neg:true  },
  { id:"stolen",   label:"😱 Studio Break-in",    desc:"Your gear got lifted. Set back the recording sessions.", effect:{money:-1500000,energy:-15}, neg:true },
  { id:"award_nom",label:"🏆 Award Nomination",   desc:"You're nominated for Best New Artist!",                  effect:{clout:10,fans:1500,money:500000}, neg:false },
  { id:"burnout",  label:"😩 Burnout",            desc:"You've been grinding too hard. Energy tanks.",           effect:{energy:-30,talent:-1}, neg:true },
  { id:"trend",    label:"📈 Genre is Trending",  desc:"Your genre just blew up. Ride the wave.",               effect:{fans:400,clout:3},   neg:false },
  { id:"fanbase",  label:"💜 Superfan Wave",      desc:"A fan community just formed around you. Loyal crowd.",  effect:{fans:700,money:300000}, neg:false },
];

const ACTIONS = [
  { id:"practice",   cat:"Music",    label:"Practice",         emoji:"🎵", cost:1, desc:"Sharpen craft",       effect:{talent:2,energy:-5},                  req:null },
  { id:"record",     cat:"Music",    label:"Record Track",     emoji:"🎙️", cost:2, desc:"Lay down new music",  effect:{tracks:1,money:-300000,energy:-10},   req:null },
  { id:"collab",     cat:"Music",    label:"Record Feature",   emoji:"🤝", cost:2, desc:"Work with an artist", effect:{tracks:1,fans:300,clout:2,energy:-12},req:"network5" },
  { id:"release_s",  cat:"Release",  label:"Drop Single",      emoji:"🚀", cost:2, desc:"Release 1 track",     effect:{fans:200,money:500000,clout:2,tracks:-1},req:"tracks1" },
  { id:"release_ep", cat:"Release",  label:"Launch EP",        emoji:"💿", cost:3, desc:"Release 3-track EP",  effect:{fans:800,money:2000000,clout:5,tracks:-3},req:"tracks3" },
  { id:"release_alb",cat:"Release",  label:"Drop Album",       emoji:"🎶", cost:3, desc:"Release full album",  effect:{fans:3000,money:8000000,clout:12,tracks:-8},req:"tracks8" },
  { id:"post",       cat:"Release",  label:"Post Content",     emoji:"📱", cost:1, desc:"Feed the algorithm",  effect:{fans:30,clout:1,energy:-5},           req:null },
  { id:"interview",  cat:"Release",  label:"Do Interview",     emoji:"🗞️", cost:1, desc:"Build press profile", effect:{fans:100,clout:2,energy:-8},          req:null },
  { id:"meet_ar",    cat:"Business", label:"Meet A&R",         emoji:"💼", cost:2, desc:"Talk to label reps",  effect:{network:2,energy:-5},                 req:"clout5" },
  { id:"merch_drop", cat:"Business", label:"Merch Drop",       emoji:"👕", cost:2, desc:"Launch merch line",   effect:{money:1500000,clout:2},               req:"fans500" },
  { id:"brand_deal", cat:"Business", label:"Brand Deal",       emoji:"🤑", cost:2, desc:"Sign a sponsorship",  effect:{money:3000000,clout:1},               req:"fans2000" },
  { id:"pay_taxes",  cat:"Business", label:"Pay Taxes",        emoji:"🧾", cost:1, desc:"Quarterly tax bill",  effect:{money:-600000},                       req:null },
  { id:"city_show",  cat:"Live",     label:"City Show",        emoji:"🎤", cost:2, desc:"Perform locally",     effect:{fans:80,money:300000,energy:-15,charisma:1},req:null },
  { id:"tour",       cat:"Live",     label:"Book Regional Tour",emoji:"🚌",cost:3, desc:"Multi-city run",      effect:{fans:2000,money:3000000,energy:-25},  req:"fans1000" },
  { id:"hire_mgr",   cat:"Team",     label:"Hire Manager",     emoji:"🤵", cost:2, desc:"Boost deal outcomes", effect:{money:-500000},                       req:"money500k", special:"manager" },
  { id:"rest",       cat:"Rest",     label:"Rest",             emoji:"😴", cost:1, desc:"Recover energy",      effect:{energy:35},                           req:null },
];

const MILESTONES = [
  { fans:0,      tier:"Bedroom Artist",   color:"#666",    bg:"rgba(102,102,102,0.1)"  },
  { fans:500,    tier:"Local Buzz",        color:"#a78bfa", bg:"rgba(167,139,250,0.12)" },
  { fans:3000,   tier:"City Known",        color:"#60a5fa", bg:"rgba(96,165,250,0.12)"  },
  { fans:15000,  tier:"National Radar",    color:"#34d399", bg:"rgba(52,211,153,0.12)"  },
  { fans:75000,  tier:"Continental Act",   color:"#fbbf24", bg:"rgba(251,191,36,0.12)"  },
  { fans:300000, tier:"Global Icon",       color:"#f87171", bg:"rgba(248,113,113,0.12)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const fmt = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
const fmtN = (n) => `₦${fmt(n)}`;
const getTier = (fans) => { let t = MILESTONES[0]; for (const m of MILESTONES) if (fans >= m.fans) t = m; return t; };
const roll = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pct = (v, total) => Math.round((v / total) * 100);

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#050508;
  --bg2:#09090F;
  --bg3:#0F0F1A;
  --border:rgba(255,255,255,0.07);
  --border2:rgba(255,255,255,0.13);
  --gold:#E8C547;
  --gold2:#F5D76E;
  --green:#2EE89A;
  --red:#FF4D6D;
  --blue:#4DAAFF;
  --purple:#B06EFF;
  --orange:#FF7043;
  --text:#EEEDF8;
  --muted:#52526E;
  --muted2:#7E7E9A;
  --card:rgba(255,255,255,0.03);
  --card2:rgba(255,255,255,0.055);
  --font-display:'Bebas Neue',sans-serif;
  --font-body:'Syne',sans-serif;
}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:16px;line-height:1.55;overflow-x:hidden}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-thumb{background:rgba(176,110,255,0.4);border-radius:2px}

/* ── NOISE + DOT GRID ── */
body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:0.5}
body::after{content:'';position:fixed;inset:0;background-image:radial-gradient(rgba(255,255,255,0.035) 1px,transparent 1px);background-size:28px 28px;pointer-events:none;z-index:0}

/* ── ONBOARDING ── */
.ob{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:40px 20px 72px;position:relative;overflow-x:hidden}
.ob-glow{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(176,110,255,0.10) 0%,transparent 65%);top:-200px;left:50%;transform:translateX(-50%);pointer-events:none;z-index:0}
.ob-glow2{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(232,197,71,0.07) 0%,transparent 65%);bottom:-60px;right:-120px;pointer-events:none;z-index:0}

.logo{font-family:var(--font-display);font-size:88px;letter-spacing:8px;line-height:1;background:linear-gradient(150deg,#F5D76E 0%,#E8C547 20%,#d4a8ff 55%,#B06EFF 75%,#6ec6ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;position:relative;z-index:1;margin-top:20px}
.logo-sub{font-size:10px;letter-spacing:9px;text-transform:uppercase;color:var(--muted2);margin-bottom:56px;z-index:1;position:relative;font-weight:600}

/* ── ONBOARDING SECTIONS ── */
.ob-section{width:100%;max-width:440px;margin-bottom:44px;z-index:1;position:relative}
.ob-section-head{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.ob-snum{font-family:var(--font-display);font-size:11px;letter-spacing:2px;color:var(--purple);background:rgba(176,110,255,0.1);border:1px solid rgba(176,110,255,0.22);border-radius:6px;padding:3px 9px}
.ob-slabel{font-family:var(--font-display);font-size:22px;letter-spacing:2.5px;text-transform:uppercase;color:var(--text)}
.ob-scheck{margin-left:auto;width:26px;height:26px;border-radius:50%;background:rgba(46,232,154,0.1);border:1.5px solid var(--green);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--green);font-weight:800;flex-shrink:0}
.ob-divider{width:100%;max-width:440px;height:1px;background:var(--border);margin-bottom:44px;z-index:1;position:relative}

.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
.sel{background:var(--bg3);border:1.5px solid var(--border);border-radius:16px;padding:20px 14px;cursor:pointer;transition:all 0.22s ease;text-align:center;position:relative;overflow:hidden;min-height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.sel::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(176,110,255,0.06),transparent);opacity:0;transition:opacity 0.22s}
.sel:hover{border-color:rgba(176,110,255,0.5);transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.4)}
.sel:hover::before{opacity:1}
.sel.on{border-color:var(--gold);background:rgba(232,197,71,0.05);box-shadow:0 0 0 1px rgba(232,197,71,0.12),0 8px 24px rgba(0,0,0,0.35)}
.sel .ico{font-size:26px;margin-bottom:8px;display:block}
.sel .sn{font-family:var(--font-display);font-size:17px;letter-spacing:1.5px;text-transform:uppercase}
.sel .ss{font-size:12px;color:var(--muted2);margin-top:4px;font-weight:600}

.name-in{width:100%;background:var(--bg3);border:1.5px solid var(--border2);border-radius:16px;padding:18px 22px;font-family:var(--font-display);font-size:30px;letter-spacing:2px;color:var(--text);outline:none;text-align:center;transition:border-color 0.2s,box-shadow 0.2s}
.name-in:focus{border-color:var(--purple);box-shadow:0 0 0 3px rgba(176,110,255,0.1)}
.name-in::placeholder{color:var(--muted)}

.stat-preview{display:flex;gap:8px;width:100%;margin-bottom:16px}
.sp{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px 8px;text-align:center;transition:border-color 0.2s}
.sp-l{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted2);margin-bottom:4px;font-weight:700}
.sp-v{font-family:var(--font-display);font-size:30px;color:var(--gold)}

.btn{width:100%;max-width:440px;background:linear-gradient(135deg,#9B4EFF 0%,#c278ff 45%,#E8C547 100%);color:#06060A;font-family:var(--font-display);font-size:18px;letter-spacing:3px;border:none;border-radius:16px;padding:18px;cursor:pointer;transition:all 0.22s;z-index:1;position:relative;margin-top:8px;font-weight:900}
.btn:hover:not(:disabled){opacity:0.9;transform:translateY(-2px);box-shadow:0 14px 36px rgba(176,110,255,0.28)}
.btn:disabled{opacity:0.18;cursor:not-allowed;transform:none}
.btn-ghost{background:transparent;border:1.5px solid var(--border2);color:var(--muted2);font-family:var(--font-display);font-size:14px;letter-spacing:2px;border-radius:12px;padding:13px 24px;cursor:pointer;transition:all 0.2s;width:100%}
.btn-ghost:hover{border-color:var(--purple);color:var(--text);background:rgba(176,110,255,0.05)}

/* ── TABS ── */
.tabs{display:flex;border-bottom:1px solid var(--border);background:rgba(9,9,15,0.96);backdrop-filter:blur(14px);position:sticky;top:0;z-index:20;padding:0 4px}
.tab{flex:1;padding:14px 4px 12px;font-family:var(--font-display);font-size:13px;letter-spacing:1.5px;color:var(--muted);border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;text-align:center}
.tab.on{color:var(--gold);border-bottom-color:var(--gold)}

/* ── HUD ── */
.hud{background:rgba(9,9,15,0.97);backdrop-filter:blur(16px);padding:14px 16px 12px;border-bottom:1px solid var(--border);position:sticky;top:49px;z-index:15}
.hud-row1{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.artist-info .aname{font-family:var(--font-display);font-size:22px;letter-spacing:2px}
.artist-info .ameta{font-size:12px;color:var(--muted2);margin-top:2px;font-weight:600}
.tier-chip{padding:4px 12px;border-radius:20px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;border:1px solid;margin-bottom:4px;text-align:right}
.week-chip{font-size:11px;color:var(--muted);text-align:right;font-weight:700}
.hud-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.hs{background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:8px 6px;text-align:center}
.hs-l{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:2px;font-weight:700}
.hs-v{font-family:var(--font-display);font-size:17px}
.energy-row{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--muted);font-weight:600}
.bar{flex:1;height:3px;background:var(--border);border-radius:2px;overflow:hidden}
.bar-f{height:100%;border-radius:2px;transition:width 0.4s}
.ap-row{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.ap-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);font-weight:700}
.ap-pips{display:flex;gap:4px}
.pip{width:12px;height:12px;border-radius:3px;border:1.5px solid var(--purple);transition:background 0.15s}
.pip.used{background:var(--purple)}

/* ── LABEL BADGE ── */
.label-badge{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:8px 12px;margin-top:8px;font-size:12px}
.lb-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.lb-name{font-weight:700;font-family:var(--font-display);letter-spacing:1px;font-size:13px}
.lb-split{color:var(--muted);font-size:11px;font-weight:600}
.lb-pressure{margin-left:auto;display:flex;gap:3px}
.lp{width:8px;height:8px;border-radius:2px;background:var(--border)}
.lp.hi{background:var(--red)}

/* ── ACTIONS SCREEN ── */
.screen{padding:16px;max-width:480px;margin:0 auto;padding-bottom:40px}
.section-title{font-family:var(--font-display);font-size:12px;letter-spacing:3px;color:var(--muted);margin-bottom:10px;margin-top:16px;text-transform:uppercase}
.actions-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ac{background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:14px 12px;cursor:pointer;transition:all 0.18s;position:relative;overflow:hidden}
.ac:hover:not(.ac-dis){border-color:rgba(176,110,255,0.5);transform:translateY(-2px);background:rgba(176,110,255,0.04);box-shadow:0 8px 22px rgba(0,0,0,0.35)}
.ac-dis{opacity:0.3;cursor:not-allowed}
.ac-cost{position:absolute;top:9px;right:9px;background:rgba(176,110,255,0.15);border:1px solid rgba(176,110,255,0.3);border-radius:6px;padding:2px 6px;font-size:10px;font-family:var(--font-display);color:var(--purple);letter-spacing:1px}
.ac-emoji{font-size:20px;margin-bottom:6px}
.ac-name{font-family:var(--font-display);font-size:14px;letter-spacing:0.5px;margin-bottom:2px}
.ac-desc{font-size:12px;color:var(--muted2);font-weight:500}
.ac-fx{font-size:10px;color:var(--green);margin-top:5px;line-height:1.5;font-weight:700}
.ac-fx.neg{color:var(--red)}
.cat-label{font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--purple);margin-bottom:6px;margin-top:14px;padding-left:2px;font-weight:700}

/* ── END WEEK ── */
.end-btn-wrap{padding:16px;max-width:480px;margin:0 auto}
.end-btn{width:100%;background:transparent;border:1.5px solid var(--gold);color:var(--gold);font-family:var(--font-display);font-size:16px;letter-spacing:4px;border-radius:14px;padding:15px;cursor:pointer;transition:all 0.2s;font-weight:900}
.end-btn:hover{background:rgba(232,197,71,0.07);box-shadow:0 0 28px rgba(232,197,71,0.14)}

/* ── LABEL SCREEN ── */
.label-card{background:var(--bg3);border:1px solid var(--border);border-radius:18px;padding:20px;margin-bottom:12px;position:relative;overflow:hidden;transition:border-color 0.2s}
.label-card.current{border-width:1.5px}
.lc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
.lc-name{font-family:var(--font-display);font-size:20px;letter-spacing:1px}
.lc-tier{font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:3px 10px;border-radius:10px;border:1px solid;font-weight:700}
.lc-desc{font-size:12px;color:var(--muted2);margin-bottom:14px;line-height:1.6;font-weight:500}
.lc-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
.lcs{background:var(--card);border-radius:10px;padding:10px}
.lcs-l{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;font-weight:700}
.lcs-v{font-family:var(--font-display);font-size:16px}
.cc-bar{height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:6px}
.cc-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--red),var(--green))}
.demands-list{font-size:12px;color:var(--muted2);margin-bottom:14px;font-weight:500}
.demand-item{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.demand-item::before{content:'·';color:var(--purple)}
.lc-btn{width:100%;background:var(--card2);border:1px solid var(--border2);color:var(--text);font-family:var(--font-display);font-size:13px;letter-spacing:2px;border-radius:12px;padding:12px;cursor:pointer;transition:all 0.2s}
.lc-btn:hover{border-color:var(--gold);color:var(--gold)}
.lc-btn.locked{opacity:0.35;cursor:not-allowed}
.current-tag{position:absolute;top:14px;right:60px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--green);border:1px solid var(--green);border-radius:6px;padding:2px 8px;font-weight:700}
.recoup-bar{margin-top:10px}
.recoup-label{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px;font-weight:700}

/* ── NPC SCREEN ── */
.npc-card{background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px;display:flex;gap:14px;align-items:flex-start;transition:border-color 0.2s}
.npc-card:hover{border-color:var(--border2)}
.npc-avatar{width:52px;height:52px;border-radius:14px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;border:1px solid var(--border)}
.npc-info{flex:1}
.npc-name{font-family:var(--font-display);font-size:17px;letter-spacing:0.5px;margin-bottom:2px}
.npc-meta{font-size:12px;color:var(--muted2);margin-bottom:8px;font-weight:500}
.npc-stats{display:flex;gap:8px;flex-wrap:wrap}
.npc-stat{font-size:10px;padding:3px 9px;background:var(--card);border-radius:6px;color:var(--muted2);border:1px solid var(--border);font-weight:700}
.npc-stat span{color:var(--text);font-weight:800}
.npc-actions{display:flex;gap:6px;margin-top:10px}
.npc-btn{flex:1;background:var(--card);border:1px solid var(--border);color:var(--muted2);font-size:11px;font-family:var(--font-display);letter-spacing:1px;border-radius:8px;padding:8px;cursor:pointer;transition:all 0.18s}
.npc-btn:hover{border-color:var(--purple);color:var(--text)}
.npc-btn.collab{border-color:rgba(46,232,154,0.3);color:var(--green)}
.npc-btn.beef{border-color:rgba(255,77,109,0.3);color:var(--red)}
.rival-tag{font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:2px 8px;border-radius:5px;border:1px solid var(--red);color:var(--red);margin-left:6px;font-weight:700}
.ally-tag{font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:2px 8px;border-radius:5px;border:1px solid var(--green);color:var(--green);margin-left:6px;font-weight:700}

/* ── FEED SCREEN ── */
.feed-item{border-left:2px solid var(--purple);padding:10px 14px;margin-bottom:8px;background:var(--card);border-radius:0 10px 10px 0;font-size:13px;animation:fadeSlide 0.3s ease;font-weight:500}
.feed-item.neg{border-left-color:var(--red)}
.feed-item.pos{border-left-color:var(--green)}
.feed-meta{font-size:10px;color:var(--muted);margin-top:3px;font-weight:700}
@keyframes fadeSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}

/* ── MODAL ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.87);display:flex;align-items:flex-end;justify-content:center;z-index:100;padding:0;backdrop-filter:blur(10px)}
.modal{background:var(--bg2);border:1px solid var(--border2);border-radius:24px 24px 0 0;padding:28px 22px 40px;width:100%;max-width:480px;animation:slideUp 0.28s ease}
@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
.modal-handle{width:36px;height:3px;background:var(--border2);border-radius:2px;margin:0 auto 20px}
.modal-emoji{font-size:44px;text-align:center;margin-bottom:10px}
.modal-title{font-family:var(--font-display);font-size:24px;letter-spacing:1px;text-align:center;margin-bottom:6px}
.modal-desc{color:var(--muted2);font-size:13px;text-align:center;margin-bottom:20px;line-height:1.65;font-weight:500}
.effect-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:22px}
.chip{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid}
.chip.pos{background:rgba(46,232,154,0.1);color:var(--green);border-color:rgba(46,232,154,0.3)}
.chip.neg{background:rgba(255,77,109,0.1);color:var(--red);border-color:rgba(255,77,109,0.3)}
.modal-choices{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.choice-btn{background:var(--bg3);border:1px solid var(--border2);color:var(--text);font-family:var(--font-display);font-size:13px;letter-spacing:1px;border-radius:12px;padding:14px 16px;cursor:pointer;transition:all 0.18s;text-align:left}
.choice-btn:hover{border-color:var(--gold);background:rgba(232,197,71,0.05)}
.modal-dismiss{width:100%;background:var(--card);border:1px solid var(--border);color:var(--muted2);font-family:var(--font-display);font-size:13px;letter-spacing:2px;border-radius:12px;padding:13px;cursor:pointer;transition:all 0.18s}
.modal-dismiss:hover{border-color:var(--purple);color:var(--text)}

/* ── TOAST ── */
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--gold);border-radius:12px;padding:10px 22px;font-family:var(--font-display);font-size:14px;letter-spacing:1px;color:var(--gold);z-index:300;white-space:nowrap;animation:toastAnim 3s ease forwards;box-shadow:0 8px 32px rgba(0,0,0,0.55)}
@keyframes toastAnim{0%{opacity:0;top:10px}10%{opacity:1;top:20px}80%{opacity:1;top:20px}100%{opacity:0;top:10px}}

/* ── STATS SCREEN ── */
.stats-section{padding:16px;max-width:480px;margin:0 auto}
.skill-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.skill-name{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted2);width:72px;flex-shrink:0;font-weight:700}
.skill-bar{flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.skill-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--purple),var(--blue));transition:width 0.5s}
.skill-val{font-family:var(--font-display);font-size:16px;color:var(--gold);width:24px;text-align:right}
.info-card{background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:10px}
.info-card-title{font-family:var(--font-display);font-size:13px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:12px}
.info-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border);font-weight:500}
.info-row:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.info-row-label{color:var(--muted2)}
.info-row-val{font-weight:700;font-family:var(--font-display);font-size:14px}
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Treblr() {
  // Onboarding
  const [screen, setScreen] = useState("onboard");
  const [aName, setAName]   = useState("");
  const [genre, setGenre]   = useState(null);
  const [city, setCity]     = useState(null);
  const [baseStats, setBaseStats] = useState({ talent:5, hustle:5, charisma:5, network:5 });

  // Game
  const [tab, setTab]       = useState("actions");
  const [week, setWeek]     = useState(1);
  const [ap, setAp]         = useState(7);
  const [gs, setGs]         = useState({ fans:0, money:5000000, clout:0, energy:100, tracks:0 });
  const [stats, setStats]   = useState({ talent:5, hustle:5, charisma:5, network:5 });
  const [label, setLabel]   = useState(LABELS.find(l=>l.id==="independent"));
  const [labelRel, setLabelRel]   = useState(80);
  const [recouped, setRecouped]   = useState(0);
  const [pressure, setPressure]   = useState(0);
  const [hasManager, setHasManager] = useState(false);
  const [npcs, setNpcs]     = useState(() => NPC_ARTISTS.map(n => ({...n, relation:"neutral", collabDone:false})));
  const [feed, setFeed]     = useState([]);
  const [modal, setModal]   = useState(null);
  const [toast, setToast]   = useState(null);
  const [prevTier, setPrevTier] = useState(MILESTONES[0].tier);
  const [taxDue, setTaxDue] = useState(0);
  const [weeklyIncome, setWeeklyIncome] = useState(0);

  const rollStats = () => {
    const b = () => Math.floor(Math.random()*4)+4;
    const s = { talent:b(), hustle:b(), charisma:b(), network:b() };
    if (genre) { const g = GENRES.find(x=>x.id===genre); if(g) s[g.bonus] = clamp(s[g.bonus]+2,1,20); }
    setBaseStats(s);
  };

  // Auto-roll stats whenever genre changes
  useEffect(() => { rollStats(); }, [genre]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),3200); };
  const addFeed = (msg, type="") => setFeed(f=>[{msg,type,wk:week},...f].slice(0,30));

  const startGame = () => {
    setStats({...baseStats});
    setScreen("game");
    addFeed(`🎵 Career starts in ${CITIES.find(c=>c.id===city)?.label}. Build from nothing.`,"");
  };

  // ── LABEL ACTIONS ──────────────────────────────────────────────────────────
  const signLabel = (lbl) => {
    if (gs.clout < lbl.minClout || gs.fans < lbl.minFans) return;
    const bonus = hasManager ? 1.15 : 1.0;
    const advance = Math.round(lbl.advance * bonus);
    setLabel(lbl);
    setLabelRel(75);
    setRecouped(0);
    setPressure(0);
    setGs(g=>({...g, money: g.money + advance}));
    addFeed(`📝 Signed to ${lbl.name}! Advance: ${fmtN(advance)}. Contract: ${lbl.contractWeeks} weeks.`,"pos");
    showToast(`SIGNED: ${lbl.name.toUpperCase()}`);
    setModal(null);
  };

  const leaveLabel = () => {
    if (label.id === "independent") return;
    const buyout = label.advance * 0.5;
    if (gs.money < buyout) { showToast("NOT ENOUGH CASH FOR BUYOUT"); return; }
    setGs(g=>({...g, money: g.money - buyout}));
    addFeed(`🚪 Left ${label.name}. Buyout cost: ${fmtN(buyout)}.`,"neg");
    setLabel(LABELS.find(l=>l.id==="independent"));
    setLabelRel(80);
    setPressure(0);
    setRecouped(0);
    showToast("NOW INDEPENDENT");
  };

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const canDo = (a) => {
    if (ap < a.cost) return false;
    if (a.req === "tracks1" && gs.tracks < 1) return false;
    if (a.req === "tracks3" && gs.tracks < 3) return false;
    if (a.req === "tracks8" && gs.tracks < 8) return false;
    if (a.req === "clout5"  && gs.clout < 5)  return false;
    if (a.req === "fans500" && gs.fans < 500)  return false;
    if (a.req === "fans1000"&& gs.fans < 1000) return false;
    if (a.req === "fans2000"&& gs.fans < 2000) return false;
    if (a.req === "network5"&& stats.network < 5) return false;
    if (a.req === "money500k"&& gs.money < 500000) return false;
    if (a.special === "manager" && hasManager) return false;
    return true;
  };

  const doAction = (a) => {
    if (!canDo(a)) return;
    const e = { ...a.effect };

    if (["record","collab"].includes(a.id) && label.id !== "independent") {
      const cc = label.creativeControl;
      if (cc < 40) {
        e.talent = (e.talent || 0) - 1;
        addFeed(`🎨 Label dictated the sound on this track. (Creative Control: ${cc}%)`, "neg");
      } else if (cc >= 80) {
        e.talent = (e.talent || 0) + 1;
        addFeed(`✨ Full creative freedom — best work yet.`, "pos");
      }
    }

    if (a.special === "manager") setHasManager(true);
    setAp(p=>p-a.cost);
    setGs(g=>({
      fans:   clamp(g.fans   + (e.fans||0),   0, 99999999),
      money:  clamp(g.money  + (e.money||0),  0, 99999999),
      clout:  clamp(g.clout  + (e.clout||0),  0, 100),
      energy: clamp(g.energy + (e.energy||0), 0, 100),
      tracks: clamp(g.tracks + (e.tracks||0), 0, 30),
    }));
    setStats(s=>({
      talent:   clamp(s.talent   + (e.talent||0),   1, 20),
      hustle:   clamp(s.hustle   + (e.hustle||0),   1, 20),
      charisma: clamp(s.charisma + (e.charisma||0), 1, 20),
      network:  clamp(s.network  + (e.network||0),  1, 20),
    }));
    addFeed(`${a.emoji} ${a.label} done.`);
  };

  // ── NPC ACTIONS ───────────────────────────────────────────────────────────
  const doCollab = (npc) => {
    if (ap < 2) { showToast("NOT ENOUGH AP"); return; }
    if (gs.clout < 5) { showToast("NEED CLOUT 5+ FOR COLLABS"); return; }
    setAp(p=>p-2);
    const fanGain = Math.round(npc.fans * 0.003);
    setGs(g=>({...g, fans: g.fans+fanGain, money: g.money+1000000, clout: clamp(g.clout+3,0,100), tracks: g.tracks+1}));
    setNpcs(n=>n.map(x=>x.id===npc.id?{...x,relation:"ally",collabDone:true}:x));
    addFeed(`🤝 Collab with ${npc.name} done! +${fmt(fanGain)} fans from their audience.`, "pos");
    showToast(`COLLAB: ${npc.name.toUpperCase()}`);
  };

  const doBeef = (npc) => {
    setNpcs(n=>n.map(x=>x.id===npc.id?{...x,relation:"rival"}:x));
    const cloutGain = Math.floor(Math.random()*5)+1;
    setGs(g=>({...g, clout: clamp(g.clout+cloutGain,0,100), fans: g.fans + 200}));
    addFeed(`😤 Beef with ${npc.name}. Internet is watching. +${cloutGain} clout.`, "neg");
  };

  // ── END WEEK ──────────────────────────────────────────────────────────────
  const endWeek = () => {
    let newGs = { ...gs };
    let newStats = { ...stats };
    let newLabelRel = labelRel;
    let newPressure = pressure;
    let newRecouped = recouped;

    const baseStream = Math.round(newGs.fans * 0.0015 * newStats.talent * (CITIES.find(c=>c.id===city)?.bonus||1));
    const artistShare = label.id === "independent" ? baseStream : Math.round(baseStream * label.artistSplit / 100);
    const labelShare  = baseStream - artistShare;

    const marketingFanBoost = label.id !== "independent" ? Math.round(newGs.fans * 0.002 * (label.marketingMult - 1)) : 0;

    if (label.id !== "independent" && newRecouped < label.advance) {
      const recoupAmt = Math.min(labelShare, label.advance - newRecouped);
      newRecouped = newRecouped + recoupAmt;
    }

    const managerCost = hasManager ? 80000 : 0;

    const newTaxAccum = taxDue + Math.round(artistShare * 0.20);
    if (week % 13 === 0) {
      newGs.money -= newTaxAccum;
      addFeed(`🧾 Quarterly tax paid: ${fmtN(newTaxAccum)}.`, "neg");
      setTaxDue(0);
    } else {
      setTaxDue(newTaxAccum);
    }

    newGs.money = clamp(newGs.money + artistShare - managerCost, 0, 99999999);
    newGs.fans  = clamp(newGs.fans + marketingFanBoost + Math.round(newGs.clout * 0.3), 0, 99999999);
    newGs.energy = clamp(newGs.energy + 15, 0, 100);
    setWeeklyIncome(artistShare);

    if (label.id !== "independent") {
      newPressure = clamp(newPressure + 0.5, 0, 10);
      newLabelRel = clamp(newLabelRel - 0.5, 0, 100);
      if (newPressure >= label.pressureThreshold * 3) {
        const dropRoll = Math.random();
        if (dropRoll < 0.25) {
          setModal({ type:"label_event", event: LABEL_EVENTS.find(e=>e.id==="dropped") });
        }
      }
    }

    if (Math.random() < 0.5) {
      const ev = roll(RANDOM_EVENTS);
      const fx = ev.effect;
      newGs.fans  = clamp(newGs.fans  + (fx.fans||0),   0, 99999999);
      newGs.money = clamp(newGs.money + (fx.money||0),  0, 99999999);
      newGs.clout = clamp(newGs.clout + (fx.clout||0),  0, 100);
      newGs.energy= clamp(newGs.energy+ (fx.energy||0), 0, 100);
      if (fx.talent) newStats.talent = clamp(newStats.talent + fx.talent, 1, 20);
      setModal({ type:"world_event", event: ev });
    }

    if (label.id !== "independent" && Math.random() < 0.25) {
      const lev = roll(LABEL_EVENTS.filter(e=>e.id!=="dropped"));
      if (!lev.choice && lev.effect) {
        newGs.fans   = clamp(newGs.fans   + (lev.effect.fans||0),   0,99999999);
        newGs.money  = clamp(newGs.money  + (lev.effect.money||0),  0,99999999);
        newGs.clout  = clamp(newGs.clout  + (lev.effect.clout||0),  0,100);
        newPressure  = clamp(newPressure  + (lev.effect.pressure||0),0,10);
        newLabelRel  = clamp(newLabelRel  + (lev.effect.labelRel||0),0,100);
        addFeed(`${lev.label} — ${lev.desc}`, lev.id==="promo_push"||lev.id==="bonus"?"pos":"neg");
      } else if (lev.choice) {
        setModal({ type:"label_event", event: lev });
      }
    }

    const newTier = getTier(newGs.fans);
    if (newTier.tier !== prevTier) {
      setPrevTier(newTier.tier);
      showToast(`🏆 TIER UP: ${newTier.tier.toUpperCase()}`);
    }

    setGs(newGs);
    setStats(newStats);
    setLabelRel(newLabelRel);
    setPressure(newPressure);
    setRecouped(newRecouped);
    setAp(7);
    setWeek(w=>w+1);
    addFeed(`📅 Week ${week+1} starts. Stream revenue: ${fmtN(artistShare)}.`);
  };

  // ── MODAL HANDLER ─────────────────────────────────────────────────────────
  const handleChoice = (option) => {
    const fx = option.effect || {};
    if (fx.dropped) {
      setLabel(LABELS.find(l=>l.id==="independent"));
      setLabelRel(0); setPressure(0); setRecouped(0);
      addFeed("🚫 Dropped by label. Back to independent.", "neg");
      showToast("DROPPED — NOW INDEPENDENT");
    }
    if (fx.renegotiate) {
      if (gs.clout >= 30) {
        setPressure(0); setLabelRel(l=>clamp(l+15,0,100));
        addFeed("📝 Renegotiated deal. Pressure reset.", "pos");
      } else {
        setPressure(p=>p+2);
        addFeed("❌ Not enough clout to renegotiate.", "neg");
      }
    }
    setGs(g=>({
      fans:   clamp(g.fans   + (fx.fans||0),   0,99999999),
      money:  clamp(g.money  + (fx.money||0),  0,99999999),
      clout:  clamp(g.clout  + (fx.clout||0),  0,100),
      energy: clamp(g.energy + (fx.energy||0), 0,100),
      tracks: g.tracks,
    }));
    setPressure(p=>clamp(p+(fx.pressure||0),0,10));
    setLabelRel(l=>clamp(l+(fx.labelRel||0),0,100));
    setModal(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const tier = getTier(gs.fans);
  const energyColor = gs.energy>60?"#2EE89A":gs.energy>30?"#E8C547":"#FF4D6D";
  const genreObj = GENRES.find(g=>g.id===genre);

  // ── ONBOARDING — SINGLE PAGE ────────────────────────────────────────────
  if (screen === "onboard") return (
    <>
      <style>{CSS}</style>
      <div className="ob">
        <div className="ob-glow"/>
        <div className="ob-glow2"/>

        <div className="logo">TREBLR</div>
        <div className="logo-sub">Build Your Legacy</div>

        {/* 01 — ARTIST NAME */}
        <div className="ob-section">
          <div className="ob-section-head">
            <span className="ob-snum">01</span>
            <span className="ob-slabel">Artist Name</span>
            {aName.trim()&&<span className="ob-scheck">✓</span>}
          </div>
          <input
            className="name-in"
            placeholder="Your stage name..."
            value={aName}
            onChange={e=>setAName(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* 02 — GENRE */}
        <div className="ob-section">
          <div className="ob-section-head">
            <span className="ob-snum">02</span>
            <span className="ob-slabel">Your Genre</span>
            {genre&&<span className="ob-scheck">✓</span>}
          </div>
          <div className="grid2">
            {GENRES.map(g=>(
              <div
                key={g.id}
                className={`sel${genre===g.id?" on":""}`}
                onClick={()=>setGenre(g.id)}
                style={genre===g.id?{borderColor:g.color,background:`${g.color}10`}:{}}
              >
                <div className="ico">{g.emoji}</div>
                <div className="sn">{g.label}</div>
                <div className="ss">+{g.bonus}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 03 — CITY */}
        <div className="ob-section">
          <div className="ob-section-head">
            <span className="ob-snum">03</span>
            <span className="ob-slabel">Your City</span>
            {city&&<span className="ob-scheck">✓</span>}
          </div>
          <div className="grid2">
            {CITIES.map(c=>(
              <div
                key={c.id}
                className={`sel${city===c.id?" on":""}`}
                onClick={()=>setCity(c.id)}
              >
                <div className="sn">{c.label}</div>
                <div className="ss">{c.scene}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 04 — STARTING STATS */}
        <div className="ob-section">
          <div className="ob-section-head">
            <span className="ob-snum">04</span>
            <span className="ob-slabel">Starting Stats</span>
          </div>
          <div className="stat-preview">
            {Object.entries(baseStats).map(([k,v])=>(
              <div key={k} className="sp">
                <div className="sp-l">{k.slice(0,3)}</div>
                <div className="sp-v">{v}</div>
              </div>
            ))}
          </div>
          <button className="btn-ghost" onClick={rollStats}>🎲 REROLL STATS</button>
        </div>

        <button
          className="btn"
          disabled={!aName.trim()||!genre||!city}
          onClick={startGame}
        >
          START CAREER →
        </button>
      </div>
    </>
  );

  // ── GAME ──────────────────────────────────────────────────────────────────
  const cats = [...new Set(ACTIONS.map(a=>a.cat))];

  return (
    <>
      <style>{CSS}</style>

      {/* TABS */}
      <div className="tabs">
        {["actions","label","artists","stats","feed"].map(t=>(
          <button key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>
            {t==="actions"?"🎮":t==="label"?"🏷️":t==="artists"?"👥":t==="stats"?"📊":"📡"}
          </button>
        ))}
      </div>

      {/* HUD */}
      <div className="hud">
        <div className="hud-row1">
          <div className="artist-info">
            <div className="aname">{aName}</div>
            <div className="ameta">{genreObj?.label} · {CITIES.find(c=>c.id===city)?.label}</div>
          </div>
          <div>
            <div className="tier-chip" style={{color:tier.color,borderColor:tier.color+"55"}}>{tier.tier}</div>
            <div className="week-chip">Week {week}</div>
          </div>
        </div>
        <div className="hud-stats">
          <div className="hs"><div className="hs-l">Fans</div><div className="hs-v" style={{color:"#E8C547"}}>{fmt(gs.fans)}</div></div>
          <div className="hs"><div className="hs-l">Cash</div><div className="hs-v" style={{color:"#2EE89A"}}>₦{fmt(gs.money)}</div></div>
          <div className="hs"><div className="hs-l">Clout</div><div className="hs-v" style={{color:"#B06EFF"}}>{gs.clout}</div></div>
          <div className="hs"><div className="hs-l">Tracks</div><div className="hs-v" style={{color:"#4DAAFF"}}>{gs.tracks}</div></div>
        </div>
        <div className="energy-row">
          <span>Energy</span>
          <div className="bar"><div className="bar-f" style={{width:`${gs.energy}%`,background:energyColor}}/></div>
          <span>{gs.energy}%</span>
        </div>
        <div className="ap-row">
          <div className="ap-label">Action Points — {ap} left</div>
          <div className="ap-pips">{Array.from({length:7}).map((_,i)=><div key={i} className={`pip${i>=ap?" used":""}`}/>)}</div>
        </div>
        <div className="label-badge">
          <div className="lb-dot" style={{background:label.color}}/>
          <div>
            <div className="lb-name" style={{color:label.color}}>{label.name}</div>
            <div className="lb-split">{label.artistSplit}% to you · CC: {label.creativeControl}%</div>
          </div>
          <div className="lb-pressure">
            {Array.from({length:5}).map((_,i)=><div key={i} className={`lp${i<Math.round(pressure)?" hi":""}`}/>)}
          </div>
        </div>
      </div>

      {/* ── ACTIONS TAB ── */}
      {tab==="actions"&&<>
        <div className="screen">
          {cats.map(cat=>(
            <div key={cat}>
              <div className="cat-label">{cat}</div>
              <div className="actions-grid">
                {ACTIONS.filter(a=>a.cat===cat).map(a=>{
                  const dis = !canDo(a);
                  const posEff = Object.entries(a.effect).filter(([k,v])=>v>0&&k!=="money").map(([k,v])=>`+${v} ${k}`).join(" · ");
                  const negEff = Object.entries(a.effect).filter(([k,v])=>v<0&&k!=="money").map(([k,v])=>`${v} ${k}`).join(" · ");
                  const moneyEff = a.effect.money ? (a.effect.money>0?`+₦${fmt(a.effect.money)}`:`-₦${fmt(Math.abs(a.effect.money))}`) : "";
                  return (
                    <div key={a.id} className={`ac${dis?" ac-dis":""}`} onClick={()=>doAction(a)}>
                      <div className="ac-cost">{a.cost}AP</div>
                      <div className="ac-emoji">{a.emoji}</div>
                      <div className="ac-name">{a.label}</div>
                      <div className="ac-desc">{a.desc}{a.special==="manager"&&hasManager?" (hired)":""}</div>
                      {posEff&&<div className="ac-fx">{posEff} {moneyEff&&a.effect.money>0?moneyEff:""}</div>}
                      {(negEff||(a.effect.money&&a.effect.money<0))&&<div className="ac-fx neg">{negEff} {a.effect.money<0?moneyEff:""}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="end-btn-wrap">
          <button className="end-btn" onClick={endWeek}>END WEEK {week} →</button>
        </div>
      </>}

      {/* ── LABEL TAB ── */}
      {tab==="label"&&<div className="screen">
        <div className="section-title">Your Deal</div>
        {label.id!=="independent"&&<>
          <div className="info-card">
            <div className="info-card-title">Current Contract</div>
            <div className="info-row"><span className="info-row-label">Label</span><span className="info-row-val" style={{color:label.color}}>{label.name}</span></div>
            <div className="info-row"><span className="info-row-label">Your Cut</span><span className="info-row-val" style={{color:"#2EE89A"}}>{label.artistSplit}%</span></div>
            <div className="info-row"><span className="info-row-label">Marketing</span><span className="info-row-val">{label.marketingMult}×</span></div>
            <div className="info-row"><span className="info-row-label">Creative Control</span><span className="info-row-val">{label.creativeControl}%</span></div>
            <div className="info-row"><span className="info-row-label">Label Relation</span><span className="info-row-val" style={{color:labelRel>60?"#2EE89A":labelRel>30?"#E8C547":"#FF4D6D"}}>{labelRel}/100</span></div>
            <div className="info-row"><span className="info-row-label">Pressure</span><span className="info-row-val" style={{color:pressure>6?"#FF4D6D":pressure>3?"#E8C547":"#2EE89A"}}>{pressure.toFixed(1)}/10</span></div>
            <div className="recoup-bar">
              <div className="recoup-label">
                <span>Advance Recouped</span>
                <span>{fmtN(recouped)} / {fmtN(label.advance)}</span>
              </div>
              <div className="bar"><div className="bar-f" style={{width:`${pct(recouped,label.advance||1)}%`,background:"#E8C547"}}/></div>
            </div>
          </div>
          <div className="demands-list">
            <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"var(--muted)",marginBottom:8,fontWeight:700}}>Label Demands</div>
            {label.demands.map((d,i)=><div key={i} className="demand-item">{d}</div>)}
          </div>
          <button className="lc-btn" style={{marginBottom:12,borderColor:"var(--red)",color:"var(--red)"}} onClick={leaveLabel}>
            LEAVE LABEL (Buyout: {fmtN(label.advance*0.5)})
          </button>
        </>}

        <div className="section-title">Available Labels</div>
        {LABELS.filter(l=>l.id!=="independent").map(lbl=>{
          const locked = gs.clout < lbl.minClout || gs.fans < lbl.minFans;
          const isCurrent = label.id === lbl.id;
          return (
            <div key={lbl.id} className={`label-card${isCurrent?" current":""}`} style={isCurrent?{borderColor:lbl.color+"55"}:{}}>
              {isCurrent&&<div className="current-tag">SIGNED</div>}
              <div className="lc-top">
                <div className="lc-name" style={{color:lbl.color}}>{lbl.name}</div>
                <div className="lc-tier" style={{color:lbl.color,borderColor:lbl.color+"44"}}>{lbl.tierLabel}</div>
              </div>
              <div className="lc-desc">{lbl.desc}</div>
              <div className="lc-stats">
                <div className="lcs"><div className="lcs-l">Advance</div><div className="lcs-v" style={{color:"#2EE89A"}}>{fmtN(lbl.advance)}</div></div>
                <div className="lcs"><div className="lcs-l">Your Split</div><div className="lcs-v">{lbl.artistSplit}%</div></div>
                <div className="lcs"><div className="lcs-l">Marketing</div><div className="lcs-v" style={{color:"#4DAAFF"}}>{lbl.marketingMult}×</div></div>
                <div className="lcs">
                  <div className="lcs-l">Creative Control</div>
                  <div className="lcs-v">{lbl.creativeControl}%</div>
                  <div className="cc-bar"><div className="cc-fill" style={{width:`${lbl.creativeControl}%`}}/></div>
                </div>
              </div>
              <div className="demands-list">
                {lbl.demands.map((d,i)=><div key={i} className="demand-item">{d}</div>)}
              </div>
              {locked&&<div style={{fontSize:11,color:"var(--red)",marginBottom:10,fontWeight:600}}>
                🔒 Requires {lbl.minFans>0?`${fmt(lbl.minFans)} fans`:""}
                {lbl.minFans>0&&lbl.minClout>0?" & ":""}
                {lbl.minClout>0?`Clout ${lbl.minClout}`:""}
              </div>}
              <button
                className={`lc-btn${locked||isCurrent?" locked":""}`}
                onClick={()=>!locked&&!isCurrent&&signLabel(lbl)}
                style={!locked&&!isCurrent?{borderColor:lbl.color+"66",color:lbl.color}:{}}
              >
                {isCurrent?"CURRENTLY SIGNED":locked?"LOCKED":"SIGN DEAL"}
              </button>
            </div>
          );
        })}
      </div>}

      {/* ── ARTISTS TAB ── */}
      {tab==="artists"&&<div className="screen">
        <div className="section-title">Scene — Real Artists</div>
        {npcs.map(npc=>{
          const sameGenre = npc.genre === genre;
          const isRival = npc.relation === "rival";
          const isAlly  = npc.relation === "ally";
          const gObj = GENRES.find(g=>g.id===npc.genre);
          return (
            <div key={npc.id} className="npc-card">
              <div className="npc-avatar" style={sameGenre?{borderColor:gObj?.color+"66"}:{}}>{npc.avatar}</div>
              <div className="npc-info">
                <div style={{display:"flex",alignItems:"center"}}>
                  <div className="npc-name">{npc.name}</div>
                  {isRival&&<span className="rival-tag">RIVAL</span>}
                  {isAlly&&<span className="ally-tag">ALLY</span>}
                </div>
                <div className="npc-meta">{gObj?.label} · {npc.city} · {fmt(npc.fans)} fans</div>
                <div className="npc-stats">
                  <div className="npc-stat">Clout <span>{npc.clout}</span></div>
                  <div className="npc-stat">Talent <span>{npc.talent}</span></div>
                </div>
                <div className="npc-actions">
                  <button
                    className={`npc-btn collab${npc.collabDone?" ac-dis":""}`}
                    onClick={()=>!npc.collabDone&&doCollab(npc)}
                  >
                    🤝 Collab (2AP)
                  </button>
                  <button className="npc-btn beef" onClick={()=>doBeef(npc)}>
                    😤 Beef
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>}

      {/* ── STATS TAB ── */}
      {tab==="stats"&&<div className="stats-section">
        <div className="section-title">Skills</div>
        {Object.entries(stats).map(([k,v])=>(
          <div key={k} className="skill-row">
            <div className="skill-name">{k}</div>
            <div className="skill-bar"><div className="skill-fill" style={{width:`${(v/20)*100}%`}}/></div>
            <div className="skill-val">{v}</div>
          </div>
        ))}

        <div className="section-title" style={{marginTop:20}}>Finances</div>
        <div className="info-card">
          <div className="info-row"><span className="info-row-label">Total Cash</span><span className="info-row-val" style={{color:"#2EE89A"}}>{fmtN(gs.money)}</span></div>
          <div className="info-row"><span className="info-row-label">Last Stream Rev</span><span className="info-row-val">{fmtN(weeklyIncome)}</span></div>
          <div className="info-row"><span className="info-row-label">Tax Due (Qtr)</span><span className="info-row-val" style={{color:"#FF4D6D"}}>{fmtN(taxDue)}</span></div>
          <div className="info-row"><span className="info-row-label">Manager</span><span className="info-row-val" style={{color:hasManager?"#2EE89A":"#FF4D6D"}}>{hasManager?"Hired (-₦80k/wk)":"None"}</span></div>
        </div>

        <div className="section-title">Career</div>
        <div className="info-card">
          <div className="info-row"><span className="info-row-label">Fans</span><span className="info-row-val" style={{color:"#E8C547"}}>{fmt(gs.fans)}</span></div>
          <div className="info-row"><span className="info-row-label">Clout</span><span className="info-row-val" style={{color:"#B06EFF"}}>{gs.clout} / 100</span></div>
          <div className="info-row"><span className="info-row-label">Tier</span><span className="info-row-val" style={{color:tier.color}}>{tier.tier}</span></div>
          <div className="info-row"><span className="info-row-label">Weeks Active</span><span className="info-row-val">{week}</span></div>
          <div className="info-row"><span className="info-row-label">Tracks Ready</span><span className="info-row-val">{gs.tracks}</span></div>
          <div className="info-row"><span className="info-row-label">Allies</span><span className="info-row-val" style={{color:"#2EE89A"}}>{npcs.filter(n=>n.relation==="ally").length}</span></div>
          <div className="info-row"><span className="info-row-label">Rivals</span><span className="info-row-val" style={{color:"#FF4D6D"}}>{npcs.filter(n=>n.relation==="rival").length}</span></div>
        </div>
      </div>}

      {/* ── FEED TAB ── */}
      {tab==="feed"&&<div className="screen">
        <div className="section-title">Activity Feed</div>
        {feed.length===0&&<div style={{color:"var(--muted)",fontSize:13,padding:"20px 0",fontWeight:500}}>No activity yet. Start playing.</div>}
        {feed.map((f,i)=>(
          <div key={i} className={`feed-item${f.type==="pos"?" pos":f.type==="neg"?" neg":""}`}>
            {f.msg}
            <div className="feed-meta">Week {f.wk}</div>
          </div>
        ))}
      </div>}

      {/* ── MODAL ── */}
      {modal&&(
        <div className="overlay" onClick={()=>!modal.event?.choice&&setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            {modal.type==="world_event"&&<>
              <div className="modal-emoji">{modal.event.label.split(" ")[0]}</div>
              <div className="modal-title">{modal.event.label.slice(modal.event.label.indexOf(" ")+1)}</div>
              <div className="modal-desc">{modal.event.desc}</div>
              <div className="effect-chips">
                {Object.entries(modal.event.effect).map(([k,v])=>(
                  <div key={k} className={`chip${v>0?" pos":" neg"}`}>{v>0?"+":""}{k==="money"?fmtN(v):v} {k!=="money"?k:""}</div>
                ))}
              </div>
              <button className="modal-dismiss" onClick={()=>setModal(null)}>GOT IT 🤙</button>
            </>}
            {modal.type==="label_event"&&<>
              <div className="modal-title" style={{fontSize:18,marginBottom:10}}>{modal.event.label}</div>
              <div className="modal-desc">{modal.event.desc}</div>
              {modal.event.choice&&<div className="modal-choices">
                {modal.event.options.map((opt,i)=>(
                  <button key={i} className="choice-btn" onClick={()=>handleChoice(opt)}>
                    {opt.text}
                    <div style={{fontSize:10,color:"var(--muted)",marginTop:4,fontWeight:600}}>
                      {Object.entries(opt.effect).filter(([k])=>k!=="dropped"&&k!=="renegotiate").map(([k,v])=>`${v>0?"+":""}${k==="money"?fmtN(v):v} ${k!=="money"?k:""}`).join(" · ")}
                    </div>
                  </button>
                ))}
              </div>}
              {!modal.event.choice&&<button className="modal-dismiss" onClick={()=>setModal(null)}>OK</button>}
            </>}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast&&<div className="toast">{toast}</div>}
    </>
  );
}
