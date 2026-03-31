import { connectDB } from '../../lib/db.js';
import User from '../../lib/models/User.js';
import { Chart } from '../../lib/models/models.js';
import { compileChart } from '../../lib/services.js';
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
    const user = await User.findById(auth.userId).select('gameState');
    const week = parseInt(req.query.week) || user.gameState.currentWeek;
    const year = parseInt(req.query.year) || user.gameState.currentYear;

    let chart = await Chart.findOne({ week, year, type: 'global' });
    if (!chart) chart = await compileChart(week, year);

    res.json({ chart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
