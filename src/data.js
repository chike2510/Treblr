// ─── TIME ────────────────────────────────────────────────────────────────────
export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── GENRES ──────────────────────────────────────────────────────────────────
export const GENRES = [
  { id:'afrobeats', label:'Afrobeats',   emoji:'🥁', color:'#FF6B35', swBonus:0, vcBonus:1, pdBonus:2, lpBonus:2, desc:'Percussion-driven global sound' },
  { id:'hiphop',    label:'Hip-Hop',     emoji:'🎤', color:'#9B59B6', swBonus:3, vcBonus:0, pdBonus:1, lpBonus:1, desc:'Bars and beats from the streets' },
  { id:'pop',       label:'Pop',         emoji:'🌟', color:'#E91E8C', swBonus:2, vcBonus:2, pdBonus:0, lpBonus:1, desc:'Hook-heavy crossover anthems' },
  { id:'rnb',       label:'R&B',         emoji:'🎷', color:'#1DB954', swBonus:1, vcBonus:3, pdBonus:0, lpBonus:1, desc:'Soulful expression and groove' },
  { id:'alt',       label:'Alternative', emoji:'🎸', color:'#00BCD4', swBonus:2, vcBonus:1, pdBonus:2, lpBonus:0, desc:'Genre-defying left-field sound' },
];

// ─── CITIES ──────────────────────────────────────────────────────────────────
export const CITIES = [
  { id:'lagos',   label:'Lagos',   flag:'🇳🇬', scene:'Afrobeats Capital', bonus:1.30 },
  { id:'atlanta', label:'Atlanta', flag:'🇺🇸', scene:'Trap Metropolis',   bonus:1.25 },
  { id:'london',  label:'London',  flag:'🇬🇧', scene:'Global Crossroads', bonus:1.20 },
  { id:'accra',   label:'Accra',   flag:'🇬🇭', scene:'Highlife Rising',   bonus:1.15 },
  { id:'toronto', label:'Toronto', flag:'🇨🇦', scene:'Multicultural Hub', bonus:1.10 },
];

// ─── CAREER TYPES ─────────────────────────────────────────────────────────────
export const CAREER_TYPES = [
  {
    id:'broke_underground', label:'Underground Broke', emoji:'🔥',
    desc:'Pure talent, empty pockets. The streets love you but the industry is sleeping.',
    money:150000, fans:0, socialFollowers:800,
    stats:{ sw:9, vc:7, pd:5, lp:8, hustle:12, charisma:6, network:4 },
    perk:'Hustle multiplier — side job earnings +40%',
  },
  {
    id:'social_media', label:'Social Media Star', emoji:'📱',
    desc:'Content pops off. Decent budget, massive following, but untested in a real studio.',
    money:2500000, fans:3000, socialFollowers:75000,
    stats:{ sw:4, vc:6, pd:3, lp:5, hustle:7, charisma:13, network:10 },
    perk:'Social posts earn 3× normal followers',
  },
  {
    id:'rich_kid', label:'Rich Kid', emoji:'💸',
    desc:'Funded lifestyle, zero grind. Everything costs double — including respect from peers.',
    money:30000000, fans:0, socialFollowers:8000,
    stats:{ sw:3, vc:4, pd:2, lp:2, hustle:3, charisma:8, network:7 },
    perk:'Unlocked premium producers from day one',
  },
  {
    id:'fallen_star', label:'Fallen Star', emoji:'⭐',
    desc:'You had your moment but blew the bag. Name recognition lingers. Redemption arc loading.',
    money:600000, fans:12000, socialFollowers:35000,
    stats:{ sw:7, vc:9, pd:5, lp:10, hustle:5, charisma:9, network:9 },
    perk:'NPCs remember your name — collab costs 20% less',
  },
  {
    id:'producer_artist', label:'Producer Turned Artist', emoji:'🎚️',
    desc:'You built beats for others for years. Front mic is unfamiliar territory.',
    money:4000000, fans:500, socialFollowers:5000,
    stats:{ sw:10, vc:3, pd:16, lp:2, hustle:8, charisma:5, network:8 },
    perk:'Production skill starts at 16. Songs cost 30% less to produce.',
  },
];

