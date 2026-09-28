import { Schema, model, models, type Document, type Types, type Model } from 'mongoose';

export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'failed';

export interface IEmailCampaign extends Document {
  name: string;
  subject: string;
  fromName: string;
  content: string;
  tagFilter: string[];
  recipientCount: number;
  status: CampaignStatus;
  createdAt: Date;
  sentAt?: Date;
}

const EmailCampaignSchema = new Schema<IEmailCampaign>(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    fromName: { type: String, required: true },
    content: { type: String, required: true },
    tagFilter: { type: [String], default: [] },
    recipientCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'sending', 'sent', 'failed'], default: 'draft' },
    sentAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const EmailCampaign =
  (models.EmailCampaign as Model<IEmailCampaign>) ||
  model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema);

export type EmailDeliveryStatus = 'queued' | 'sending' | 'sent' | 'failed';

export interface IEmailLog extends Document {
  campaignId: Types.ObjectId;
  contactId: Types.ObjectId;
  recipient: string;
  status: EmailDeliveryStatus;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'EmailCampaign', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    recipient: { type: String, required: true },
    status: { type: String, enum: ['queued', 'sending', 'sent', 'failed'], default: 'queued' },
    error: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export const EmailLog =
  (models.EmailLog as Model<IEmailLog>) || model<IEmailLog>('EmailLog', EmailLogSchema);
