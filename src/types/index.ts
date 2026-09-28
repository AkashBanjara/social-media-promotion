export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin';

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  externalPostId?: string;
  error?: string;
}

export interface DashboardStats {
  totalPosts: number;
  successfulPosts: number;
  failedPosts: number;
  totalCampaigns: number;
  totalContacts: number;
  connectedAccounts: number;
  recentPosts: Array<{
    _id: string;
    imageUrl: string;
    caption: string;
    status: string;
    createdAt: string;
    platforms: SocialPlatform[];
  }>;
  recentCampaigns: Array<{
    _id: string;
    name: string;
    status: string;
    recipientCount: number;
    createdAt: string;
  }>;
}
