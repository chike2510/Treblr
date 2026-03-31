import Song from './models/Song.js';
import User from './models/User.js';
import { Artist, Chart, Event } from './models/models.js';

// ── REAL ARTIST NAMES BY TIER ─────────────────────────────────────────────────

const REAL_ARTISTS = {
  superstar: [
    'Drake', 'Taylor Swift', 'Beyoncé', 'Kendrick Lamar', 'Bad Bunny',
    'The Weeknd', 'Rihanna', 'Eminem', 'Jay-Z', 'Kanye West',
    'Burna Boy', 'Wizkid', 'Davido', 'SZA', 'Adele'
  ],
  mainstream: [
    'Rema', 'Asake', 'Tems', 'Ayra Starr', 'Oxlade',
    'Fireboy DML', 'Omah Lay', 'Ckay', 'Kizz Daniel', 'Gyakie',
    'Post Malone', 'Travis Scott', 'Cardi B', 'Doja Cat', 'J. Cole',
    'Future', 'Lil Baby', 'Rod Wave', 'Peso Pluma', 'Karol G',
    'Central Cee', 'Dave', 'Stormzy', 'J Hus', 'NewJeans'
  ],
  midtier: [
    'Victony', 'Ruger', 'Zinoleesky', 'Bella Shmurda', 'Lojay',
    'Benson Boone', 'Conan Gray', 'Laufey', 'Steve Lacy', 'Giveon',
    'Snoh Aalegra', 'Sampha', 'Flo Milli', 'GloRilla', 'Yeat',
    'Polo G', 'NLE Choppa', 'Arlo Parks', 'Pip Millett', 'Kojey Radical',
    'Ado', 'Fujii Kaze', 'Sfera Ebbasta', 'Mahmood', 'Capo Plaza'
  ],
  rising: [
    'Shallipopi', 'Odumodublvck', 'Portable', 'Seyi Vibez', 'Fave',
    'Cruel Santino', 'BOJ', 'Amaarae', 'Kwesi Arthur', 'Odeal',
    'Ice Spice', 'PinkPantheress', 'Baby Tate', 'Latto', 'BIA',
    'Omar Apollo', 'Gracie Abrams', 'Beabadoobee', 'role model', 'Digga D',
    'Aitch', 'Tion Wayne', 'Toosii', 'Morray', 'Eladio Carrión'
  ],
  indie: [
    'Tay Iwar', 'Odunsi', 'Lady Donli', 'Simi', 'Adekunle Gold',
    'Cleo Sol', 'Little Simz', 'Pa Salieu', 'Obongjayar', 'Greentea Peng',
    'Novo Amor', 'Phoebe Bridgers', 'Ethel Cain', 'Magdalena Bay', 'Enny',
    'Yaya Bey', 'Ama Lou', 'Ego Ella May', 'JONES', 'Sault',
    'billy woods', 'Quelle Chris', 'Your Old Droog', 'yeule', 'Oklou'
  ]
};

// ── REAL-ISH SONG TITLES ──────────────────────────────────────────────────────

const SONG_TITLES = [
  // Afrobeats
  'Calm Down', 'Essence', 'Ye', 'Electricity', 'Organise',
  'Terminator', 'Rush', 'Overloading', 'Understand', 'Palazzo',
  'Bloody Samaritan', 'Feelings', 'Dior', 'Sungba', 'Peru',
  'Joha', 'Dull', 'Wicked and Wild', 'Bounce', 'Monalisa',
  // Hip-Hop
  'Rich Flex', 'Wait for U', 'Nonstop', 'God Did', 'Jimmy Cooks',
  'Middle Child', 'HUMBLE.', 'Money Trees', 'Knife Talk', 'Sicko Mode',
  'fukumean', 'On BS', 'Spin Bout U', 'Bread & Butter', 'P. POWER',
  // Pop
  'Anti-Hero', 'Shake It Off', 'Blank Space', 'Lover', 'As It Was',
  'Watermelon Sugar', 'Adore You', 'Golden', 'Falling', 'Kill Bill',
  'Good Days', 'Snooze', 'Die For You', 'Out of Time', 'Best Friend',
  // R&B
  'Special', 'About Damn Time', 'Break My Soul', 'Hrs & Hrs', 'Pheromones',
  'Superpower', 'I Miss You', 'Spend the Night', 'Pick Up Your Feelings', 'Creepin',
  // Latin
  'Tití Me Preguntó', 'Me Porto Bonito', 'Moscow Mule', 'BZRP Session',
  'Quevedo', 'Despechá', 'La Bachata', 'Te Felicito', 'Ojitos Lindos', 'El Apagón',
  // UK
  'Escapism', 'Baby Riddim', 'Sprinter', 'Who Told You', 'On the Road',
  'Body Bag', 'No Smoke', 'Seventeen', 'I Am', 'Abra Cadabra',
  // General
  'Neon', 'Golden Hour', 'Midnight Rain', 'Lavender Haze', 'Karma',
  'Bejeweled', 'High Infidelity', 'Snow on the Beach', 'Question', 'You\'re on Your Own'
];

