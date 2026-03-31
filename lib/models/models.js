import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  isNPC:    { type: Boolean, default: true },
  genre:    { type: String, default: 'Pop' },
  tier:     { type: String, enum: ['indie','rising','midtier','mainstream','superstar'], default: 'indie' },
  avatarColor: { type: String, default: '#8b5cf6' },
  nationality: { type: String, default: 'US' },

  attributes: {
    songwriting: { type: Number, default: 50 },
    vocals:      { type: Number, default: 50 },
    production:  { type: Number, default: 50 },
    charisma:    { type: Number, default: 50 },
    workEthic:   { type: Number, default: 50 }
  },

  career: {
    fanbase:      { type: Number, default: 1000 },
    buzz:         { type: Number, default: 20 },
    reputation:   { type: Number, default: 20 },
    totalStreams:  { type: Number, default: 0 },
    weeklyStreams: { type: Number, default: 0 }
  },

  behaviorWeights: {
    writeSong:    { type: Number, default: 3 },
    recordSong:   { type: Number, default: 2 },
    releaseSingle:{ type: Number, default: 2 },
    promote:      { type: Number, default: 2 },
    socialMedia:  { type: Number, default: 4 }
  },

  draftSongs:    { type: Number, default: 0 },
  recordedSongs: { type: Number, default: 0 },
  lastActiveWeek:{ type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

export const Artist = mongoose.models.Artist || mongoose.model('Artist', artistSchema);

// ── Chart ────────────────────────────────────────────────────────────────────

const chartSchema = new mongoose.Schema({
  week:  { type: Number, required: true },
  year:  { type: Number, required: true },
  type:  { type: String, enum: ['global','genre'], default: 'global' },
  genre: { type: String, default: null },

  entries: [{
    position:       Number,
    lastPosition:   { type: Number, default: null },
    positionChange: { type: Number, default: 0 },
    songId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
    songTitle:      String,
    artistId:       mongoose.Schema.Types.ObjectId,
    artistName:     String,
    isNPC:          { type: Boolean, default: true },
    weeklyStreams:   { type: Number, default: 0 },
    totalStreams:    { type: Number, default: 0 },
    weeksOnChart:   { type: Number, default: 1 },
    isNew:          { type: Boolean, default: false },
    isHot:          { type: Boolean, default: false }
  }],

  snapshot: { type: Date, default: Date.now }
});

chartSchema.index({ week: 1, year: 1, type: 1 }, { unique: true });

export const Chart = mongoose.models.Chart || mongoose.model('Chart', chartSchema);

// ── Event ────────────────────────────────────────────────────────────────────

const eventSchema = new mongoose.Schema({
  targetArtistId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  isPlayerEvent:    { type: Boolean, default: false },
  isGlobalEvent:    { type: Boolean, default: false },
  week: Number, year: Number,

  type: { type: String, required: true },
  title: String, description: String,
  severity: { type: String, enum: ['very_negative','negative','neutral','positive','very_positive'], default: 'neutral' },

  effects: {
    fanbase: { type: Number, default: 0 }, buzz: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 }, money: { type: Number, default: 0 },
    songId: { type: mongoose.Schema.Types.ObjectId, default: null },
    viralMultiplier: { type: Number, default: 1 }
  },

  requiresChoice: { type: Boolean, default: false },
  choices: [{ id: String, text: String, consequence: String,
    effects: { fanbase: Number, buzz: Number, reputation: Number, money: Number } }],
  choiceMade: { type: String, default: null },
  isRead:     { type: Boolean, default: false },
  isApplied:  { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now }
});

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
