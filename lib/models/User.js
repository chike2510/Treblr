import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true },
  artistName: { type: String, required: true },
  genre:      { type: String, default: 'Pop' },
  avatarColor:{ type: String, default: '#8b5cf6' },
  bio:        { type: String, default: '' },

  attributes: {
    songwriting: { type: Number, default: 20 },
    vocals:      { type: Number, default: 20 },
    production:  { type: Number, default: 15 },
    charisma:    { type: Number, default: 20 },
    workEthic:   { type: Number, default: 25 }
  },

  career: {
    fanbase:      { type: Number, default: 50 },
    buzz:         { type: Number, default: 10 },
    reputation:   { type: Number, default: 0 },
    money:        { type: Number, default: 1000 },
    totalStreams:  { type: Number, default: 0 },
    weeklyStreams: { type: Number, default: 0 },
    level: { type: String, default: 'Unsigned', enum: ['Unsigned','Indie','Rising','Mid-Tier','Mainstream','Superstar','Legend'] }
  },

  social: {
    instagram: { type: Number, default: 0 },
    twitter:   { type: Number, default: 0 },
    tiktok:    { type: Number, default: 0 }
  },

  gameState: {
    currentWeek:       { type: Number, default: 1 },
    currentYear:       { type: Number, default: 1 },
    actionsThisWeek:   { type: Number, default: 0 },
    maxActionsPerWeek: { type: Number, default: 3 },
    pendingSongs:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    recordedSongs:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    actionsLog:        [{ week: Number, year: Number, action: String, message: String }],
    collaborations:    [{ artistId: mongoose.Schema.Types.ObjectId, week: Number }]
  },

  achievements: [{ id: String, name: String, description: String, unlockedAt: { type: Date, default: Date.now } }],

  recentEvents: [{
    week: Number, year: Number,
    type: String, title: String, description: String,
    severity: String, effects: Object
  }],

  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(p) { return bcrypt.compare(p, this.password); };

userSchema.methods.updateLevel = function() {
  const f = this.career.fanbase;
  if (f >= 10_000_000)  this.career.level = 'Legend';
  else if (f >= 1_000_000)  this.career.level = 'Superstar';
  else if (f >= 200_000)    this.career.level = 'Mainstream';
  else if (f >= 50_000)     this.career.level = 'Mid-Tier';
  else if (f >= 10_000)     this.career.level = 'Rising';
  else if (f >= 1_000)      this.career.level = 'Indie';
  else                      this.career.level = 'Unsigned';
};

export default mongoose.models.User || mongoose.model('User', userSchema);
