import { connectDB } from '../../lib/db.js';
import { performAction } from '../../lib/gameEngine.js';
import { cors, handleOptions } from '../../lib/cors.js';
import { requireAuth } from '../../lib/authHelper.js';

export default async function handler(req, res) {
  cors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();
  await connectDB();

  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const { action, params } = req.body;
    const valid = ['writeSong','recordSong','releaseSingle','promote','socialMedia','collaborate','concert','tour','practice'];
    if (!valid.includes(action)) return res.status(400).json({ error: 'Invalid action' });

    const result = await performAction(auth.userId, action, params || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
