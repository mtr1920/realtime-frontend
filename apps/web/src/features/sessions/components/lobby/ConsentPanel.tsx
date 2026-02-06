/**
 * ConsentPanel
 *
 * Recording and compliance consent for joining sessions.
 */

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Video, Lock, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { Checkbox } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface ConsentItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  icon?: ReactNode;
}

export interface ConsentPanelProps {
  /** Whether recording consent is required */
  recordingEnabled?: boolean;

  /** Whether compliance consent is required */
  complianceEnabled?: boolean;

  /** Whether browser lock consent is required */
  browserLockEnabled?: boolean;

  /** Custom consent items */
  customItems?: ConsentItem[];

  /** Called when consent state changes */
  onConsentChange?: (allRequired: boolean, consents: Record<string, boolean>) => void;

  /** Additional CSS class */
  className?: string;
}

export function ConsentPanel({
  recordingEnabled = false,
  complianceEnabled = false,
  browserLockEnabled = false,
  customItems = [],
  onConsentChange,
  className,
}: ConsentPanelProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  // Build consent items from props
  const consentItems: ConsentItem[] = useMemo(
    () => [
      ...(recordingEnabled
        ? [
            {
              id: 'recording',
              title: 'Session Recording',
              description:
                'This session will be recorded. By joining, you consent to being recorded.',
              required: true,
              icon: <Video className="h-5 w-5" aria-hidden />,
            },
          ]
        : []),
      ...(complianceEnabled
        ? [
            {
              id: 'compliance',
              title: 'Compliance Monitoring',
              description:
                'This session includes compliance monitoring. Your activity may be monitored and logged.',
              required: true,
              icon: <Shield className="h-5 w-5" aria-hidden />,
            },
          ]
        : []),
      ...(browserLockEnabled
        ? [
            {
              id: 'browserLock',
              title: 'Browser Lock',
              description:
                'Your browser will be locked during the session. You will not be able to switch tabs or windows.',
              required: true,
              icon: <Lock className="h-5 w-5" aria-hidden />,
            },
          ]
        : []),
      ...customItems,
    ],
    [recordingEnabled, complianceEnabled, browserLockEnabled, customItems]
  );

  // Check if all required consents are given
  const allRequiredConsented = consentItems
    .filter((item) => item.required)
    .every((item) => consents[item.id]);

  const handleConsentChange = useCallback(
    (id: string, checked: boolean) => {
      const newConsents = { ...consents, [id]: checked };
      setConsents(newConsents);

      const allRequired = consentItems
        .filter((item) => item.required)
        .every((item) => newConsents[item.id]);

      onConsentChange?.(allRequired, newConsents);
    },
    [consents, consentItems, onConsentChange]
  );

  if (consentItems.length === 0) {
    return null;
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
          Required Consents
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {consentItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-4 rounded-lg border p-4',
              consents[item.id]
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                : 'border-muted'
            )}
          >
            <Checkbox
              id={item.id}
              checked={consents[item.id] ?? false}
              onCheckedChange={(checked: boolean | 'indeterminate') =>
                handleConsentChange(item.id, checked === true)
              }
              aria-describedby={`${item.id}-description`}
            />

            <div className="flex-1 space-y-1">
              <label
                htmlFor={item.id}
                className="flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                {item.icon && (
                  <span
                    className={cn(
                      consents[item.id] ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                    )}
                  >
                    {item.icon}
                  </span>
                )}
                {item.title}
                {item.required && (
                  <span className="text-xs text-destructive">*</span>
                )}
              </label>
              <p
                id={`${item.id}-description`}
                className="text-sm text-muted-foreground"
              >
                {item.description}
              </p>
            </div>

            {consents[item.id] && (
              <CheckCircle2
                className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                aria-hidden
              />
            )}
          </div>
        ))}

        {/* Status */}
        <div
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border p-3',
            allRequiredConsented
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
              : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
          )}
        >
          {allRequiredConsented ? (
            <>
              <CheckCircle2
                className="h-4 w-4 text-green-600 dark:text-green-400"
                aria-hidden
              />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                All required consents provided
              </p>
            </>
          ) : (
            <>
              <AlertTriangle
                className="h-4 w-4 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Please accept all required consents to continue
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
