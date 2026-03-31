import { connectDB } from '../../lib/db.js';
import User from '../../lib/models/User.js';
import Song from '../../lib/models/Song.js';
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
    const user = await User.findById(auth.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [songs, draftSongs, recordedSongs, events] = await Promise.all([
      Song.find({ artistId: auth.userId, status: 'released' }).sort({ releasedAt: -1 }),
      Song.find({ _id: { $in: user.gameState.pendingSongs } }),
      Song.find({ _id: { $in: user.gameState.recordedSongs } }),
      Event.find({ targetArtistId: auth.userId }).sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        artistName: user.artistName,
        genre: user.genre,
        avatarColor: user.avatarColor,
        bio: user.bio,
        attributes: user.attributes,
        career: user.career,
        social: user.social,
        achievements: user.achievements,
        gameState: {
          currentWeek: user.gameState.currentWeek,
          currentYear: user.gameState.currentYear,
          actionsThisWeek: user.gameState.actionsThisWeek,
          maxActionsPerWeek: user.gameState.maxActionsPerWeek,
          pendingSongsCount: user.gameState.pendingSongs.length,
          recordedSongsCount: user.gameState.recordedSongs.length
        }
      },
      songs, draftSongs, recordedSongs, events
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
