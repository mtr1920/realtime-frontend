/**
 * Extend Session Dialog
 * Dialog for extending session expiry time.
 */

import { useState, useMemo } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Input,
} from '@/shared/ui';

interface ExtendSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  currentExpiry: string;
  onConfirm: (newExpiry: string) => Promise<void>;
}

type ExtendOption = '15m' | '30m' | '1h' | '2h' | 'custom';

const EXTEND_OPTIONS: { value: ExtendOption; label: string; minutes: number }[] = [
  { value: '15m', label: '15 minutes', minutes: 15 },
  { value: '30m', label: '30 minutes', minutes: 30 },
  { value: '1h', label: '1 hour', minutes: 60 },
  { value: '2h', label: '2 hours', minutes: 120 },
];

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 0) return 'Expired';
  if (diffMinutes < 60) return `${diffMinutes}m from now`;
  if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    return remainingMinutes > 0
      ? `${diffHours}h ${remainingMinutes}m from now`
      : `${diffHours}h from now`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} from now`;
}

export function ExtendSessionDialog({
  open,
  onOpenChange,
  sessionId,
  currentExpiry,
  onConfirm,
}: ExtendSessionDialogProps) {
  const [selectedOption, setSelectedOption] = useState<ExtendOption>('30m');
  const [customMinutes, setCustomMinutes] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentExpiryDate = useMemo(() => new Date(currentExpiry), [currentExpiry]);

  const newExpiry = useMemo(() => {
    let minutesToAdd: number;

    if (selectedOption === 'custom') {
      minutesToAdd = parseInt(customMinutes, 10) || 60;
    } else {
      const option = EXTEND_OPTIONS.find((o) => o.value === selectedOption);
      minutesToAdd = option?.minutes ?? 30;
    }

    const newDate = new Date(currentExpiryDate.getTime() + minutesToAdd * 60 * 1000);
    return newDate;
  }, [currentExpiryDate, selectedOption, customMinutes]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(newExpiry.toISOString());
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedOption('30m');
    setCustomMinutes('60');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Extend Session
          </DialogTitle>
          <DialogDescription>
            Extend the expiry time for session{' '}
            <span className="font-mono">{sessionId.slice(0, 8)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Expiry */}
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="text-sm font-medium mb-1">Current Expiry</div>
            <div className="text-sm text-muted-foreground">
              {formatDateTime(currentExpiryDate)}
            </div>
          </div>

          {/* Duration Options */}
          <div className="space-y-3">
            <Label>Extend by</Label>
            <RadioGroup
              value={selectedOption}
              onValueChange={(value) => setSelectedOption(value as ExtendOption)}
              className="grid grid-cols-2 gap-2"
            >
              {EXTEND_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
              <div className="col-span-2 flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer shrink-0">
                  Custom:
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    setSelectedOption('custom');
                  }}
                  className="w-20 h-8"
                  placeholder="60"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </RadioGroup>
          </div>

          {/* New Expiry Preview */}
          <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/50">
            <div className="text-sm font-medium mb-1 text-green-700 dark:text-green-300">
              New Expiry
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              {formatDateTime(newExpiry)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              {formatRelativeTime(newExpiry)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Extend Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
