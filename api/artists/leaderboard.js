import { connectDB } from '../../lib/db.js';
import { Artist } from '../../lib/models/models.js';
import User from '../../lib/models/User.js';
import { cors, handleOptions } from '../../lib/cors.js';
import { requireAuth } from '../../lib/authHelper.js';

export default async function handler(req, res) {
  cors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();
  await connectDB();

  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const [npcs, players] = await Promise.all([
      Artist.find({ isNPC: true }).sort({ 'career.fanbase': -1 }).limit(25).select('name genre tier avatarColor career'),
      User.find().sort({ 'career.fanbase': -1 }).limit(10).select('artistName genre avatarColor career')
    ]);

    const board = [
      ...players.map(p => ({ id: p._id, name: p.artistName, genre: p.genre, avatarColor: p.avatarColor, fanbase: p.career.fanbase, level: p.career.level, weeklyStreams: p.career.weeklyStreams, isPlayer: true })),
      ...npcs.map(n => ({ id: n._id, name: n.name, genre: n.genre, avatarColor: n.avatarColor, fanbase: n.career.fanbase, tier: n.tier, weeklyStreams: n.career.weeklyStreams, isPlayer: false }))
    ].sort((a, b) => b.fanbase - a.fanbase).slice(0, 30);

    res.json({ leaderboard: board });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
