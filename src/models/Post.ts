import { Schema, model, models, type Document, type Types, type Model } from 'mongoose';

export type PostStatus = 'draft' | 'publishing' | 'published' | 'partial' | 'failed';

export interface IPost extends Document {
  userId: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  caption: string;
  websiteUrl?: string;
  hashtags: string[];
  platforms: ('instagram' | 'facebook' | 'linkedin')[];
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    caption: { type: String, required: true },
    websiteUrl: { type: String },
    hashtags: { type: [String], default: [] },
    platforms: { type: [String], enum: ['instagram', 'facebook', 'linkedin'], default: [] },
    status: {
      type: String,
      enum: ['draft', 'publishing', 'published', 'partial', 'failed'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);

export const Post = (models.Post as Model<IPost>) || model<IPost>('Post', PostSchema);

export type PlatformResultStatus = 'pending' | 'success' | 'failed';

export interface IPostPlatformResult extends Document {
  postId: Types.ObjectId;
  platform: 'instagram' | 'facebook' | 'linkedin';
  status: PlatformResultStatus;
  externalPostId?: string;
  publishedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostPlatformResultSchema = new Schema<IPostPlatformResult>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'facebook', 'linkedin'], required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    externalPostId: { type: String },
    publishedAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

PostPlatformResultSchema.index({ postId: 1, platform: 1 }, { unique: true });

export const PostPlatformResult =
  (models.PostPlatformResult as Model<IPostPlatformResult>) ||
  model<IPostPlatformResult>('PostPlatformResult', PostPlatformResultSchema);
