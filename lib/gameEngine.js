import User from './models/User.js';
import Song from './models/Song.js';
import { Artist, Event } from './models/models.js';
import { calcSongQuality, rndSongTitle, runWeeklyUpdate, runNPCActions, compileChart, rollEvent, applyEvent } from './services.js';

// ── ACTION HANDLERS ───────────────────────────────────────────────────────────

async function writeSong(user) {
  const quality = calcSongQuality(user.attributes, false);
  const title = rndSongTitle() + ' (Draft)';
  const song = new Song({ title, artistId:user._id, artistModel:'User', artistName:user.artistName, isNPC:false, genre:user.genre, quality, status:'draft' });
  await song.save();
  user.gameState.pendingSongs.push(song._id);
  const gain = Math.round(0.5 + Math.random()*2);
  user.attributes.songwriting = Math.min(100, user.attributes.songwriting + gain);
  return { success:true, message:`You wrote "${title}". ${getQualityHint(quality.overallScore)}.`, song:{ id:song._id, title, score:quality.overallScore }, skillGain:{ songwriting:gain } };
}

async function recordSong(user, songId) {
  if (!user.gameState.pendingSongs.length) return { success:false, message:'No drafts to record. Write a song first!' };
  const id = songId || user.gameState.pendingSongs[0];
  const song = await Song.findById(id);
  if (!song || song.status!=='draft') return { success:false, message:'Song not found or already recorded.' };

  const prodBonus = Math.round((user.attributes.production/100)*25 + Math.random()*10);
  song.quality.production = Math.min(100, song.quality.production + prodBonus);
  song.quality.overallScore = song.calcScore();
  song.status = 'recorded';
  await song.save();

  user.gameState.pendingSongs = user.gameState.pendingSongs.filter(i=>i.toString()!==id.toString());
  user.gameState.recordedSongs.push(song._id);
  const cost = recordCost(user.career.level);
  user.career.money = Math.max(0, user.career.money - cost);
  const gain = Math.round(0.5 + Math.random()*2);
  user.attributes.production = Math.min(100, user.attributes.production + gain);
  return { success:true, message:`"${song.title}" is recorded. Quality: ${song.quality.overallScore}/100.`, song:{ id:song._id, title:song.title, score:song.quality.overallScore }, cost, skillGain:{production:gain} };
}

async function releaseSingle(user, songId) {
  if (!user.gameState.recordedSongs.length) return { success:false, message:'No recorded songs. Hit the studio first!' };
  const id = songId || user.gameState.recordedSongs[0];
  const song = await Song.findById(id);
  if (!song || song.status!=='recorded') return { success:false, message:'Song not available for release.' };

  song.status = 'released';
  song.releasedAt = new Date();
  song.releasedWeek = user.gameState.currentWeek;
  song.releasedYear = user.gameState.currentYear;
  await song.save();

  user.gameState.recordedSongs = user.gameState.recordedSongs.filter(i=>i.toString()!==id.toString());
  const buzzGain = Math.round(5 + (song.quality.catchiness/100)*15);
  user.career.buzz = Math.min(100, user.career.buzz + buzzGain);
  return { success:true, message:`"${song.title}" is live on all platforms! 🚀`, buzzGain, song:{ id:song._id, title:song.title } };
}

async function promote(user) {
  const cost = promoCost(user.career.level);
  if (user.career.money < cost) return { success:false, message:`Need $${cost} to promote. You have $${~~user.career.money}.` };
  user.career.money -= cost;

  const buzzGain = Math.round(8 + (user.attributes.charisma/100)*12 + Math.random()*10);
  user.career.buzz = Math.min(100, user.career.buzz + buzzGain);
  const fanGain = Math.round(user.career.fanbase * 0.02 * Math.random());
  user.career.fanbase += fanGain;

  const latest = await Song.findOne({ artistId:user._id, status:'released' }).sort({ releasedAt:-1 });
  if (latest) {
    latest.marketing.isPromoted = true;
    latest.marketing.promotionWeeks = Math.max(latest.marketing.promotionWeeks, 2);
    await latest.save();
  }
  return { success:true, message:latest?`Promo campaign live for "${latest.title}". The buzz is building.`:'Promo campaign running.', buzzGain, fanGain, cost };
}

async function socialMedia(user) {
  const cFactor = user.attributes.charisma / 100;
  const buzzGain = Math.round(3 + cFactor*8 + Math.random()*8);
  const followers = Math.round(50 + cFactor*200 + Math.random()*300);
  user.career.buzz = Math.min(100, user.career.buzz + buzzGain);
  user.social.instagram += followers;
  user.social.tiktok    += Math.round(followers*0.8);
  user.social.twitter   += Math.round(followers*0.5);
  const fanGain = Math.round(followers * 0.1);
  user.career.fanbase += fanGain;
  const msgs = ['You dropped a studio snippet. The comments are going crazy.','Behind-the-scenes content hit. Fans are loving the access.','A fan montage of your music blew up — you reposted it.','You went live. Thousands tuned in.'];
  return { success:true, message:msgs[~~(Math.random()*msgs.length)], buzzGain, followerGain:followers, fanGain };
}

