// ─── TIME ─────────────────────────────────────────────────────────────────────
export const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTH_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── GENRES ──────────────────────────────────────────────────────────────────
export const GENRES = [
  { id:'afrobeats', label:'Afrobeats',   initials:'AF', color:'#E07020', swBonus:0, vcBonus:1, pdBonus:2, lpBonus:2, desc:'Percussion-driven global sound' },
  { id:'hiphop',    label:'Hip-Hop',     initials:'HH', color:'#6C3FCC', swBonus:3, vcBonus:0, pdBonus:1, lpBonus:1, desc:'Bars and beats from the streets' },
  { id:'pop',       label:'Pop',         initials:'PP', color:'#DB2777', swBonus:2, vcBonus:2, pdBonus:0, lpBonus:1, desc:'Hook-heavy crossover anthems' },
  { id:'rnb',       label:'R&B',         initials:'RB', color:'#0D9F68', swBonus:1, vcBonus:3, pdBonus:0, lpBonus:1, desc:'Soulful expression and groove' },
  { id:'alt',       label:'Alternative', initials:'AL', color:'#00B8D4', swBonus:2, vcBonus:1, pdBonus:2, lpBonus:0, desc:'Genre-defying left-field sound' },
];

// ─── CITIES ──────────────────────────────────────────────────────────────────
export const CITIES = [
  { id:'lagos',   label:'Lagos',   flag:'NG', scene:'Afrobeats Capital', bonus:1.30 },
  { id:'atlanta', label:'Atlanta', flag:'US', scene:'Trap Metropolis',   bonus:1.25 },
  { id:'london',  label:'London',  flag:'GB', scene:'Global Crossroads', bonus:1.20 },
  { id:'accra',   label:'Accra',   flag:'GH', scene:'Highlife Rising',   bonus:1.15 },
  { id:'toronto', label:'Toronto', flag:'CA', scene:'Multicultural Hub', bonus:1.10 },
];

// ─── CAREER TYPES ─────────────────────────────────────────────────────────────
export const CAREER_TYPES = [
  {
    id:'broke_underground', label:'Underground Broke',
    desc:'Pure talent, empty pockets. The streets love you but the industry is sleeping.',
    money:150000, fans:0, socialFollowers:800,
    stats:{ sw:9, vc:7, pd:5, lp:8, hustle:12, charisma:6, network:4 },
    perk:'Side job earnings +40%',
    se:7,
  },
  {
    id:'social_media', label:'Social Media Star',
    desc:'Content pops off. Decent budget, massive following, but untested in a real studio.',
    money:2500000, fans:3000, socialFollowers:75000,
    stats:{ sw:4, vc:6, pd:3, lp:5, hustle:7, charisma:13, network:10 },
    perk:'Social Energy: 10 per week instead of 7',
    se:10,
  },
  {
    id:'rich_kid', label:'Rich Kid',
    desc:'Funded lifestyle, zero grind. Everything costs double — including respect from peers.',
    money:30000000, fans:0, socialFollowers:8000,
    stats:{ sw:3, vc:4, pd:2, lp:2, hustle:3, charisma:8, network:7 },
    perk:'Premium producers unlocked from day one',
    se:7,
  },
  {
    id:'fallen_star', label:'Fallen Star',
    desc:'You had your moment but blew the bag. Name recognition lingers. Redemption arc loading.',
    money:600000, fans:12000, socialFollowers:35000,
    stats:{ sw:7, vc:9, pd:5, lp:10, hustle:5, charisma:9, network:9 },
    perk:'Collab costs 20% less',
    se:7,
  },
  {
    id:'producer_artist', label:'Producer Turned Artist',
    desc:'You built beats for others for years. Front mic is unfamiliar territory.',
    money:4000000, fans:500, socialFollowers:5000,
    stats:{ sw:10, vc:3, pd:16, lp:2, hustle:8, charisma:5, network:8 },
    perk:'Production starts at 16. Songs 30% cheaper.',
    se:7,
  },
];

// ─── PRODUCERS ───────────────────────────────────────────────────────────────
export const PRODUCERS = [
  { id:'bedroom', name:'SoundCloud Beat',    tier:0, cost:0,        qBonus:0,  minFans:0,      desc:'Free loop pack. It\'s obvious.' },
  { id:'local',   name:'Local Producer',     tier:1, cost:200000,   qBonus:7,  minFans:0,      desc:'City plug with heat.' },
  { id:'mid',     name:'Genre Specialist',   tier:2, cost:2000000,  qBonus:16, minFans:5000,   desc:'Knows your sound deeply.' },
  { id:'top',     name:'Hitmaker',           tier:3, cost:10000000, qBonus:25, minFans:75000,  desc:'Worked with legends.' },
  { id:'legend',  name:'Legendary Producer', tier:4, cost:30000000, qBonus:35, minFans:300000, desc:'Grammy-certified.' },
];

