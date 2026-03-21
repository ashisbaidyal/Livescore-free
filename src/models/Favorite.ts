import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  userId: string;
  type: 'team' | 'league' | 'match';
  targetId: string;
  metadata?: any;
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

export default mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);
