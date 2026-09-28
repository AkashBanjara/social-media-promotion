import { Schema, model, models, type Document, type Model } from 'mongoose';
import { encryptSecret, decryptSecret } from '@/lib/encryption';

export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin';

export interface ISocialAccount extends Document {
  userId: string; // AUTHORIZED_EMAIL — kept for schema clarity even though single-user
  platform: SocialPlatform;
  accountId: string; // IG business account ID / FB Page ID / LinkedIn URN
  accountName: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  expiresAt?: Date | null;
  metadata: Record<string, unknown>; // e.g. { pageId, igUserId, profilePictureUrl }
  status: 'connected' | 'disconnected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const SocialAccountSchema = new Schema<ISocialAccount>(
  {
    userId: { type: String, required: true, index: true },
    platform: { type: String, enum: ['instagram', 'facebook', 'linkedin'], required: true },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    accessTokenEncrypted: { type: String, required: true, select: false },
    refreshTokenEncrypted: { type: String, select: false },
    expiresAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['connected', 'disconnected', 'expired'], default: 'connected' },
  },
  { timestamps: true }
);

SocialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

// Helper (not schema methods, since they need the raw select(+field) fetched first)
export function setAccessToken(doc: ISocialAccount, token: string) {
  doc.accessTokenEncrypted = encryptSecret(token);
}
export function getAccessToken(doc: ISocialAccount): string {
  return decryptSecret(doc.accessTokenEncrypted);
}
export function setRefreshToken(doc: ISocialAccount, token: string) {
  doc.refreshTokenEncrypted = encryptSecret(token);
}
export function getRefreshToken(doc: ISocialAccount): string | null {
  return doc.refreshTokenEncrypted ? decryptSecret(doc.refreshTokenEncrypted) : null;
}

export const SocialAccount =
  (models.SocialAccount as Model<ISocialAccount>) ||
  model<ISocialAccount>('SocialAccount', SocialAccountSchema);
