import { Schema, model, models, type Document, type Model } from 'mongoose';
import { encryptSecret, decryptSecret } from '@/lib/encryption';

export interface ISmtpConfig extends Document {
  userId: string;
  host: string;
  port: number;
  username: string;
  passwordEncrypted: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
  lastTestedAt?: Date;
  lastTestOk?: boolean;
  updatedAt: Date;
}

const SmtpConfigSchema = new Schema<ISmtpConfig>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    host: { type: String, required: true },
    port: { type: Number, required: true },
    username: { type: String, required: true },
    passwordEncrypted: { type: String, required: true, select: false },
    fromEmail: { type: String, required: true },
    fromName: { type: String, required: true },
    secure: { type: Boolean, default: false },
    lastTestedAt: { type: Date },
    lastTestOk: { type: Boolean },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export function setSmtpPassword(doc: ISmtpConfig, password: string) {
  doc.passwordEncrypted = encryptSecret(password);
}
export function getSmtpPassword(doc: ISmtpConfig): string {
  return decryptSecret(doc.passwordEncrypted);
}

export const SmtpConfig =
  (models.SmtpConfig as Model<ISmtpConfig>) || model<ISmtpConfig>('SmtpConfig', SmtpConfigSchema);