// ─── PRODUCERS ───────────────────────────────────────────────────────────────
export const PRODUCERS = [
  { id:'bedroom', name:'SoundCloud Beat',    tier:0, cost:0,        qBonus:0,  minFans:0,      desc:'Free loop pack. It\'s obvious.' },
  { id:'local',   name:'Local Producer',     tier:1, cost:200000,   qBonus:7,  minFans:0,      desc:'City plug with heat. Gets the job done.' },
  { id:'mid',     name:'Genre Specialist',   tier:2, cost:2000000,  qBonus:16, minFans:5000,   desc:'Knows your sound deeply. Elevates the record.' },
  { id:'top',     name:'Hitmaker',           tier:3, cost:10000000, qBonus:25, minFans:75000,  desc:'Worked with legends. Sessions are intense.' },
  { id:'legend',  name:'Legendary Producer', tier:4, cost:30000000, qBonus:35, minFans:300000, desc:'Grammy-certified. One session rewrites your career.' },
];

// ─── NPC ARTISTS ─────────────────────────────────────────────────────────────
export const NPC_ARTISTS = [
  // AFROBEATS
  { id:'burna',      name:'Burna Boy',          genre:'afrobeats', city:'lagos',   fans:3200000, clout:95, talent:20, collabCost:15000000, attitude:'selective', avatar:'🦅' },
  { id:'wizkid',     name:'Wizkid',             genre:'afrobeats', city:'lagos',   fans:4100000, clout:97, talent:19, collabCost:20000000, attitude:'selective', avatar:'⭐' },
  { id:'davido',     name:'Davido',             genre:'afrobeats', city:'lagos',   fans:3800000, clout:94, talent:18, collabCost:14000000, attitude:'friendly',  avatar:'👑' },
  { id:'rema',       name:'Rema',               genre:'afrobeats', city:'lagos',   fans:2200000, clout:87, talent:18, collabCost:7000000,  attitude:'friendly',  avatar:'🎯' },
  { id:'asake',      name:'Asake',              genre:'afrobeats', city:'lagos',   fans:1800000, clout:85, talent:17, collabCost:5000000,  attitude:'neutral',   avatar:'🔱' },
  { id:'ayrastarr',  name:'Ayra Starr',         genre:'afrobeats', city:'lagos',   fans:1200000, clout:82, talent:18, collabCost:4500000,  attitude:'friendly',  avatar:'🌸' },
  { id:'bnxn',       name:'BNXN',               genre:'afrobeats', city:'lagos',   fans:900000,  clout:78, talent:17, collabCost:3000000,  attitude:'friendly',  avatar:'🎸' },
  { id:'ruger',      name:'Ruger',              genre:'afrobeats', city:'lagos',   fans:700000,  clout:74, talent:16, collabCost:2000000,  attitude:'neutral',   avatar:'🔫' },
  { id:'blacksherif',name:'Black Sherif',       genre:'afrobeats', city:'accra',   fans:1100000, clout:80, talent:17, collabCost:4000000,  attitude:'neutral',   avatar:'🖤' },
  { id:'fireboy',    name:'Fireboy DML',        genre:'afrobeats', city:'accra',   fans:850000,  clout:76, talent:16, collabCost:3000000,  attitude:'friendly',  avatar:'🔥' },
  // R&B
  { id:'tems',       name:'Tems',               genre:'rnb',       city:'lagos',   fans:2400000, clout:89, talent:20, collabCost:10000000, attitude:'selective', avatar:'🌊' },
  { id:'omahlay',    name:'Omah Lay',           genre:'rnb',       city:'lagos',   fans:800000,  clout:77, talent:17, collabCost:3000000,  attitude:'friendly',  avatar:'🌙' },
  { id:'sza',        name:'SZA',                genre:'rnb',       city:'atlanta', fans:4200000, clout:95, talent:20, collabCost:18000000, attitude:'selective', avatar:'🪐' },
  { id:'summerw',    name:'Summer Walker',      genre:'rnb',       city:'atlanta', fans:2000000, clout:86, talent:18, collabCost:8000000,  attitude:'neutral',   avatar:'🌺' },
  // HIP-HOP
  { id:'drake',      name:'Drake',              genre:'hiphop',    city:'toronto', fans:5800000, clout:98, talent:19, collabCost:30000000, attitude:'selective', avatar:'🦉' },
  { id:'kendrick',   name:'Kendrick Lamar',     genre:'hiphop',    city:'atlanta', fans:4900000, clout:99, talent:25, collabCost:25000000, attitude:'hostile',   avatar:'🏆' },
  { id:'21savage',   name:'21 Savage',          genre:'hiphop',    city:'atlanta', fans:3100000, clout:91, talent:18, collabCost:10000000, attitude:'neutral',   avatar:'💎' },
  { id:'carti',      name:'Playboi Carti',      genre:'hiphop',    city:'atlanta', fans:2800000, clout:89, talent:15, collabCost:8000000,  attitude:'selective', avatar:'🧛' },
  { id:'icespice',   name:'Ice Spice',          genre:'hiphop',    city:'atlanta', fans:1500000, clout:83, talent:16, collabCost:5000000,  attitude:'friendly',  avatar:'🌶️' },
  { id:'glorilla',   name:'GloRilla',           genre:'hiphop',    city:'atlanta', fans:1200000, clout:80, talent:17, collabCost:4000000,  attitude:'friendly',  avatar:'🦁' },
  // POP
  { id:'taylor',     name:'Taylor Swift',       genre:'pop',       city:'london',  fans:7500000, clout:99, talent:20, collabCost:50000000, attitude:'selective', avatar:'💛' },
  { id:'sabrina',    name:'Sabrina Carpenter',  genre:'pop',       city:'london',  fans:2900000, clout:90, talent:18, collabCost:10000000, attitude:'friendly',  avatar:'🍒' },
  { id:'chappell',   name:'Chappell Roan',      genre:'pop',       city:'london',  fans:1800000, clout:84, talent:19, collabCost:6000000,  attitude:'friendly',  avatar:'👄' },
  // ALT
  { id:'tyler',      name:'Tyler, The Creator', genre:'alt',       city:'atlanta', fans:3400000, clout:93, talent:25, collabCost:15000000, attitude:'selective', avatar:'🌹' },
  { id:'benson',     name:'Benson Boone',       genre:'alt',       city:'london',  fans:1400000, clout:81, talent:17, collabCost:5000000,  attitude:'friendly',  avatar:'🎵' },
];