const GENRES = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic', 'Afrobeats', 'Latin', 'Country', 'Indie', 'Alternative'];

const GENRE_BY_TIER = {
  superstar:  ['Pop', 'Hip-Hop', 'R&B', 'Afrobeats', 'Latin'],
  mainstream: ['Afrobeats', 'Hip-Hop', 'Pop', 'R&B', 'Latin'],
  midtier:    ['Afrobeats', 'Hip-Hop', 'R&B', 'Indie', 'Pop'],
  rising:     ['Afrobeats', 'Hip-Hop', 'R&B', 'Pop', 'Alternative'],
  indie:      ['Indie', 'Alternative', 'R&B', 'Afrobeats', 'Electronic']
};

const AVATAR_COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
  '#3498db','#9b59b6','#e91e63','#ff5722','#00bcd4',
  '#4caf50','#ff9800','#607d8b','#795548','#673ab7'
];

const usedNames = new Set();

export function rndSongTitle() {
  return SONG_TITLES[Math.floor(Math.random() * SONG_TITLES.length)];
}

function rndArtistName(tier) {
  const pool      = REAL_ARTISTS[tier] || REAL_ARTISTS.indie;
  const available = pool.filter(n => !usedNames.has(n));
  if (available.length === 0) {
    const base = pool[Math.floor(Math.random() * pool.length)];
    return base + [' II', ' Jr', ' III'][Math.floor(Math.random() * 3)];
  }
  const name = available[Math.floor(Math.random() * available.length)];
  usedNames.add(name);
  return name;
}

// ── QUALITY CALCULATION ───────────────────────────────────────────────────────

export function calcSongQuality(attrs, isProduced = false) {
  const { songwriting, vocals, production, workEthic } = attrs;
  const effort      = (workEthic / 100) * 20;
  const catchiness  = Math.min(100, Math.round(songwriting * 0.5 + vocals * 0.2 + effort + Math.random() * 25));
  const lyrics      = Math.min(100, Math.round(songwriting * 0.7 + effort + Math.random() * 20));
  const prod        = Math.min(100, Math.round((isProduced ? production : production * 0.6) + effort + Math.random() * 20));
  const replayValue = Math.min(100, Math.round(catchiness * 0.4 + lyrics * 0.3 + prod * 0.2 + Math.random() * 15));
  const overallScore = Math.round(catchiness * 0.3 + lyrics * 0.25 + prod * 0.25 + replayValue * 0.2);
  return { catchiness, lyrics, production: prod, replayValue, overallScore };
}

function npcQuality(tier) {
  const ranges = { indie:[20,55], rising:[35,65], midtier:[50,75], mainstream:[62,85], superstar:[74,98] };
  const [mn, mx] = ranges[tier] || [20, 55];
  const r = () => Math.round(mn + Math.random() * (mx - mn));
  const catchiness = r(), lyrics = r(), production = r(), replayValue = r();
  return { catchiness, lyrics, production, replayValue, overallScore: Math.round(catchiness*0.3+lyrics*0.25+production*0.25+replayValue*0.2) };
}

// ── STREAMING ALGORITHM ───────────────────────────────────────────────────────

function decayRate(score) {
  if (score >= 90) return 0.97; if (score >= 75) return 0.94;
  if (score >= 60) return 0.90; if (score >= 45) return 0.86; return 0.80;
}
function baseStreams(fanbase) {
  if (fanbase >= 10_000_000) return 5_000_000; if (fanbase >= 1_000_000) return 500_000;
  if (fanbase >= 100_000)    return 50_000;     if (fanbase >= 10_000)    return 5_000;
  if (fanbase >= 1_000)      return 500;        return 50;
}

