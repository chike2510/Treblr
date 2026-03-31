import { connectDB } from '../../lib/db.js';
import User from '../../lib/models/User.js';
import { Event } from '../../lib/models/models.js';
import { applyEvent } from '../../lib/services.js';
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
    const { eventId, choiceId } = req.body;
    const ev = await Event.findById(eventId);
    if (!ev || ev.choiceMade) return res.status(404).json({ error: 'Event not found or already resolved' });

    const choice = ev.choices.find(c => c.id === choiceId);
    if (!choice) return res.status(400).json({ error: 'Invalid choice' });

    ev.choiceMade = choiceId;
    ev.effects = { ...ev.effects, ...choice.effects };

    const user = await User.findById(auth.userId);
    await applyEvent(ev, user);
    await user.save();

    res.json({ success: true, message: choice.consequence, effects: choice.effects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