// ─── LABELS ──────────────────────────────────────────────────────────────────
export const LABELS = [
  {
    id:'independent', name:'Independent', tierLabel:'Self-Released',
    advance:0, artistSplit:100, labelSplit:0, marketingMult:1.0,
    contractWeeks:0, creativeControl:100, minClout:0, minFans:0,
    color:'#555', pressureThreshold:99,
    desc:'You own everything. No advance, no machine behind you — just you.',
    demands:[],
  },
  {
    id:'empire', name:'Empire Sounds', tierLabel:'Indie Label',
    advance:1500000, artistSplit:58, labelSplit:42, marketingMult:1.5,
    contractWeeks:52, creativeControl:82, minClout:10, minFans:1000,
    color:'#3dffa0', pressureThreshold:3,
    desc:'Boutique indie. Artist-friendly split, creative freedom, modest budget.',
    demands:['1 single per quarter','3 social posts per week'],
  },
  {
    id:'nova', name:'Nova Records', tierLabel:'Mid-Tier Label',
    advance:6000000, artistSplit:38, labelSplit:62, marketingMult:2.2,
    contractWeeks:104, creativeControl:60, minClout:25, minFans:8000,
    color:'#5cc8ff', pressureThreshold:2,
    desc:'Real marketing budget. They\'ll push you hard, but they want commercial hits.',
    demands:['1 album per year','Approve all visuals','5 social posts per week'],
  },
  {
    id:'titan', name:'Titan Music Group', tierLabel:'Major Label',
    advance:25000000, artistSplit:20, labelSplit:80, marketingMult:4.5,
    contractWeeks:260, creativeControl:28, minClout:50, minFans:50000,
    color:'#f5c842', pressureThreshold:1,
    desc:'Global machine. Massive advance but they own your sound, image, and schedule.',
    demands:['2 albums per year','Full creative approval','10 social posts per week','Mandatory press tours'],
  },
  {
    id:'apex', name:'Apex 360', tierLabel:'360 Deal',
    advance:40000000, artistSplit:15, labelSplit:85, marketingMult:5.5,
    contractWeeks:312, creativeControl:15, minClout:65, minFans:150000,
    color:'#ff5c7a', pressureThreshold:1,
    desc:'Biggest advance in the game. They take a cut of EVERYTHING: tours, merch, brand deals, your soul.',
    demands:['Full creative override','40% of all revenue streams','6-year lock-in','No independent releases'],
  },
];

