import { z } from 'zod';

export const platformEnum = z.enum(['instagram', 'facebook', 'linkedin']);

export const createPostSchema = z.object({
  imageUrl: z.string().url(),
  cloudinaryPublicId: z.string().min(1),
  caption: z.string().min(1, 'Caption is required').max(2200, 'Caption is too long'),
  websiteUrl: z
    .string()
    .trim()
    .url('Enter a valid URL, e.g. https://example.com')
    .optional()
    .or(z.literal('')),
  hashtags: z.string().max(500).optional().default(''),
  platforms: z.array(platformEnum).min(1, 'Select at least one platform'),
  saveAsDraft: z.boolean().optional().default(false),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Enter a valid email address'),
  tags: z.array(z.string()).optional().default([]),
});

export const contactImportRowSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  tags: z.string().optional(),
});

export const smtpConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.coerce.number().int().min(1).max(65535),
  username: z.string().min(1, 'SMTP username is required'),
  password: z.string().min(1, 'SMTP password is required').optional(), // optional on update if unchanged
  fromEmail: z.string().email('Enter a valid from-email'),
  fromName: z.string().min(1, 'From name is required').max(200),
  secure: z.boolean().default(false),
});

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(300),
  fromName: z.string().min(1).max(200),
  content: z.string().min(1, 'Email content is required'),
  tagFilter: z.array(z.string()).optional().default([]), // empty = all subscribed contacts
});

export function parseHashtags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,]+/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
        .map((tag) => tag.replace(/[^#\w]/g, ''))
        .filter((tag) => tag.length > 1)
    )
  );
}
