import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  artistId:   { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'artistModel' },
  artistModel:{ type: String, required: true, enum: ['User','Artist'], default: 'User' },
  artistName: { type: String, required: true },
  isNPC:      { type: Boolean, default: false },
  genre:      { type: String, default: 'Pop' },

  quality: {
    catchiness:   { type: Number, default: 0 },
    lyrics:       { type: Number, default: 0 },
    production:   { type: Number, default: 0 },
    replayValue:  { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 }
  },

  status: { type: String, enum: ['draft','recorded','released'], default: 'draft' },
  releasedAt:   Date,
  releasedWeek: Number,
  releasedYear: Number,

  streaming: {
    totalStreams:  { type: Number, default: 0 },
    weeklyStreams: { type: Number, default: 0 },
    peakStreams:   { type: Number, default: 0 },
    peakPosition: { type: Number, default: null },
    weeksOnChart:  { type: Number, default: 0 },
    streamHistory: [{ week: Number, year: Number, streams: Number }]
  },

  marketing: {
    isPromoted:      { type: Boolean, default: false },
    promotionWeeks:  { type: Number, default: 0 },
    viralMultiplier: { type: Number, default: 1.0 }
  },

  features:      [{ artistId: mongoose.Schema.Types.ObjectId, artistName: String }],
  isViral:       { type: Boolean, default: false },
  certification: { type: String, enum: [null,'Gold','Platinum','Diamond'], default: null },
  revenue:       { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

songSchema.methods.calcScore = function() {
  const { catchiness, lyrics, production, replayValue } = this.quality;
  this.quality.overallScore = Math.round(catchiness * 0.3 + lyrics * 0.25 + production * 0.25 + replayValue * 0.2);
  return this.quality.overallScore;
};

songSchema.methods.updateCert = function() {
  const s = this.streaming.totalStreams;
  if (s >= 1_000_000_000) this.certification = 'Diamond';
  else if (s >= 100_000_000) this.certification = 'Platinum';
  else if (s >= 500_000) this.certification = 'Gold';
};

export default mongoose.models.Song || mongoose.model('Song', songSchema);