// ─── RANDOM EVENTS ───────────────────────────────────────────────────────────
export const RANDOM_EVENTS = [
  { id:'viral',      label:'Went Viral',              emoji:'🔥', desc:'A clip exploded online. Algorithm is blessing you.',      effect:{fans:800,  clout:4},                neg:false },
  { id:'bad_press',  label:'Bad Interview',            emoji:'📰', desc:'A clip resurfaced. People are talking — not nicely.',     effect:{clout:-5,  fans:-300, reputation:-5}, neg:true  },
  { id:'award_nom',  label:'Award Nomination',         emoji:'🏆', desc:'You\'re nominated for Best New Artist.',                 effect:{clout:8,   fans:1000, reputation:8},  neg:false, minWeeks:24, minQuality:65, minFans:50000 },
  { id:'burnout',    label:'Burnout',                  emoji:'😩', desc:'Grinding too hard. Your body is forcing a reset.',       effect:{energy:-40, sw:-1},                  neg:true  },
  { id:'beef',       label:'Public Beef',              emoji:'😤', desc:'Another artist came for you publicly. Respond or dodge.', effect:{fans:200,  clout:-2, reputation:-3}, neg:true  },
  { id:'stolen_gear',label:'Studio Break-In',          emoji:'😱', desc:'Equipment stolen. Major setback to recording sessions.',  effect:{money:-800000, energy:-10},          neg:true  },
  { id:'sync_indie', label:'Indie Sync Deal',          emoji:'🎬', desc:'Your track licensed for a Netflix short film.',          effect:{money:3000000, fans:300, clout:2},    neg:false, maxFans:50000 },
  { id:'sync_major', label:'Major Sync Deal',          emoji:'🎬', desc:'Global series wants your track. Streams are exploding.', effect:{money:15000000, fans:2000, clout:8},  neg:false, minFans:50000 },
  { id:'trend',      label:'Genre is Trending',        emoji:'📈', desc:'Your genre just hit the mainstream. Ride the wave.',     effect:{fans:500,  clout:3},                neg:false },
  { id:'superfans',  label:'Superfan Community',       emoji:'💜', desc:'A dedicated fan community formed around your music.',    effect:{fans:400,  money:200000},             neg:false },
  { id:'collab_req', label:'Unsolicited Collab Offer', emoji:'🤝', desc:'An established artist reached out personally.',          effect:{fans:300,  money:1500000, clout:3},   neg:false, minWeeks:16 },
  { id:'piracy',     label:'Piracy Wave',              emoji:'☠️', desc:'Your music is being downloaded illegally everywhere.',    effect:{money:-500000, fans:100},             neg:true  },
  { id:'label_buzz', label:'Label Interest',           emoji:'📋', desc:'A label rep saw your show and wants a meeting.',         effect:{clout:3,   network:2},               neg:false, minWeeks:8 },
];

