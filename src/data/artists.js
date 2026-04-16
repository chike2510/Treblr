// ─── 40 NPC ARTISTS ──────────────────────────────────────────────────────────
// talent: 1-25 (25 = GOAT tier)
// fans in raw number
// releaseFrequency: weeks between releases
// collabCost in naira

export const NPC_ARTISTS = [
  // ── AFROBEATS (12) ─────────────────────────────────────────────────────────
  { id:'burna',       name:'Burna Boy',         initials:'BB', color:'#E07020', genre:'afrobeats', fans:3200000, clout:95, talent:22, collabCost:15000000, attitude:'selective', releaseFrequency:10 },
  { id:'wizkid',      name:'Wizkid',            initials:'WZ', color:'#C8922A', genre:'afrobeats', fans:4100000, clout:97, talent:21, collabCost:20000000, attitude:'selective', releaseFrequency:12 },
  { id:'davido',      name:'Davido',            initials:'DV', color:'#6C3FCC', genre:'afrobeats', fans:3800000, clout:94, talent:20, collabCost:14000000, attitude:'friendly',  releaseFrequency:8  },
  { id:'rema',        name:'Rema',              initials:'RM', color:'#00B8D4', genre:'afrobeats', fans:2200000, clout:87, talent:20, collabCost:7000000,  attitude:'friendly',  releaseFrequency:7  },
  { id:'asake',       name:'Asake',             initials:'AS', color:'#D63548', genre:'afrobeats', fans:1800000, clout:85, talent:19, collabCost:5000000,  attitude:'neutral',   releaseFrequency:6  },
  { id:'ayra',        name:'Ayra Starr',        initials:'AY', color:'#E07020', genre:'afrobeats', fans:1200000, clout:82, talent:20, collabCost:4500000,  attitude:'friendly',  releaseFrequency:7  },
  { id:'bnxn',        name:'BNXN',              initials:'BX', color:'#0D9F68', genre:'afrobeats', fans:900000,  clout:78, talent:18, collabCost:3000000,  attitude:'friendly',  releaseFrequency:6  },
  { id:'ruger',       name:'Ruger',             initials:'RG', color:'#A855F7', genre:'afrobeats', fans:700000,  clout:74, talent:17, collabCost:2000000,  attitude:'neutral',   releaseFrequency:5  },
  { id:'blacksherif', name:'Black Sherif',      initials:'BS', color:'#374151', genre:'afrobeats', fans:1100000, clout:80, talent:19, collabCost:4000000,  attitude:'neutral',   releaseFrequency:7  },
  { id:'fireboy',     name:'Fireboy DML',       initials:'FB', color:'#F59E0B', genre:'afrobeats', fans:850000,  clout:76, talent:17, collabCost:3000000,  attitude:'friendly',  releaseFrequency:6  },
  { id:'omahlay',     name:'Omah Lay',          initials:'OL', color:'#2563EB', genre:'afrobeats', fans:800000,  clout:77, talent:18, collabCost:3000000,  attitude:'friendly',  releaseFrequency:6  },
  { id:'wandecoal',   name:'Wande Coal',        initials:'WC', color:'#0D9F68', genre:'afrobeats', fans:620000,  clout:71, talent:17, collabCost:2500000,  attitude:'friendly',  releaseFrequency:8  },

  // ── R&B (6) ─────────────────────────────────────────────────────────────────
  { id:'tems',        name:'Tems',              initials:'TM', color:'#7C3AED', genre:'rnb',    fans:2400000, clout:89, talent:22, collabCost:10000000, attitude:'selective', releaseFrequency:9  },
  { id:'sza',         name:'SZA',               initials:'SZ', color:'#DB2777', genre:'rnb',    fans:4200000, clout:95, talent:22, collabCost:18000000, attitude:'selective', releaseFrequency:12 },
  { id:'summerw',     name:'Summer Walker',     initials:'SW', color:'#BE185D', genre:'rnb',    fans:2000000, clout:86, talent:20, collabCost:8000000,  attitude:'neutral',   releaseFrequency:8  },
  { id:'brentf',      name:'Brent Faiyaz',      initials:'BF', color:'#6D28D9', genre:'rnb',    fans:1700000, clout:84, talent:20, collabCost:6000000,  attitude:'selective', releaseFrequency:10 },
  { id:'syd',         name:'Syd',               initials:'SY', color:'#0D9F68', genre:'rnb',    fans:800000,  clout:73, talent:19, collabCost:3000000,  attitude:'friendly',  releaseFrequency:8  },
  { id:'chloe',       name:'Chlöe Bailey',      initials:'CB', color:'#F59E0B', genre:'rnb',    fans:1100000, clout:78, talent:18, collabCost:4000000,  attitude:'friendly',  releaseFrequency:7  },

  // ── HIP-HOP (10) ────────────────────────────────────────────────────────────
  { id:'drake',       name:'Drake',             initials:'DR', color:'#6C3FCC', genre:'hiphop', fans:5800000, clout:98, talent:21, collabCost:30000000, attitude:'selective', releaseFrequency:14 },
  { id:'kendrick',    name:'Kendrick Lamar',    initials:'KL', color:'#1D4ED8', genre:'hiphop', fans:4900000, clout:99, talent:25, collabCost:25000000, attitude:'hostile',   releaseFrequency:16 },
  { id:'21savage',    name:'21 Savage',         initials:'21', color:'#374151', genre:'hiphop', fans:3100000, clout:91, talent:19, collabCost:10000000, attitude:'neutral',   releaseFrequency:7  },
  { id:'carti',       name:'Playboi Carti',     initials:'PC', color:'#DC2626', genre:'hiphop', fans:2800000, clout:89, talent:17, collabCost:8000000,  attitude:'selective', releaseFrequency:18 },
  { id:'icespice',    name:'Ice Spice',         initials:'IS', color:'#F97316', genre:'hiphop', fans:1500000, clout:83, talent:16, collabCost:5000000,  attitude:'friendly',  releaseFrequency:5  },
  { id:'glorilla',    name:'GloRilla',          initials:'GL', color:'#EC4899', genre:'hiphop', fans:1200000, clout:80, talent:17, collabCost:4000000,  attitude:'friendly',  releaseFrequency:5  },
  { id:'future',      name:'Future',            initials:'FT', color:'#059669', genre:'hiphop', fans:3400000, clout:93, talent:18, collabCost:12000000, attitude:'neutral',   releaseFrequency:5  },
  { id:'metro',       name:'Metro Boomin',      initials:'MB', color:'#0F172A', genre:'hiphop', fans:2100000, clout:90, talent:23, collabCost:8000000,  attitude:'neutral',   releaseFrequency:10 },
  { id:'roddy',       name:'Roddy Ricch',       initials:'RR', color:'#2563EB', genre:'hiphop', fans:1800000, clout:85, talent:18, collabCost:5000000,  attitude:'friendly',  releaseFrequency:6  },
  { id:'lilbaby',     name:'Lil Baby',          initials:'LB', color:'#7C3AED', genre:'hiphop', fans:3200000, clout:92, talent:18, collabCost:12000000, attitude:'neutral',   releaseFrequency:5  },

  // ── POP (6) ─────────────────────────────────────────────────────────────────
  { id:'taylor',      name:'Taylor Swift',      initials:'TS', color:'#BE185D', genre:'pop',    fans:7500000, clout:99, talent:22, collabCost:50000000, attitude:'selective', releaseFrequency:16 },
  { id:'sabrina',     name:'Sabrina Carpenter', initials:'SC', color:'#F43F5E', genre:'pop',    fans:2900000, clout:90, talent:20, collabCost:10000000, attitude:'friendly',  releaseFrequency:7  },
  { id:'chappell',    name:'Chappell Roan',     initials:'CR', color:'#A21CAF', genre:'pop',    fans:1800000, clout:84, talent:21, collabCost:6000000,  attitude:'friendly',  releaseFrequency:9  },
  { id:'billie',      name:'Billie Eilish',     initials:'BE', color:'#16A34A', genre:'pop',    fans:5200000, clout:97, talent:22, collabCost:25000000, attitude:'selective', releaseFrequency:14 },
  { id:'olivia',      name:'Olivia Rodrigo',    initials:'OR', color:'#DC2626', genre:'pop',    fans:4100000, clout:93, talent:20, collabCost:15000000, attitude:'friendly',  releaseFrequency:12 },
  { id:'weeknd',      name:'The Weeknd',        initials:'XO', color:'#92400E', genre:'pop',    fans:6300000, clout:98, talent:22, collabCost:30000000, attitude:'selective', releaseFrequency:12 },

  // ── ALTERNATIVE (6) ─────────────────────────────────────────────────────────
  { id:'tyler',       name:'Tyler, The Creator',initials:'TC', color:'#16A34A', genre:'alt',    fans:3400000, clout:93, talent:25, collabCost:15000000, attitude:'selective', releaseFrequency:14 },
  { id:'benson',      name:'Benson Boone',      initials:'BB', color:'#2563EB', genre:'alt',    fans:1400000, clout:81, talent:18, collabCost:5000000,  attitude:'friendly',  releaseFrequency:6  },
  { id:'gracie',      name:'Gracie Abrams',     initials:'GA', color:'#9333EA', genre:'alt',    fans:900000,  clout:75, talent:18, collabCost:3000000,  attitude:'friendly',  releaseFrequency:7  },
  { id:'stevelacy',   name:'Steve Lacy',        initials:'SL', color:'#EA580C', genre:'alt',    fans:2200000, clout:87, talent:21, collabCost:7000000,  attitude:'selective', releaseFrequency:10 },
  { id:'conangray',   name:'Conan Gray',        initials:'CG', color:'#6D28D9', genre:'alt',    fans:1600000, clout:82, talent:18, collabCost:5000000,  attitude:'friendly',  releaseFrequency:8  },
  { id:'frankocean',  name:'Frank Ocean',       initials:'FO', color:'#1E40AF', genre:'alt',    fans:5100000, clout:98, talent:25, collabCost:40000000, attitude:'hostile',   releaseFrequency:52 },
];

export const NPC_SONG_TITLES = [
  'Higher','Last Night','Colors','Fire','Waves','Always','Gold','Eclipse',
  'Rhythm','Midnight','Legacy','Crown','Pressure','Silence','Storm',
  'Eternity','Vision','Worth It','No Cap','Levels','Vibes','Real Ones',
  'Elevation','Journey','Timeless','Drip','Glory','Hustle','Frequency',
  'Alright','God Did','Mercy','Savage','Numb','Ghost','Way Up',
  'Forever','Blessed','Clout','Fade','Bounce','Savage Mode','Heartless',
  'Gods Plan','Circles','Essence','Woman','Soro Soke','Overdue',
  'Bloody Samaritan','Rush','Cough','Unfortunate','Peru','Essence',
  'Calm Down','Ye','Finesse','Joro','Wonder','Rotate',
];
