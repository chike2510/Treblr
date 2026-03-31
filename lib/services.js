import Song from './models/Song.js';
import User from './models/User.js';
import { Artist, Chart, Event } from './models/models.js';

// ── SONG TITLES & ARTIST NAMES ────────────────────────────────────────────────

const W1 = ['Neon','Crystal','Golden','Dark','Electric','Midnight','Rising','Broken','Wild','Faded','Lost','Fire','Ocean','Sky','Savage','Infinite','Silent','Cosmic'];
const W2 = ['Dreams','Lights','Heart','Soul','Night','Love','Vibes','Wave','Fever','Rush','Rain','Eyes','Blood','Gold','Moves','Phase'];
const FIRSTS = ['Kai','Zara','Nova','Sage','Lyric','Phoenix','Remy','Blaze','Skye','Jax','Luna','Rio','Echo','Demi','Ace','Vera','Cruz','Jade','Storm','Drake','Trey','Lorde','Billie','Halsey','Bazzi','Omar','Yemi','Tems','Rema','Burna','Ayra','Oxlade','Fireboy','Asake'];
const LASTS  = ['Wave','Stark','Voss','Knox','Lane','Reid','Cross','Banks','Cole','Pierce','Stone','Gray','Flynn','Holt','James','King','Knight','Lee','Park','Scott','West'];
const COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63','#ff5722','#00bcd4','#4caf50','#ff9800'];
const GENRES = ['Pop','Hip-Hop','R&B','Rock','Electronic','Afrobeats','Latin','Country','Indie','Alternative'];
const NATS   = ['US','UK','NG','GH','CA','AU','BR','MX','FR','KR'];

export function rndSongTitle() {
  const r = Math.random();
  if (r < 0.4) return `${W1[~~(Math.random()*W1.length)]} ${W2[~~(Math.random()*W2.length)]}`;
  if (r < 0.7) return W2[~~(Math.random()*W2.length)];
  return W1[~~(Math.random()*W1.length)];
}

function rndArtistName() {
  const r = Math.random();
  if (r < 0.35) return FIRSTS[~~(Math.random()*FIRSTS.length)];
  if (r < 0.7)  return `${FIRSTS[~~(Math.random()*FIRSTS.length)]} ${LASTS[~~(Math.random()*LASTS.length)]}`;
  return `${W1[~~(Math.random()*W1.length)]} ${LASTS[~~(Math.random()*LASTS.length)]}`;
}

// ── QUALITY CALCULATION ───────────────────────────────────────────────────────

export function calcSongQuality(attrs, isProduced = false) {
  const { songwriting, vocals, production, workEthic } = attrs;
  const effort = (workEthic / 100) * 20;
  const catchiness  = Math.min(100, Math.round(songwriting * 0.5 + vocals * 0.2 + effort + Math.random() * 25));
  const lyrics      = Math.min(100, Math.round(songwriting * 0.7 + effort + Math.random() * 20));
  const prod        = Math.min(100, Math.round((isProduced ? production : production * 0.6) + effort + Math.random() * 20));
  const replayValue = Math.min(100, Math.round(catchiness * 0.4 + lyrics * 0.3 + prod * 0.2 + Math.random() * 15));
  const overallScore = Math.round(catchiness * 0.3 + lyrics * 0.25 + prod * 0.25 + replayValue * 0.2);
  return { catchiness, lyrics, production: prod, replayValue, overallScore };
}

function npcQuality(tier) {
  const ranges = { indie:[20,55], rising:[35,65], midtier:[50,75], mainstream:[62,85], superstar:[74,98] };
  const [mn, mx] = ranges[tier] || [20,55];
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
  if (fanbase >= 10_000_000) return 5_000_000;
  if (fanbase >= 1_000_000)  return 500_000;
  if (fanbase >= 100_000)    return 50_000;
  if (fanbase >= 10_000)     return 5_000;
  if (fanbase >= 1_000)      return 500;
  return 50;
}