async function collaborate(user) {
  const npc = await Artist.findOne({ isNPC:true, genre:user.genre, 'career.fanbase':{ $gte:user.career.fanbase*0.3, $lte:user.career.fanbase*8 } });
  if (!npc) return { success:false, message:'No compatible artists available. Try again next week.' };
  if (!user.gameState.pendingSongs.length) return { success:false, message:`${npc.name} is down to collab but you need a draft song first!` };

  const song = await Song.findById(user.gameState.pendingSongs[0]);
  const boost = Math.round(5 + (npc.attributes.songwriting/100)*15);
  song.quality.catchiness = Math.min(100, song.quality.catchiness + boost);
  song.quality.overallScore = song.calcScore();
  song.features.push({ artistId:npc._id, artistName:npc.name });
  await song.save();

  const fanGain = Math.round(npc.career.fanbase * 0.04);
  const buzzGain = Math.round(5 + Math.random()*10);
  const repGain = Math.round(3 + Math.random()*7);
  user.career.fanbase += fanGain;
  user.career.buzz = Math.min(100, user.career.buzz + buzzGain);
  user.career.reputation = Math.min(100, user.career.reputation + repGain);
  user.gameState.collaborations.push({ artistId:npc._id, week:user.gameState.currentWeek });
  return { success:true, message:`${npc.name} jumped on "${song.title}". The chemistry is 🔥`, collaborator:{name:npc.name,genre:npc.genre}, fanGain, buzzGain, repGain };
}

async function concert(user) {
  const cost = concertCost(user.career.level);
  if (user.career.money < cost) return { success:false, message:`Concert requires $${cost}. Save up first.` };
  user.career.money -= cost;

  const cFactor = user.attributes.charisma/100;
  const capacity   = concertCap(user.career.level);
  const attendance = Math.round(capacity*(0.4+cFactor*0.5)*(0.8+Math.random()*0.4));
  const revenue    = attendance * ticketPrice(user.career.level);
  user.career.money += revenue;

  const fanGain  = Math.round(attendance*0.15);
  const buzzGain = Math.round(5+cFactor*10);
  const repGain  = Math.round(2+cFactor*5);
  user.career.fanbase   += fanGain;
  user.career.buzz       = Math.min(100, user.career.buzz+buzzGain);
  user.career.reputation = Math.min(100, user.career.reputation+repGain);
  return { success:true, message:`You performed for ${attendance.toLocaleString()} people. The crowd was electric! 🎤`, attendance, revenue, cost, netRevenue:revenue-cost, fanGain, buzzGain, repGain };
}

async function tour(user) {
  const cost = tourCost(user.career.level);
  if (user.career.money < cost) return { success:false, message:`Tour needs $${cost}. Not enough funds.` };
  if (user.career.fanbase < 1000) return { success:false, message:'Need 1,000+ fans to fill venues on a tour.' };

  user.career.money -= cost;
  const cfg = tourCfg(user.career.level);
  const cFactor = user.attributes.charisma/100;
  const totalRevenue = Math.round(cost * (0.8 + cFactor*1.4) * (0.8+Math.random()*0.5));
  const fanGain = Math.round(user.career.fanbase * (0.05 + cFactor*0.1));

  user.career.money += totalRevenue;
  user.career.fanbase += fanGain;
  user.career.buzz = Math.min(100, user.career.buzz + cfg.buzz);
  user.career.reputation = Math.min(100, user.career.reputation + cfg.rep);
  return { success:true, message:`The ${cfg.cities}-city tour was massive! ${fanGain.toLocaleString()} new fans.`, cities:cfg.cities, totalRevenue, netRevenue:totalRevenue-cost, fanGain, buzzGain:cfg.buzz, repGain:cfg.rep };
}

async function practice(user) {
  const skills = ['songwriting','vocals','production','charisma','workEthic'];
  const skill  = skills[~~(Math.random()*skills.length)];
  const gain   = Math.round(1 + (user.attributes.workEthic/100)*3 + Math.random()*3);
  user.attributes[skill] = Math.min(100, user.attributes[skill] + gain);
  if (skill!=='workEthic') user.attributes.workEthic = Math.min(100, user.attributes.workEthic + 0.5);
  const msgs = { songwriting:'Chord structures and lyrics — the craft is sharpening.', vocals:'Hours of exercises paid off. Your range improved.', production:'Deep dive on production. The mixes are cleaner.', charisma:'Stage presence work. People are drawn to you.', workEthic:'You pushed through. Your discipline is elite.' };
  return { success:true, message:msgs[skill], skillGain:{ [skill]:gain } };
}

// ── ADVANCE WEEK ──────────────────────────────────────────────────────────────