// ─── LABEL EVENTS ─────────────────────────────────────────────────────────────
export const LABEL_EVENTS = [
  { id:'push_single', label:'Label Demands a Single', emoji:'📢', desc:'Pressure to drop something within 2 weeks.', choice:true,
    options:[{text:'Drop a track (any quality)',effect:{pressure:-2,clout:1}},{text:'Push back',effect:{pressure:1,labelRel:-6,reputation:2}}] },
  { id:'creative_clash', label:'Creative Clash', emoji:'🎨', desc:'Label hates your new direction. They want more commercial.',  choice:true,
    options:[{text:'Comply (sound changes)',effect:{money:800000,fans:200}},{text:'Hold your ground',effect:{labelRel:-10,clout:3,reputation:3}}] },
  { id:'promo_push', label:'Label Campaign Launch', emoji:'🚀', desc:'Your label just dropped serious marketing budget.', choice:false, effect:{fans:1200,clout:5,money:1500000} },
  { id:'dropped_risk', label:'Numbers Not Meeting Targets', emoji:'⚠️', desc:'Label is threatening to drop you.', choice:true,
    options:[{text:'Accept being dropped',effect:{dropped:true}},{text:'Renegotiate (need clout 40+)',effect:{renegotiate:true}}] },
  { id:'bonus_payment', label:'Streaming Bonus', emoji:'💰', desc:'Exceeded quarterly streaming targets.', choice:false, effect:{money:3000000,labelRel:5} },
  { id:'360_cut', label:'360 Revenue Clawback', emoji:'✂️', desc:'Your 360 label took their tour earnings cut.', choice:false, effect:{money:-2000000} },
  { id:'recoup_notice', label:'Recoupment Warning', emoji:'📬', desc:'Advance still hasn\'t been recouped. Pressure rising.', choice:false, effect:{pressure:2,labelRel:-4} },
];

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const JOBS = [
  { id:'dj_set',       label:'DJ at Local Venue',   emoji:'🎧', cost:1, income:80000,   skillGain:{lp:1},  req:null,          desc:'Spin records for the crowd. Builds live presence.' },
  { id:'session',      label:'Session Musician',     emoji:'🎸', cost:1, income:200000,  skillGain:{vc:1},  req:'vc5',         desc:'Play on someone else\'s record. Steady bag.' },
  { id:'teach',        label:'Give Music Lessons',   emoji:'📚', cost:1, income:60000,   skillGain:{sw:1},  req:null,          desc:'Teach basics. You learn by teaching.' },
  { id:'studio_asst',  label:'Studio Assistant',     emoji:'🎚️', cost:1, income:120000,  skillGain:{pd:1},  req:null,          desc:'Assist bigger sessions. Learn the board.' },
  { id:'jingle',       label:'Write Jingles',        emoji:'📣', cost:2, income:500000,  skillGain:{sw:1},  req:'sw7',         desc:'Commercial work. Not glamorous, pays well.' },
  { id:'ghost_write',  label:'Ghost Write',          emoji:'✍️', cost:2, income:1500000, skillGain:{sw:2},  req:'sw10',        desc:'Write hits for someone else. High risk, high reward.' },
  { id:'ambassador',   label:'Brand Ambassador',     emoji:'🤝', cost:1, income:300000,  skillGain:null,    req:'fans5000',    desc:'Represent a brand on social. Easy money.' },
  { id:'headline_gig', label:'Headline Local Show',  emoji:'🎤', cost:2, income:800000,  skillGain:{lp:2},  req:'fans1000',    desc:'Headline at a real venue. Build your stage presence.' },
];