export function calcWeeklyStreams(song, artist, curWeek, curYear) {
  const weeksOut  = (curYear-(song.releasedYear||1))*52 + (curWeek-(song.releasedWeek||1));
  const ageMult   = Math.pow(decayRate(song.quality.overallScore), Math.max(0, weeksOut));
  const qualMult  = 0.1 + (song.quality.overallScore/100)*1.9;
  const fanbase   = artist?.career?.fanbase||1000;
  const fanMult   = 0.5 + Math.log10(Math.max(fanbase,10))/7;
  const buzz      = artist?.career?.buzz||10;
  const buzzMult  = 0.5 + (buzz/100)*1.5;
  const promoMult = song.marketing?.isPromoted ? 1+(song.marketing.promotionWeeks*0.15) : 1;
  const viralMult = song.marketing?.viralMultiplier||1;
  const catchBoost= 0.8+(song.quality.catchiness/100)*0.4;
  const randFact  = viralMult>1.5 ? 0.5+Math.random()*3 : 0.7+Math.random()*0.6;
  return Math.max(0, Math.floor(baseStreams(fanbase)*qualMult*fanMult*buzzMult*ageMult*promoMult*viralMult*catchBoost*randFact));
}

// ── WEEKLY UPDATE ─────────────────────────────────────────────────────────────

export async function runWeeklyUpdate(curWeek, curYear) {
  const songs = await Song.find({ status:'released' });
  const results = [];
  for (const song of songs) {
    const artist = song.isNPC ? await Artist.findById(song.artistId) : await User.findById(song.artistId);
    if (!artist) continue;
    const weekly = calcWeeklyStreams(song, artist, curWeek, curYear);
    song.streaming.weeklyStreams = weekly;
    song.streaming.totalStreams += weekly;
    if (weekly > song.streaming.peakStreams) song.streaming.peakStreams = weekly;
    song.streaming.streamHistory.push({ week:curWeek, year:curYear, streams:weekly });
    if (song.streaming.streamHistory.length > 52) song.streaming.streamHistory.shift();
    const revenue = Math.floor(weekly*0.004);
    song.revenue += revenue;
    song.updateCert();
    if (song.marketing.viralMultiplier>1) song.marketing.viralMultiplier=Math.max(1,song.marketing.viralMultiplier*0.85);
    if (song.marketing.isPromoted&&song.marketing.promotionWeeks>0) { song.marketing.promotionWeeks--; if(song.marketing.promotionWeeks===0)song.marketing.isPromoted=false; }
    await song.save();
    results.push({ artistId:song.artistId, isNPC:song.isNPC, weekly, revenue });
  }
  const map = {};
  for (const r of results) { const k=r.artistId.toString(); if(!map[k])map[k]={weekly:0,revenue:0,isNPC:r.isNPC}; map[k].weekly+=r.weekly; map[k].revenue+=r.revenue; }
  for (const [id,data] of Object.entries(map)) {
    if (data.isNPC) await Artist.findByIdAndUpdate(id,{$set:{'career.weeklyStreams':data.weekly},$inc:{'career.totalStreams':data.weekly}});
    else await User.findByIdAndUpdate(id,{$set:{'career.weeklyStreams':data.weekly},$inc:{'career.totalStreams':data.weekly,'career.money':data.revenue}});
  }
  return results;
}

// ── NPC SYSTEM ────────────────────────────────────────────────────────────────

function mkNPC(tier) {
  const fanRanges = { indie:[500,5000], rising:[5000,50000], midtier:[50000,500000], mainstream:[500000,5000000], superstar:[5000000,50000000] };
  const attrRanges= { indie:[20,45], rising:[35,60], midtier:[50,70], mainstream:[62,82], superstar:[75,97] };
  const [amn,amx] = attrRanges[tier]||attrRanges.indie;
  const [fmn,fmx] = fanRanges[tier]||fanRanges.indie;
  const a = () => Math.round(amn+Math.random()*(amx-amn));
  const genrePool = GENRE_BY_TIER[tier]||GENRES;
  const genre = genrePool[Math.floor(Math.random()*genrePool.length)];
  return {
    name: rndArtistName(tier), isNPC:true, genre, tier,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)],
    nationality: ['NG','US','UK','GH','CA','AU','BR','MX','FR','KR'][Math.floor(Math.random()*10)],
    attributes: { songwriting:a(), vocals:a(), production:a(), charisma:a(), workEthic:a() },
    career: { fanbase:Math.round(fmn+Math.random()*(fmx-fmn)), buzz:Math.round(5+Math.random()*50), reputation:Math.round(5+Math.random()*40), totalStreams:0, weeklyStreams:0 },
    behaviorWeights: { writeSong:Math.round(1+Math.random()*4), recordSong:Math.round(1+Math.random()*3), releaseSingle:Math.round(1+Math.random()*2), promote:Math.round(1+Math.random()*4), socialMedia:Math.round(2+Math.random()*5) },
    draftSongs:Math.floor(Math.random()*3), recordedSongs:Math.floor(Math.random()*2)
  };
}

