import { connectDB } from '../../lib/db.js';
import User from '../../lib/models/User.js';
import jwt from 'jsonwebtoken';
import { cors, handleOptions } from '../../lib/cors.js';

export default async function handler(req, res) {
  cors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();
  await connectDB();

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastActive = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'treblr_dev_secret', { expiresIn: '30d' });
    const o = user.toObject(); delete o.password;
    res.json({ token, user: o });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
