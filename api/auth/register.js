import { connectDB } from '../../lib/db.js';
import User from '../../lib/models/User.js';
import { cors, handleOptions } from '../../lib/cors.js';
import { requireAuth } from '../../lib/authHelper.js';

export default async function handler(req, res) {
  cors(res);
  if (handleOptions(req, res)) return;
  await connectDB();

  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    const user = await User.findById(auth.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
