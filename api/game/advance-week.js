import { connectDB } from '../../lib/db.js';
import { advanceWeek } from '../../lib/gameEngine.js';
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
    const result = await advanceWeek(auth.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
