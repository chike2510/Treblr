import { connectDB } from '../../lib/db.js';
import Song from '../../lib/models/Song.js';
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
    const { status } = req.query;
    const q = { artistId: auth.userId };
    if (status) q.status = status;
    const songs = await Song.find(q).sort({ createdAt: -1 });
    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