export async function seedNPCs(count = 300) {
  usedNames.clear();
  const dist = [
    { tier:'superstar',  n:Math.floor(count*0.05) },
    { tier:'mainstream', n:Math.floor(count*0.10) },
    { tier:'midtier',    n:Math.floor(count*0.15) },
    { tier:'rising',     n:Math.floor(count*0.25) },
    { tier:'indie',      n:Math.floor(count*0.45) }
  ];
  const artists = [];
  for (const { tier, n } of dist) for (let i=0;i<n;i++) artists.push(mkNPC(tier));
  await Artist.insertMany(artists);

  const saved = await Artist.find({ isNPC:true }).limit(count);
  const tierBase = { superstar:500_000_000, mainstream:50_000_000, midtier:5_000_000, rising:500_000, indie:50_000 };
  const songs = [];
  for (const a of saved) {
    const sc = { superstar:5, mainstream:4, midtier:3, rising:2, indie:1 }[a.tier]||1;
    for (let i=0;i<sc;i++) {
      const quality = npcQuality(a.tier);
      const rWeek   = Math.max(1,Math.floor(Math.random()*10));
      songs.push({ title:rndSongTitle(), artistId:a._id, artistModel:'Artist', artistName:a.name, isNPC:true, genre:a.genre, quality, status:'released', releasedAt:new Date(), releasedWeek:rWeek, releasedYear:1, streaming:{ totalStreams:Math.floor(Math.random()*(tierBase[a.tier]||10000)), weeklyStreams:0, peakStreams:0, weeksOnChart:rWeek } });
    }
  }
  await Song.insertMany(songs);
  return saved.length;
}

export async function runNPCActions(curWeek, curYear) {
  const npcs = await Artist.find({ isNPC:true }).sort({'career.fanbase':-1}).limit(150);
  const newSongs = [];
  for (const npc of npcs) {
    const weights=Object.entries(npc.behaviorWeights); const total=weights.reduce((s,[,w])=>s+w,0);
    let rand=Math.random()*total; let action='socialMedia';
    for (const [a,w] of weights) { rand-=w; if(rand<=0){action=a;break;} }
    if (action==='writeSong') npc.draftSongs++;
    else if (action==='recordSong'&&npc.draftSongs>0) { npc.draftSongs--; npc.recordedSongs++; }
    else if (action==='releaseSingle'&&npc.recordedSongs>0) { npc.recordedSongs--; newSongs.push({ title:rndSongTitle(), artistId:npc._id, artistModel:'Artist', artistName:npc.name, isNPC:true, genre:npc.genre, quality:npcQuality(npc.tier), status:'released', releasedAt:new Date(), releasedWeek:curWeek, releasedYear:curYear }); }
    else if (action==='promote') npc.career.buzz=Math.min(100,npc.career.buzz+Math.random()*5);
    else if (action==='socialMedia') { npc.career.buzz=Math.min(100,npc.career.buzz+Math.random()*3); npc.career.fanbase+=Math.floor(npc.career.fanbase*0.005); }
    npc.career.buzz=Math.max(0,npc.career.buzz-0.5);
    if (['superstar','mainstream'].includes(npc.tier)) npc.career.fanbase+=Math.floor(npc.career.fanbase*0.001);
    npc.lastActiveWeek=curWeek; await npc.save();
  }
  if (newSongs.length) await Song.insertMany(newSongs);
  return newSongs.length;
}

// ── CHART COMPILATION ─────────────────────────────────────────────────────────