export function calcWeeklyStreams(song, artist, curWeek, curYear) {
  const weeksOut  = (curYear - (song.releasedYear||1)) * 52 + (curWeek - (song.releasedWeek||1));
  const ageMult   = Math.pow(decayRate(song.quality.overallScore), Math.max(0, weeksOut));
  const qualMult  = 0.1 + (song.quality.overallScore / 100) * 1.9;
  const fanbase   = artist?.career?.fanbase || 1000;
  const fanMult   = 0.5 + Math.log10(Math.max(fanbase, 10)) / 7;
  const buzz      = artist?.career?.buzz || 10;
  const buzzMult  = 0.5 + (buzz / 100) * 1.5;
  const promoMult = song.marketing?.isPromoted ? 1 + (song.marketing.promotionWeeks * 0.15) : 1;
  const viralMult = song.marketing?.viralMultiplier || 1;
  const catchBoost= 0.8 + (song.quality.catchiness / 100) * 0.4;
  const randFact  = viralMult > 1.5 ? 0.5 + Math.random() * 3 : 0.7 + Math.random() * 0.6;
  return Math.max(0, Math.floor(baseStreams(fanbase) * qualMult * fanMult * buzzMult * ageMult * promoMult * viralMult * catchBoost * randFact));
}

// ── WEEKLY UPDATE (called during advance-week) ────────────────────────────────

export async function runWeeklyUpdate(curWeek, curYear) {
  const songs = await Song.find({ status: 'released' });
  const results = [];

  for (const song of songs) {
    const artist = song.isNPC
      ? await Artist.findById(song.artistId)
      : await User.findById(song.artistId);
    if (!artist) continue;

    const weekly = calcWeeklyStreams(song, artist, curWeek, curYear);
    song.streaming.weeklyStreams = weekly;
    song.streaming.totalStreams += weekly;
    if (weekly > song.streaming.peakStreams) song.streaming.peakStreams = weekly;
    song.streaming.streamHistory.push({ week: curWeek, year: curYear, streams: weekly });
    if (song.streaming.streamHistory.length > 52) song.streaming.streamHistory.shift();

    const revenue = Math.floor(weekly * 0.004);
    song.revenue += revenue;
    song.updateCert();

    if (song.marketing.viralMultiplier > 1) song.marketing.viralMultiplier = Math.max(1, song.marketing.viralMultiplier * 0.85);
    if (song.marketing.isPromoted && song.marketing.promotionWeeks > 0) {
      song.marketing.promotionWeeks--;
      if (song.marketing.promotionWeeks === 0) song.marketing.isPromoted = false;
    }

    await song.save();
    results.push({ artistId: song.artistId, isNPC: song.isNPC, weekly, revenue });
  }

  // Roll up per-artist
  const map = {};
  for (const r of results) {
    const k = r.artistId.toString();
    if (!map[k]) map[k] = { weekly: 0, revenue: 0, isNPC: r.isNPC };
    map[k].weekly  += r.weekly;
    map[k].revenue += r.revenue;
  }
  for (const [id, data] of Object.entries(map)) {
    if (data.isNPC) {
      await Artist.findByIdAndUpdate(id, { $set:{'career.weeklyStreams':data.weekly}, $inc:{'career.totalStreams':data.weekly} });
    } else {
      await User.findByIdAndUpdate(id, { $set:{'career.weeklyStreams':data.weekly}, $inc:{'career.totalStreams':data.weekly,'career.money':data.revenue} });
    }
  }
  return results;
}

// ── NPC SYSTEM ────────────────────────────────────────────────────────────────

function mkNPC(tier) {
  const ranges = { indie:[20,45], rising:[35,60], midtier:[50,70], mainstream:[62,82], superstar:[75,97] };
  const fanRanges = { indie:[500,5000], rising:[5000,50000], midtier:[50000,500000], mainstream:[500000,5000000], superstar:[5000000,50000000] };
  const [mn,mx] = ranges[tier]||ranges.indie;
  const [fmn,fmx] = fanRanges[tier]||fanRanges.indie;
  const r = () => Math.round(mn + Math.random()*(mx-mn));
  return {
    name: rndArtistName(), isNPC: true,
    genre: GENRES[~~(Math.random()*GENRES.length)],
    tier, avatarColor: COLORS[~~(Math.random()*COLORS.length)],
    nationality: NATS[~~(Math.random()*NATS.length)],
    attributes: { songwriting:r(), vocals:r(), production:r(), charisma:r(), workEthic:r() },
    career: { fanbase: Math.round(fmn+Math.random()*(fmx-fmn)), buzz: Math.round(5+Math.random()*50), reputation: Math.round(5+Math.random()*40), totalStreams:0, weeklyStreams:0 },
    behaviorWeights: { writeSong:~~(1+Math.random()*4), recordSong:~~(1+Math.random()*3), releaseSingle:~~(1+Math.random()*2), promote:~~(1+Math.random()*4), socialMedia:~~(2+Math.random()*5) },
    draftSongs: ~~(Math.random()*3), recordedSongs: ~~(Math.random()*2)
  };
}

