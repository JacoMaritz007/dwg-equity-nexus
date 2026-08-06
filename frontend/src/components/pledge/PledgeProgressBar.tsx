import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/offeringHelpers';

interface PledgeProgressBarProps {
  raisedAmount: number;
  raisedPercentage: number;
  pledgedAmount: number;
  pledgedPercentage: number;
  pledgerCount?: number;
  size?: 'sm' | 'lg';
}

// Two fills on one track: a solid "raised" bar (funds actually called and
// paid) drawn over a lighter "pledged" bar (signed commitments, always >=
// raised — see offeringHelpers.ts). The gap between them is deliberate, not
// a bug — it's the platform's honesty about what's actually moved vs.
// what's been committed. The momentum line only renders once there's a real
// gap to show, so an untouched offering (0 raised, 0 pledged) stays quiet.
export const PledgeProgressBar: React.FC<PledgeProgressBarProps> = ({
  raisedAmount,
  raisedPercentage,
  pledgedAmount,
  pledgedPercentage,
  pledgerCount = 0,
  size = 'sm',
}) => {
  const barHeight = size === 'lg' ? 'h-3' : 'h-2';
  const hasPledgeMomentum = pledgedAmount > raisedAmount;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Raised: {formatCurrency(raisedAmount)}</span>
        <span className="font-medium">{raisedPercentage.toFixed(size === 'lg' ? 1 : 0)}%</span>
      </div>

      <div className={`relative w-full bg-muted rounded-full ${barHeight} overflow-hidden`}>
        <div
          className="absolute inset-y-0 left-0 bg-accent/40 rounded-full transition-all duration-500"
          style={{ width: `${pledgedPercentage}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${raisedPercentage}%` }}
        />
      </div>

      {hasPledgeMomentum && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>
            {formatCurrency(pledgedAmount)} pledged
            {pledgerCount > 0 && ` · ${pledgerCount} investor${pledgerCount === 1 ? '' : 's'}`}
          </span>
        </div>
      )}
    </div>
  );
};