// ─── LABELS ──────────────────────────────────────────────────────────────────
export const LABELS = [
  {
    id:'independent', name:'Independent', tierLabel:'Self-Released',
    advance:0, artistSplit:100, labelSplit:0, marketingMult:1.0,
    contractWeeks:0, creativeControl:100, minClout:0, minFans:0,
    color:'#5A5878', pressureThreshold:99,
    desc:'You own everything. No advance, no machine — just you.',
    demands:[],
  },
  {
    id:'empire', name:'Empire Sounds', tierLabel:'Indie Label',
    advance:1500000, artistSplit:58, labelSplit:42, marketingMult:1.5,
    contractWeeks:52, creativeControl:82, minClout:10, minFans:1000,
    color:'#0D9F68', pressureThreshold:3,
    desc:'Boutique indie. Artist-friendly split, creative freedom, modest budget.',
    demands:['1 single per quarter','3 social posts per week'],
  },
  {
    id:'nova', name:'Nova Records', tierLabel:'Mid-Tier Label',
    advance:6000000, artistSplit:38, labelSplit:62, marketingMult:2.2,
    contractWeeks:104, creativeControl:60, minClout:25, minFans:8000,
    color:'#00B8D4', pressureThreshold:2,
    desc:'Real marketing budget. They\'ll push you hard.',
    demands:['1 album per year','Approve all visuals','5 social posts per week'],
  },
  {
    id:'titan', name:'Titan Music Group', tierLabel:'Major Label',
    advance:25000000, artistSplit:20, labelSplit:80, marketingMult:4.5,
    contractWeeks:260, creativeControl:28, minClout:50, minFans:50000,
    color:'#C8922A', pressureThreshold:1,
    desc:'Global machine. Massive advance but they own your sound.',
    demands:['2 albums per year','Full creative approval','10 social posts per week'],
  },
  {
    id:'apex', name:'Apex 360', tierLabel:'360 Deal',
    advance:40000000, artistSplit:15, labelSplit:85, marketingMult:5.5,
    contractWeeks:312, creativeControl:15, minClout:65, minFans:150000,
    color:'#D63548', pressureThreshold:1,
    desc:'Biggest advance in the game. They take a cut of EVERYTHING.',
    demands:['Full creative override','40% of all revenue','6-year lock-in'],
  },
];

// ─── CAREER ERAS ──────────────────────────────────────────────────────────────
export const ERAS = [
  { label:'Underground Era',  minFans:0,        color:'#5A5878' },
  { label:'Buzzing Era',      minFans:500,       color:'#6C3FCC' },
  { label:'Rising Era',       minFans:5000,      color:'#00B8D4' },
  { label:'National Era',     minFans:25000,     color:'#0D9F68' },
  { label:'Continental Era',  minFans:100000,    color:'#C8922A' },
  { label:'Global Era',       minFans:500000,    color:'#E07020' },
  { label:'Legendary Era',    minFans:2000000,   color:'#E8B048' },
];

// ─── MILESTONES ───────────────────────────────────────────────────────────────
export const MILESTONES = [
  { fans:0,        tier:'Bedroom Artist',   color:'#5A5878' },
  { fans:500,      tier:'Local Buzz',        color:'#A78BFA' },
  { fans:5000,     tier:'City Known',        color:'#60A5FA' },
  { fans:25000,    tier:'National Radar',    color:'#34D399' },
  { fans:100000,   tier:'Certified Act',     color:'#F59E0B' },
  { fans:500000,   tier:'Continental Star',  color:'#FB923C' },
  { fans:2000000,  tier:'Global Icon',       color:'#F87171' },
  { fans:10000000, tier:'Legendary',         color:'#FBBF24' },
];