export async function compileChart(curWeek, curYear) {
  const topSongs = await Song.find({ status:'released' }).sort({'streaming.weeklyStreams':-1}).limit(120).lean();
  const lastWeek=curWeek>1?curWeek-1:52; const lastYear=curWeek>1?curYear:curYear-1;
  const prev=await Chart.findOne({week:lastWeek,year:lastYear,type:'global'}).lean();
  const prevPos={};
  if (prev) for (const e of prev.entries) prevPos[e.songId.toString()]=e.position;
  const entries=topSongs.filter(s=>s.streaming.weeklyStreams>0).slice(0,100).map((s,i)=>{
    const pos=i+1; const last=prevPos[s._id.toString()]||null;
    return { position:pos, lastPosition:last, positionChange:last?last-pos:0, songId:s._id, songTitle:s.title, artistId:s.artistId, artistName:s.artistName, isNPC:s.isNPC, weeklyStreams:s.streaming.weeklyStreams, totalStreams:s.streaming.totalStreams, weeksOnChart:s.streaming.weeksOnChart||0, isNew:!last, isHot:last&&(last-pos)>=10 };
  });
  return Chart.findOneAndUpdate({week:curWeek,year:curYear,type:'global'},{entries,snapshot:new Date()},{upsert:true,new:true});
}

// ── EVENT SYSTEM ──────────────────────────────────────────────────────────────

const EVENTS = {
  viral_trend: [
    { title:'🔥 Song Going Viral!', description:'A snippet hit the FYP and now it\'s everywhere. Streams are exploding.', severity:'very_positive', effects:{buzz:22,fanbase:800}, viralMult:3.5 },
    { title:'📱 TikTok Dance Trend!', description:'A viral dance challenge spawned from your track. Millions are using your sound.', severity:'very_positive', effects:{buzz:28,fanbase:1500}, viralMult:4.0 }
  ],
  award_nomination: [
    { title:'🏆 Award Nomination!', description:'You\'ve been nominated for Best New Artist at the Headies!', severity:'very_positive', effects:{reputation:15,buzz:12,fanbase:400} }
  ],
  great_review: [
    { title:'⭐ Critical Acclaim', description:'A major music blog gave your project 9/10 — "an undeniable statement."', severity:'positive', effects:{reputation:10,buzz:8,fanbase:200} },
    { title:'🗞️ Apple Music Feature', description:'Apple Music added your track to their New in Afrobeats playlist.', severity:'positive', effects:{reputation:8,buzz:12,fanbase:350} }
  ],
  label_interest: [
    { title:'🎤 Label Reaching Out', description:'A major A&R rep DM\'d you. They want a Zoom call this week.', severity:'positive', effects:{reputation:8,buzz:6}, requiresChoice:true,
      choices:[
        { id:'sign',    text:'Sign the deal',     consequence:'More resources, less creative control. Money hits different.', effects:{money:50000,reputation:20,fanbase:5000} },
        { id:'decline', text:'Stay independent',  consequence:'The indie community respects the move. You keep 100%.', effects:{reputation:8,buzz:5,fanbase:500} }
      ]
    }
  ],
  sync_placement: [
    { title:'🎬 Netflix Placement!', description:'Your song was chosen for a major Netflix series. Massive global exposure.', severity:'very_positive', effects:{money:25000,buzz:18,fanbase:800}, viralMult:2.0 },
    { title:'🎮 FIFA Soundtrack', description:'EA Sports licensed your track for the FIFA game. Every gamer will hear this.', severity:'very_positive', effects:{money:18000,buzz:20,fanbase:1200}, viralMult:1.8 }
  ],
  festival_invite: [
    { title:'🎪 Afronation Slot!', description:'You\'ve been booked for Afronation. Career-defining moment.', severity:'very_positive', effects:{fanbase:3000,buzz:25,reputation:18,money:12000} },
    { title:'🎵 Coachella Invite', description:'You\'re on the Coachella lineup. The internet is losing it.', severity:'very_positive', effects:{fanbase:5000,buzz:30,reputation:22,money:20000} }
  ],
  song_leak: [
    { title:'💀 Song Leaked', description:'An unreleased track leaked on Twitter. The reaction is mixed but people are talking.', severity:'negative', effects:{reputation:-5,buzz:15}, requiresChoice:true,
      choices:[
        { id:'release', text:'Drop it officially now', consequence:'You ride the wave. Streams spike.', effects:{buzz:12,fanbase:300} },
        { id:'ignore',  text:'Ignore it',              consequence:'Drama dies. Momentum takes a hit.', effects:{buzz:-5,reputation:5} },
        { id:'address', text:'Address it publicly',    consequence:'Fans appreciate your honesty.', effects:{fanbase:250,reputation:-2} }
      ]
    }
  ],
  controversy: [
    { title:'🔥 Twitter Controversy', description:'An old post resurfaced. You\'re trending on X for the wrong reasons.', severity:'very_negative', effects:{reputation:-18,buzz:12,fanbase:-400}, requiresChoice:true,
      choices:[
        { id:'apologize',  text:'Sincere public apology', consequence:'Most fans forgive you. Rep bounces back slowly.', effects:{reputation:10,fanbase:200} },
        { id:'doubledown', text:'Double down on it',      consequence:'Lose casuals, gain die-hards. Chaotic but bold.', effects:{reputation:-8,fanbase:-200,buzz:18} },
        { id:'silent',     text:'Stay silent',            consequence:'Storm passes but the stain lingers.', effects:{reputation:-4,buzz:-8} }
      ]
    }
  ],
  bad_review: [
    { title:'💢 Harsh Review', description:'"Derivative and forgettable" — a major blog tore your release apart.', severity:'negative', effects:{reputation:-8,buzz:4,fanbase:-80} }
  ],
  beef_started: [
    { title:'🥊 Beef Alert', description:'A rival artist sent a subtweet in their new track. The TL is calling for a response.', severity:'negative', effects:{buzz:20,reputation:-5}, requiresChoice:true,
      choices:[
        { id:'respond', text:'Drop a diss track',   consequence:'The beef explodes. Massive buzz but rep takes a hit.', effects:{buzz:30,fanbase:1000,reputation:-8} },
        { id:'ignore',  text:'Take the high road',  consequence:'The community respects your maturity.', effects:{reputation:8,fanbase:200} },
        { id:'squash',  text:'Link up and squash it',consequence:'Quiet peace. Real ones respect it.', effects:{reputation:12,buzz:5} }
      ]
    }
  ],
  collab_offer: [
    { title:'🤝 Collab Request', description:'A rising artist wants you on their next single. The vibe could be crazy.', severity:'positive', effects:{fanbase:400,buzz:8,reputation:5} }
  ]
};