// ─── ACTIONS ─────────────────────────────────────────────────────────────────
export const ACTIONS = [
  // Skills
  { id:'write_lyrics',    cat:'Skills', label:'Write Lyrics',        emoji:'✍️',  cost:1, desc:'Sharpen your songwriting',    effect:{sw:2, energy:-8},                  req:null },
  { id:'vocal_practice',  cat:'Skills', label:'Vocal Practice',      emoji:'🎤',  cost:1, desc:'Train your delivery',         effect:{vc:2, energy:-8},                  req:null },
  { id:'study_prod',      cat:'Skills', label:'Study Production',    emoji:'🎚️', cost:1, desc:'Learn the studio board',      effect:{pd:2, energy:-8},                  req:null },
  { id:'genre_practice',  cat:'Skills', label:'Practice Your Genre', emoji:'🎶',  cost:1, desc:'Master your genre\'s craft',  effect:{genreBonus:2, energy:-8},          req:null },
  { id:'live_rehearsal',  cat:'Skills', label:'Live Rehearsal',      emoji:'🎸',  cost:1, desc:'Rehearse your stage show',    effect:{lp:2, energy:-8},                  req:null },
  // Hustle
  { id:'post_content',    cat:'Hustle', label:'Post Content',        emoji:'📱',  cost:1, desc:'Feed the algorithm',          effect:{socialFollowers:500, clout:1, energy:-5}, req:null },
  { id:'interview',       cat:'Hustle', label:'Do Interview',        emoji:'🗞️', cost:1, desc:'Build press profile',         effect:{clout:3, fans:150, energy:-8},     req:'clout5' },
  { id:'networking',      cat:'Hustle', label:'Industry Networking', emoji:'🤵',  cost:1, desc:'Build connections',           effect:{network:2, energy:-10},            req:null },
  { id:'rest',            cat:'Rest',   label:'Rest',                emoji:'😴',  cost:1, desc:'Recover energy',              effect:{energy:40},                        req:null },
  // Business
  { id:'hire_manager',    cat:'Team',   label:'Hire Manager',        emoji:'💼',  cost:2, desc:'Costs ₦200k/week, boosts deals', effect:{money:-1000000},               req:'money1m',    special:'manager' },
  { id:'hire_lawyer',     cat:'Team',   label:'Hire Entertainment Lawyer', emoji:'⚖️', cost:2, desc:'Protects your interests in deals', effect:{money:-500000},         req:'money500k',  special:'lawyer' },
  { id:'launch_merch',    cat:'Business',label:'Launch Merch Line',  emoji:'👕',  cost:2, desc:'Set up your merch store',     effect:{money:-2000000},                   req:'fans5000',   special:'merch' },
  { id:'run_promo',       cat:'Business',label:'Run Paid Promo',     emoji:'📣',  cost:2, desc:'Pay for ads and reach',       effect:{money:-500000, fans:800, clout:2}, req:'money500k' },
  { id:'book_brand',      cat:'Business',label:'Pursue Brand Deal',  emoji:'🤑',  cost:2, desc:'Pitch yourself to brands',    effect:{network:2, energy:-10},            req:'fans10000',  special:'brand' },
  { id:'book_tour',       cat:'Business',label:'Book Regional Tour', emoji:'🚌',  cost:3, desc:'Multi-city performance run',  effect:{money:-3000000},                   req:'fans25000',  special:'tour' },
];

// ─── MILESTONES ───────────────────────────────────────────────────────────────
export const MILESTONES = [
  { fans:0,        tier:'Bedroom Artist',   color:'#666777',  },
  { fans:500,      tier:'Local Buzz',        color:'#a78bfa',  },
  { fans:5000,     tier:'City Known',        color:'#60a5fa',  },
  { fans:25000,    tier:'National Radar',    color:'#34d399',  },
  { fans:100000,   tier:'Certified Act',     color:'#f59e0b',  },
  { fans:500000,   tier:'Continental Star',  color:'#fb923c',  },
  { fans:2000000,  tier:'Global Icon',       color:'#f87171',  },
  { fans:10000000, tier:'Legendary',         color:'#fbbf24',  },
];

// ─── CHART NPC SONGS (procedural) ────────────────────────────────────────────
export const NPC_SONG_TITLES = [
  'Higher','Last Night','Colors','Fire','Waves','Always','Gold','Eclipse',
  'Rhythm','Midnight','Legacy','Crown','Pressure','Silence','Storm',
  'Eternity','Vision','Worth It','No Cap','Levels','Vibes','Real Ones',
  'Elevation','Journey','Timeless','Drip','Glory','Hustle','Frequency',
];
