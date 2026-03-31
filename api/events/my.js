import { connectDB } from '../../lib/db.js';
import { Event } from '../../lib/models/models.js';
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
    const events = await Event.find({ targetArtistId: auth.userId }).sort({ createdAt: -1 }).limit(30);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