function eligibleEvents(user) {
  const e = ['great_review','bad_review','controversy'];
  const hasSongs = user.gameState?.actionsLog?.some(a=>a.action==='releaseSingle');
  if (hasSongs) e.push('viral_trend','sync_placement');
  if (user.career.fanbase>800)  e.push('label_interest','beef_started','song_leak','collab_offer');
  if (user.career.fanbase>8000) e.push('award_nomination','festival_invite');
  return e;
}

export async function rollEvent(user, curWeek, curYear) {
  const chance = 0.28+(user.career.buzz/100)*0.35;
  if (Math.random()>chance) return null;
  const types=eligibleEvents(user); const type=types[Math.floor(Math.random()*types.length)];
  const tmpls=EVENTS[type]; if(!tmpls) return null;
  const tmpl=tmpls[Math.floor(Math.random()*tmpls.length)];
  let songId=null;
  if (['viral_trend','sync_placement'].includes(type)) { const s=await Song.findOne({artistId:user._id,status:'released'}).sort({releasedAt:-1}); songId=s?._id||null; }
  const ev=new Event({ targetArtistId:user._id, isPlayerEvent:true, week:curWeek, year:curYear, type, title:tmpl.title, description:tmpl.description, severity:tmpl.severity, effects:{...(tmpl.effects||{}),songId,viralMultiplier:tmpl.viralMult||1}, requiresChoice:tmpl.requiresChoice||false, choices:tmpl.choices||[] });
  await ev.save(); return ev;
}

export async function applyEvent(ev, user) {
  const { effects }=ev;
  if (effects.fanbase)    user.career.fanbase    =Math.max(0,user.career.fanbase+effects.fanbase);
  if (effects.buzz)       user.career.buzz       =Math.min(100,Math.max(0,user.career.buzz+effects.buzz));
  if (effects.reputation) user.career.reputation =Math.min(100,Math.max(0,user.career.reputation+effects.reputation));
  if (effects.money)      user.career.money      =Math.max(0,user.career.money+effects.money);
  if (effects.songId&&effects.viralMultiplier>1) await Song.findByIdAndUpdate(effects.songId,{$set:{'marketing.isPromoted':true,'marketing.viralMultiplier':effects.viralMultiplier,isViral:true}});
  ev.isApplied=true; await ev.save();
}
