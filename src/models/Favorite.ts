import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  userId: string;
  type: 'team' | 'league' | 'match';
  targetId: string;
  metadata?: unknown;
  createdAt: Date;
}

const FavoriteSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['team', 'league', 'match'] },
  targetId: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

FavoriteSchema.index({ userId: 1, type: 1, targetId: 1 }, { unique: true });

// Prevent model overwrite in serverless Next.js functions
const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);

export default Favorite;