export async function seedNPCs(count = 300) {
  const dist = [
    { tier:'superstar',  n: Math.floor(count*0.02) },
    { tier:'mainstream', n: Math.floor(count*0.08) },
    { tier:'midtier',    n: Math.floor(count*0.15) },
    { tier:'rising',     n: Math.floor(count*0.25) },
    { tier:'indie',      n: Math.floor(count*0.50) }
  ];
  const artists = [];
  for (const { tier, n } of dist) for (let i=0;i<n;i++) artists.push(mkNPC(tier));
  await Artist.insertMany(artists);

  const saved = await Artist.find({ isNPC:true }).limit(count);
  const songs = [];
  const tierBase = { superstar:500_000_000, mainstream:50_000_000, midtier:5_000_000, rising:500_000, indie:50_000 };
  for (const a of saved) {
    const sc = { superstar:5, mainstream:4, midtier:3, rising:2, indie:1 }[a.tier]||1;
    for (let i=0;i<sc;i++) {
      const quality = npcQuality(a.tier);
      const rWeek = Math.max(1, ~~(Math.random()*10));
      songs.push({ title:rndSongTitle(), artistId:a._id, artistModel:'Artist', artistName:a.name, isNPC:true, genre:a.genre, quality, status:'released', releasedAt:new Date(), releasedWeek:rWeek, releasedYear:1, streaming:{ totalStreams:~~(Math.random()*(tierBase[a.tier]||10000)), weeklyStreams:0, peakStreams:0, weeksOnChart:rWeek } });
    }
  }
  await Song.insertMany(songs);
  return saved.length;
}

export async function runNPCActions(curWeek, curYear) {
  const npcs = await Artist.find({ isNPC:true }).sort({'career.fanbase':-1}).limit(150);
  const newSongs = [];
  for (const npc of npcs) {
    const weights = Object.entries(npc.behaviorWeights);
    const total = weights.reduce((s,[,w])=>s+w,0);
    let rand = Math.random()*total;
    let action = 'socialMedia';
    for (const [a,w] of weights) { rand-=w; if(rand<=0){action=a;break;} }

    if (action==='writeSong') npc.draftSongs++;
    else if (action==='recordSong' && npc.draftSongs>0) { npc.draftSongs--; npc.recordedSongs++; }
    else if (action==='releaseSingle' && npc.recordedSongs>0) {
      npc.recordedSongs--;
      newSongs.push({ title:rndSongTitle(), artistId:npc._id, artistModel:'Artist', artistName:npc.name, isNPC:true, genre:npc.genre, quality:npcQuality(npc.tier), status:'released', releasedAt:new Date(), releasedWeek:curWeek, releasedYear:curYear });
    } else if (action==='promote') npc.career.buzz = Math.min(100, npc.career.buzz+Math.random()*5);
    else if (action==='socialMedia') { npc.career.buzz=Math.min(100,npc.career.buzz+Math.random()*3); npc.career.fanbase+=~~(npc.career.fanbase*0.005); }

    npc.career.buzz = Math.max(0, npc.career.buzz-0.5);
    if (['superstar','mainstream'].includes(npc.tier)) npc.career.fanbase+=~~(npc.career.fanbase*0.001);
    npc.lastActiveWeek = curWeek;
    await npc.save();
  }
  if (newSongs.length) await Song.insertMany(newSongs);
  return newSongs.length;
}

// ── CHART COMPILATION ─────────────────────────────────────────────────────────

