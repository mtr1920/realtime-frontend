/**
 * Config JSON Editor
 * A JSON editor component with syntax highlighting and validation.
 */

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Check, Copy, RotateCcw } from 'lucide-react';
import { Button, Label } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface ConfigJsonEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function ConfigJsonEditor({
  value,
  onChange,
  label = 'Configuration JSON',
  error,
  disabled = false,
  className,
}: ConfigJsonEditorProps) {
  const [jsonString, setJsonString] = useState(() =>
    JSON.stringify(value, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync external value changes (only when value prop changes, not on internal edits)
  useEffect(() => {
    const newJsonString = JSON.stringify(value, null, 2);
    setJsonString((prev) => {
      if (newJsonString !== prev) {
        setParseError(null);
        return newJsonString;
      }
      return prev;
    });
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setJsonString(newValue);

      try {
        const parsed = JSON.parse(newValue);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          setParseError(null);
          onChange(parsed);
        } else {
          setParseError('Must be a valid JSON object');
        }
      } catch {
        setParseError('Invalid JSON syntax');
      }
    },
    [onChange]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied
    }
  }, [jsonString]);

  const handleReset = useCallback(() => {
    const formattedJson = JSON.stringify(value, null, 2);
    setJsonString(formattedJson);
    setParseError(null);
  }, [value]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setParseError(null);
    } catch {
      // Can't format invalid JSON
    }
  }, [jsonString]);

  const displayError = error || parseError;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="config-json">{label}</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={disabled || !!parseError}
            title="Format JSON"
          >
            Format
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={disabled}
            title="Reset to original"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={disabled}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="relative">
        <textarea
          id="config-json"
          value={jsonString}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'w-full min-h-[300px] p-3 font-mono text-sm rounded-md border bg-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            displayError && 'border-destructive focus:ring-destructive'
          )}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? 'config-json-error' : undefined}
          spellCheck={false}
        />
      </div>

      {displayError && (
        <div
          id="config-json-error"
          className="flex items-center gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Enter valid JSON configuration. The structure depends on the domain type.
      </p>
    </div>
  );
}