export async function advanceWeek(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const { currentWeek, currentYear } = user.gameState;

  await runWeeklyUpdate(currentWeek, currentYear);
  await runNPCActions(currentWeek, currentYear);
  const chart = await compileChart(currentWeek, currentYear);

  const ev = await rollEvent(user, currentWeek, currentYear);
  if (ev && !ev.requiresChoice) await applyEvent(ev, user);

  user.career.buzz = Math.max(0, user.career.buzz - 2);

  if (currentWeek >= 52) { user.gameState.currentWeek = 1; user.gameState.currentYear = currentYear+1; }
  else user.gameState.currentWeek = currentWeek + 1;
  user.gameState.actionsThisWeek = 0;

  user.updateLevel();
  checkAchievements(user, chart);
  user.lastActive = new Date();
  await user.save();

  return {
    success:true,
    newWeek:user.gameState.currentWeek,
    newYear:user.gameState.currentYear,
    event: ev ? { id:ev._id, title:ev.title, description:ev.description, severity:ev.severity, requiresChoice:ev.requiresChoice, choices:ev.choices } : null
  };
}

// ── MAIN DISPATCHER ───────────────────────────────────────────────────────────

export async function performAction(userId, action, params={}) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.gameState.actionsThisWeek >= user.gameState.maxActionsPerWeek) {
    return { success:false, message:`All ${user.gameState.maxActionsPerWeek} actions used. Advance the week to continue.` };
  }

  const handlers = { writeSong, recordSong, releaseSingle, promote, socialMedia, collaborate, concert, tour, practice };
  const handler  = handlers[action];
  if (!handler) return { success:false, message:`Unknown action: ${action}` };

  const result = await handler(user, params.songId);

  if (result.success) {
    user.gameState.actionsThisWeek++;
    user.gameState.actionsLog.push({ week:user.gameState.currentWeek, year:user.gameState.currentYear, action, message:result.message });
    if (user.gameState.actionsLog.length > 200) user.gameState.actionsLog = user.gameState.actionsLog.slice(-200);
    user.updateLevel();
    await user.save();
  }

  return { ...result, actionsRemaining: user.gameState.maxActionsPerWeek - user.gameState.actionsThisWeek, career:user.career, attributes:user.attributes, social:user.social };
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getQualityHint(s) {
  if (s>=85) return 'Potential smash 🔥'; if (s>=70) return 'Strong track ⭐';
  if (s>=55) return 'Decent material';     if (s>=40) return 'Needs more work'; return 'Rough start';
}
function recordCost(lvl)  { return {Unsigned:200,Indie:500,Rising:1000,'Mid-Tier':2500,Mainstream:5000,Superstar:10000,Legend:20000}[lvl]||200; }
function promoCost(lvl)   { return {Unsigned:100,Indie:300,Rising:750,'Mid-Tier':1500,Mainstream:4000,Superstar:8000,Legend:15000}[lvl]||100; }
function concertCost(lvl) { return {Unsigned:100,Indie:300,Rising:800,'Mid-Tier':2000,Mainstream:5000,Superstar:20000,Legend:50000}[lvl]||100; }
function concertCap(lvl)  { return {Unsigned:50,Indie:200,Rising:1000,'Mid-Tier':5000,Mainstream:20000,Superstar:60000,Legend:100000}[lvl]||50; }
function ticketPrice(lvl) { return {Unsigned:10,Indie:15,Rising:25,'Mid-Tier':45,Mainstream:80,Superstar:150,Legend:250}[lvl]||10; }
function tourCost(lvl)    { return {Unsigned:500,Indie:2000,Rising:8000,'Mid-Tier':25000,Mainstream:75000,Superstar:200000,Legend:500000}[lvl]||500; }
function tourCfg(lvl)     { return {Unsigned:{cities:3,buzz:8,rep:3},Indie:{cities:5,buzz:12,rep:5},Rising:{cities:8,buzz:18,rep:8},'Mid-Tier':{cities:15,buzz:25,rep:12},Mainstream:{cities:20,buzz:30,rep:15},Superstar:{cities:30,buzz:40,rep:20},Legend:{cities:50,buzz:50,rep:25}}[lvl]||{cities:3,buzz:8,rep:3}; }

function checkAchievements(user, chart) {
  const has = (id) => user.achievements.find(a=>a.id===id);
  const add = (id, name, description) => { if (!has(id)) user.achievements.push({ id, name, description }); };
  const log = user.gameState.actionsLog||[];
  if (log.some(a=>a.action==='writeSong'))     add('first_draft',   'First Draft',      'Write your first song');
  if (log.some(a=>a.action==='releaseSingle')) add('first_release', 'First Release',    'Release your first single');
  if (user.career.fanbase>=1000)               add('indie_level',   'Going Indie',      'Reach 1,000 fans');
  if (user.career.fanbase>=10000)              add('rising',        'Rising Star',      'Reach 10,000 fans');
  if (user.career.fanbase>=200000)             add('mainstream',    'Going Mainstream', 'Reach 200,000 fans');
  if (user.career.fanbase>=1000000)            add('superstar',     'Superstar',        'Reach 1 million fans');
  if (chart?.entries?.some(e=>e.artistId?.toString()===user._id?.toString())) add('chart_entry','Chart Entry','Appear on the global chart');
}