export async function compileChart(curWeek, curYear) {
  const topSongs = await Song.find({ status:'released' }).sort({'streaming.weeklyStreams':-1}).limit(120).lean();

  const lastWeek = curWeek>1 ? curWeek-1 : 52;
  const lastYear = curWeek>1 ? curYear : curYear-1;
  const prev = await Chart.findOne({ week:lastWeek, year:lastYear, type:'global' }).lean();
  const prevPos = {};
  if (prev) for (const e of prev.entries) prevPos[e.songId.toString()] = e.position;

  const entries = topSongs.filter(s=>s.streaming.weeklyStreams>0).slice(0,100).map((s,i)=>{
    const pos = i+1;
    const last = prevPos[s._id.toString()]||null;
    return { position:pos, lastPosition:last, positionChange:last?last-pos:0, songId:s._id, songTitle:s.title, artistId:s.artistId, artistName:s.artistName, isNPC:s.isNPC, weeklyStreams:s.streaming.weeklyStreams, totalStreams:s.streaming.totalStreams, weeksOnChart:s.streaming.weeksOnChart||0, isNew:!last, isHot:last&&(last-pos)>=10 };
  });

  const chart = await Chart.findOneAndUpdate(
    { week:curWeek, year:curYear, type:'global' },
    { entries, snapshot:new Date() },
    { upsert:true, new:true }
  );

  for (const e of entries) {
    await Song.findByIdAndUpdate(e.songId, [{ $set:{ 'streaming.peakPosition':{ $cond:[{ $or:[{ $eq:['$streaming.peakPosition',null] },{ $gt:['$streaming.peakPosition',e.position] }] }, e.position, '$streaming.peakPosition'] } } }]);
  }
  return chart;
}

// ── EVENT SYSTEM ──────────────────────────────────────────────────────────────

const EVENTS = {
  viral_trend: [
    { title:'🔥 Song Going Viral!', description:'A snippet hit the FYP and now it\'s everywhere. Streams are exploding.', severity:'very_positive', effects:{buzz:22,fanbase:800}, viralMult:3.5 },
    { title:'📱 TikTok Dance Trend!', description:'A viral dance challenge spawned from your track. Millions are using your sound.', severity:'very_positive', effects:{buzz:28,fanbase:1500}, viralMult:4.0 }
  ],
  award_nomination: [
    { title:'🏆 Award Nomination!', description:'You\'ve been nominated for Best New Artist at the Treblr Music Awards!', severity:'very_positive', effects:{reputation:15,buzz:12,fanbase:400} },
  ],
  great_review: [
    { title:'⭐ Critical Acclaim', description:'A major music blog gave your album 9/10 — "an undeniable statement."', severity:'positive', effects:{reputation:10,buzz:8,fanbase:200} },
  ],
  label_interest: [
    { title:'🎤 Label Reaching Out', description:'A major A&R rep slid into your DMs. They want a meeting.', severity:'positive', effects:{reputation:8,buzz:6},
      requiresChoice:true, choices:[
        { id:'sign', text:'Sign with the label', consequence:'More resources, less creative control.', effects:{money:50000,reputation:20,fanbase:5000} },
        { id:'decline', text:'Stay independent', consequence:'The indie community respects the move.', effects:{reputation:8,buzz:5,fanbase:500} }
      ]
    }
  ],
  sync_placement: [
    { title:'🎬 Netflix Placement!', description:'Your song was chosen for a major Netflix series. Huge exposure.', severity:'very_positive', effects:{money:25000,buzz:18,fanbase:800}, viralMult:2.0 },
  ],
  song_leak: [
    { title:'💀 Song Leaked', description:'An unreleased track leaked online. The internet has mixed feelings.', severity:'negative', effects:{reputation:-5,buzz:15},
      requiresChoice:true, choices:[
        { id:'release', text:'Release it officially now', consequence:'You ride the wave. Smart.', effects:{buzz:12,fanbase:300} },
        { id:'ignore',  text:'Stay quiet', consequence:'Drama fades. Some momentum lost.', effects:{buzz:-5,reputation:5} },
        { id:'address', text:'Address it publicly', consequence:'Fans respect your honesty.', effects:{fanbase:250,reputation:-2} }
      ]
    }
  ],
  controversy: [
    { title:'🔥 Twitter Controversy', description:'An old post resurfaced. You\'re trending for the wrong reasons.', severity:'very_negative', effects:{reputation:-18,buzz:12,fanbase:-400},
      requiresChoice:true, choices:[
        { id:'apologize',   text:'Issue a sincere apology', consequence:'Most fans forgive you.', effects:{reputation:10,fanbase:200} },
        { id:'doubledown',  text:'Double down', consequence:'Lose casual fans, gain hardcore supporters.', effects:{reputation:-8,fanbase:-200,buzz:18} },
        { id:'silent',      text:'Go silent', consequence:'Storm passes but the stain lingers.', effects:{reputation:-4,buzz:-8} }
      ]
    }
  ],
  bad_review: [
    { title:'💢 Harsh Review', description:'"Derivative and forgettable" — a major blog tore your release apart.', severity:'negative', effects:{reputation:-8,buzz:4,fanbase:-80} }
  ],
  beef_started: [
    { title:'🥊 Beef Alert', description:'A rival artist subtweeted you in their new track.', severity:'negative', effects:{buzz:20,reputation:-5},
      requiresChoice:true, choices:[
        { id:'respond', text:'Drop a diss track', consequence:'Beef explodes. Massive buzz, reputation hit.', effects:{buzz:30,fanbase:1000,reputation:-8} },
        { id:'ignore',  text:'Take the high road', consequence:'Respect from the community.', effects:{reputation:8,fanbase:200} },
        { id:'squash',  text:'Reach out privately', consequence:'Quiet resolution. More respect.', effects:{reputation:12,buzz:5} }
      ]
    }
  ],
  festival_invite: [
    { title:'🎪 Festival Slot!', description:'You\'ve been invited to perform at a major festival. Career-defining.', severity:'very_positive', effects:{fanbase:2000,buzz:22,reputation:15,money:8000} }
  ]
};

