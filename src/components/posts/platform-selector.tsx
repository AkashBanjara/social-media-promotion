'use client';

import { Instagram, Facebook, Linkedin } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { SocialPlatform } from '@/types';

const OPTIONS: { platform: SocialPlatform; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { platform: 'instagram', label: 'Instagram', icon: Instagram },
  { platform: 'facebook', label: 'Facebook', icon: Facebook },
  { platform: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

export function PlatformSelector({
  selected,
  onChange,
  connectedPlatforms,
}: {
  selected: SocialPlatform[];
  onChange: (platforms: SocialPlatform[]) => void;
  connectedPlatforms: SocialPlatform[];
}) {
  const toggle = (platform: SocialPlatform) => {
    onChange(selected.includes(platform) ? selected.filter((p) => p !== platform) : [...selected, platform]);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {OPTIONS.map(({ platform, label, icon: Icon }) => {
        const isConnected = connectedPlatforms.includes(platform);
        const isSelected = selected.includes(platform);
        return (
          <label
            key={platform}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
              isSelected ? 'border-primary bg-primary/5' : 'border-border',
              !isConnected && 'cursor-not-allowed opacity-50'
            )}
          >
            <Checkbox checked={isSelected} disabled={!isConnected} onCheckedChange={() => isConnected && toggle(platform)} />
            <Icon className="h-4 w-4" />
            <div className="flex-1">
              <p className="text-sm font-medium">{label}</p>
              {!isConnected && <p className="text-xs text-muted-foreground">Not connected</p>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
