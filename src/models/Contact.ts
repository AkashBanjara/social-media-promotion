import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  tags: string[];
  subscribed: boolean;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    tags: { type: [String], default: [] },
    subscribed: { type: Boolean, default: true },
    unsubscribeToken: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Prevent duplicate email addresses (spec §15).
ContactSchema.index({ email: 1 }, { unique: true });
ContactSchema.index({ tags: 1 });

export const Contact = (models.Contact as Model<IContact>) || model<IContact>('Contact', ContactSchema);