// ─── RANDOM EVENTS ───────────────────────────────────────────────────────────
export const RANDOM_EVENTS = [
  { id:'viral',      label:'Went Viral',              desc:'A clip exploded online.',      effect:{fans:800,  clout:4},                neg:false },
  { id:'bad_press',  label:'Bad Interview',            desc:'A clip resurfaced. People are talking — not nicely.', effect:{clout:-5, fans:-300, reputation:-5}, neg:true },
  { id:'award_nom',  label:'Award Nomination',         desc:'You\'re nominated for Best New Artist.', effect:{clout:8, fans:1000, reputation:8}, neg:false, minWeeks:24, minFans:50000 },
  { id:'burnout',    label:'Burnout',                  desc:'Grinding too hard. Your body is forcing a reset.', effect:{energy:-40, sw:-1}, neg:true },
  { id:'beef',       label:'Public Beef',              desc:'Another artist came for you publicly.', effect:{fans:200, clout:-2, reputation:-3}, neg:true },
  { id:'sync_indie', label:'Indie Sync Deal',          desc:'Your track licensed for a Netflix short film.', effect:{money:3000000, fans:300, clout:2}, neg:false, maxFans:50000 },
  { id:'sync_major', label:'Major Sync Deal',          desc:'Global series wants your track.', effect:{money:15000000, fans:2000, clout:8}, neg:false, minFans:50000 },
  { id:'trend',      label:'Genre is Trending',        desc:'Your genre hit the mainstream. Ride the wave.', effect:{fans:500, clout:3}, neg:false },
  { id:'superfans',  label:'Superfan Community',       desc:'A dedicated fan community formed around you.', effect:{fans:400, money:200000}, neg:false },
  { id:'collab_req', label:'Collab Offer',             desc:'An established artist reached out.', effect:{fans:300, money:1500000, clout:3}, neg:false, minWeeks:16 },
  { id:'piracy',     label:'Piracy Wave',              desc:'Your music being downloaded illegally.', effect:{money:-500000, fans:100}, neg:true },
  { id:'label_buzz', label:'Label Interest',           desc:'A label rep saw your show.', effect:{clout:3, network:2}, neg:false, minWeeks:8 },
  { id:'genre_wave', label:'Genre Momentum',           desc:'Industry trend pushes your genre up.', effect:{fans:600, clout:2}, neg:false },
];

// ─── LABEL EVENTS ─────────────────────────────────────────────────────────────
export const LABEL_EVENTS = [
  { id:'push_single', label:'Label Demands a Single', desc:'Pressure to drop something within 2 weeks.', choice:true,
    options:[{text:'Drop a track',effect:{pressure:-2,clout:1}},{text:'Push back',effect:{pressure:1,labelRel:-6,reputation:2}}] },
  { id:'creative_clash', label:'Creative Clash', desc:'Label hates your new direction. They want commercial.', choice:true,
    options:[{text:'Comply',effect:{money:800000,fans:200}},{text:'Hold your ground',effect:{labelRel:-10,clout:3,reputation:3}}] },
  { id:'promo_push', label:'Label Campaign Launch', desc:'Your label just dropped serious marketing budget.', choice:false, effect:{fans:1200,clout:5,money:1500000} },
  { id:'dropped_risk', label:'Numbers Not Meeting Targets', desc:'Label is threatening to drop you.', choice:true,
    options:[{text:'Accept being dropped',effect:{dropped:true}},{text:'Renegotiate (need clout 40+)',effect:{renegotiate:true}}] },
  { id:'bonus_payment', label:'Streaming Bonus', desc:'Exceeded quarterly streaming targets.', choice:false, effect:{money:3000000,labelRel:5} },
  { id:'360_cut', label:'360 Revenue Clawback', desc:'Your 360 label took their tour earnings cut.', choice:false, effect:{money:-2000000} },
  { id:'recoup_notice', label:'Recoupment Warning', desc:'Advance still hasn\'t been recouped. Pressure rising.', choice:false, effect:{pressure:2,labelRel:-4} },
];

// ─── MERCH TYPES ─────────────────────────────────────────────────────────────
export const MERCH_TYPES = [
  { id:'tshirt',    label:'T-Shirt',        costPer:8000,    suggestedPrice:25000,  icon:'tshirt'  },
  { id:'hoodie',    label:'Hoodie',         costPer:18000,   suggestedPrice:55000,  icon:'hoodie'  },
  { id:'cap',       label:'Cap',            costPer:5000,    suggestedPrice:18000,  icon:'cap'     },
  { id:'vinyl',     label:'Vinyl',          costPer:12000,   suggestedPrice:40000,  icon:'vinyl'   },
  { id:'poster',    label:'Poster',         costPer:2000,    suggestedPrice:8000,   icon:'poster'  },
  { id:'boxset',    label:'Limited Box Set',costPer:50000,   suggestedPrice:150000, icon:'box'     },
];