function eligibleEvents(user) {
  const e = ['great_review','bad_review','controversy'];
  const hasSongs = user.gameState?.actionsLog?.some(a=>a.action==='releaseSingle');
  if (hasSongs) e.push('viral_trend','sync_placement');
  if (user.career.fanbase>800) e.push('label_interest','beef_started','song_leak');
  if (user.career.fanbase>8000) e.push('award_nomination','festival_invite');
  return e;
}

export async function rollEvent(user, curWeek, curYear) {
  const chance = 0.28 + (user.career.buzz/100)*0.35;
  if (Math.random()>chance) return null;

  const types = eligibleEvents(user);
  const type  = types[~~(Math.random()*types.length)];
  const tmpls = EVENTS[type];
  if (!tmpls) return null;
  const tmpl = tmpls[~~(Math.random()*tmpls.length)];

  let songId = null;
  if (['viral_trend','sync_placement'].includes(type)) {
    const s = await Song.findOne({ artistId:user._id, status:'released' }).sort({ releasedAt:-1 });
    songId = s?._id||null;
  }

  const ev = new Event({
    targetArtistId:user._id, isPlayerEvent:true, week:curWeek, year:curYear, type,
    title:tmpl.title, description:tmpl.description, severity:tmpl.severity,
    effects:{ ...(tmpl.effects||{}), songId, viralMultiplier:tmpl.viralMult||1 },
    requiresChoice:tmpl.requiresChoice||false, choices:tmpl.choices||[]
  });
  await ev.save();
  return ev;
}

export async function applyEvent(ev, user) {
  const { effects } = ev;
  if (effects.fanbase)    user.career.fanbase    = Math.max(0, user.career.fanbase + effects.fanbase);
  if (effects.buzz)       user.career.buzz       = Math.min(100, Math.max(0, user.career.buzz + effects.buzz));
  if (effects.reputation) user.career.reputation = Math.min(100, Math.max(0, user.career.reputation + effects.reputation));
  if (effects.money)      user.career.money      = Math.max(0, user.career.money + effects.money);

  if (effects.songId && effects.viralMultiplier > 1) {
    await Song.findByIdAndUpdate(effects.songId, { $set:{ 'marketing.isPromoted':true, 'marketing.viralMultiplier':effects.viralMultiplier, isViral:true } });
  }

  ev.isApplied = true;
  await ev.save();
}
