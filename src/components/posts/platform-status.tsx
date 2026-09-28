import { Badge } from '@/components/ui/badge';
import { PLATFORM_LABELS, type SocialPlatform } from '@/types';
import { cn } from '@/lib/utils';

export function PlatformBadge({ platform, className }: { platform: SocialPlatform; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('font-normal', className)}>
      {PLATFORM_LABELS[platform]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'published' || status === 'sent' || status === 'success'
      ? 'success'
      : status === 'failed'
      ? 'destructive'
      : status === 'partial'
      ? 'default'
      : 'secondary';

  return (
    <Badge variant={variant} className="capitalize font-normal">
      {status}
    </Badge>
  );
}