// ─── TOUR TIERS ───────────────────────────────────────────────────────────────
export const TOUR_TIERS = [
  { id:'citygig',   label:'City Gig',       weeks:1,  cost:500000,  minRev:800000,  maxRev:2000000,  minFans:1000,   lpGain:2, desc:'Local venue. Pack the room, build the buzz.' },
  { id:'regional',  label:'Regional Tour',  weeks:3,  cost:3000000, minRev:5000000, maxRev:12000000, minFans:10000,  lpGain:4, desc:'Multi-city regional run. Building your base.' },
  { id:'national',  label:'National Tour',  weeks:6,  cost:10000000,minRev:20000000,maxRev:50000000, minFans:50000,  lpGain:6, desc:'National scale. Sold out arenas.' },
  { id:'world',     label:'World Tour',     weeks:12, cost:40000000,minRev:100000000,maxRev:300000000,minFans:500000, lpGain:10,desc:'Lagos to London to Atlanta. Global domination.' },
];

// ─── SOCIAL PLATFORMS ────────────────────────────────────────────────────────
export const SOCIAL_PLATFORMS = [
  { id:'soundstream', name:'Soundstream', desc:'Tied to streaming — grows with music', color:'#1DB954', bgColor:'rgba(29,185,84,0.08)',  auto:true,  seCost:0 },
  { id:'instapic',    name:'Instapic',    desc:'Photos, Reels, Stories',               color:'#E1306C', bgColor:'rgba(225,48,108,0.08)', seCost:1, contentTypes:['Photo Drop','Story Push','Reel Clip'] },
  { id:'chirp',       name:'Chirp',       desc:'Thoughts, Beef, Reactions',             color:'#1DA1F2', bgColor:'rgba(29,161,242,0.08)', seCost:1, contentTypes:['Drop Heat','Start Beef','React to News'] },
  { id:'vidtube',     name:'VidTube',     desc:'Music videos, Vlogs, Live sessions',    color:'#FF0000', bgColor:'rgba(255,0,0,0.08)',    seCost:2, contentTypes:['Post Music Video','Behind the Scenes Vlog','Live Session'] },
  { id:'rhythmtok',   name:'RhythmTok',   desc:'Short clips, Trends, Virality',         color:'#69C9D0', bgColor:'rgba(105,201,208,0.08)',seCost:1, contentTypes:['Jump on Trend','Original Sound','Artist Challenge'] },
  { id:'soundcloud',  name:'SoundCloud',  desc:'Raw tracks, DJ mixes, Freestyles',      color:'#FF5500', bgColor:'rgba(255,85,0,0.08)',   seCost:1, contentTypes:['Drop Freestyle','DJ Mix','Exclusive Preview'] },
];

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const JOBS = [
  { id:'dj_set',      label:'DJ at Local Venue',       income:80000,   energy:15, skillGain:{lp:1},  req:null,         desc:'Spin records. Builds live presence.' },
  { id:'session',     label:'Session Musician',         income:200000,  energy:20, skillGain:{vc:1},  req:'vc5',        desc:'Play on someone else\'s record.' },
  { id:'teach',       label:'Give Music Lessons',       income:60000,   energy:10, skillGain:{sw:1},  req:null,         desc:'Teach basics. You learn by teaching.' },
  { id:'studio_asst', label:'Studio Assistant',         income:120000,  energy:15, skillGain:{pd:1},  req:null,         desc:'Assist bigger sessions. Learn the board.' },
  { id:'jingle',      label:'Write Jingles',            income:500000,  energy:20, skillGain:{sw:1},  req:'sw7',        desc:'Commercial work. Pays well.' },
  { id:'ghost_write', label:'Ghost Write',              income:1500000, energy:25, skillGain:{sw:2},  req:'sw10',       desc:'Write hits for someone else.' },
  { id:'ambassador',  label:'Brand Ambassador',         income:300000,  energy:10, skillGain:null,    req:'fans5000',   desc:'Represent a brand on social.' },
  { id:'headline_gig',label:'Headline Local Show',      income:800000,  energy:25, skillGain:{lp:2},  req:'fans1000',   desc:'Headline at a real venue.' },
];

// ─── PERSONAL LABEL AESTHETICS ────────────────────────────────────────────────
export const LABEL_AESTHETICS = [
  { id:'indie',      label:'Indie',      color:'#0D9F68', desc:'Authentic, artist-first, grassroots energy.' },
  { id:'commercial', label:'Commercial', color:'#C8922A', desc:'Radio-friendly, mainstream-chasing, profit-driven.' },
  { id:'street',     label:'Street',     color:'#374151', desc:'Raw, underground, community-rooted.' },
  { id:'prestige',   label:'Prestige',   color:'#6C3FCC', desc:'Luxury, high-art, exclusive aesthetic.' },
];
