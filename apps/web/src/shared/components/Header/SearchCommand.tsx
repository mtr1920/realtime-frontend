/**
 * Search Command
 * Command palette for quick navigation and search.
 * Includes AI-powered route suggestions when manual search fails.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  LayoutDashboard,
  Video,
  FolderKanban,
  Users,
  Settings,
  Plus,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  Button,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/shared/ui';
import { usePermissions } from '@/shared/hooks';
import { cn } from '@/shared/lib/utils';
import { suggestRoute, filterRoutesByPermissions, type AISuggestion } from '@/shared/services/ai-route-suggest.service';

interface CommandOption {
  icon: React.ElementType;
  label: string;
  href?: string;
  action?: () => void;
  shortcut?: string;
  permission?: string;
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Filter routes by user permissions for AI suggestions
  const allowedRoutes = useMemo(
    () => filterRoutesByPermissions(hasPermission),
    [hasPermission]
  );

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchValue('');
      setAiSuggestion(null);
      setIsLoadingAI(false);
    }
  }, [open]);

  const handleSelect = useCallback(
    (option: CommandOption) => {
      setOpen(false);
      if (option.href) {
        navigate({ to: option.href });
      } else if (option.action) {
        option.action();
      }
    },
    [navigate]
  );

  const handleAISuggestionSelect = useCallback(() => {
    if (aiSuggestion?.path) {
      setOpen(false);
      navigate({ to: aiSuggestion.path });
    }
  }, [aiSuggestion, navigate]);

  const navigationOptions: CommandOption[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Video, label: 'Sessions', href: '/sessions' },
    { icon: FolderKanban, label: 'Workspaces', href: '/workspaces', permission: 'canViewWorkspace' },
    { icon: Users, label: 'Users', href: '/users', permission: 'canViewUsers' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const actionOptions: CommandOption[] = [
    {
      icon: Plus,
      label: 'Create Session',
      href: '/sessions/create',
      shortcut: '⌘N',
      permission: 'canCreateSession',
    },
    {
      icon: Plus,
      label: 'Create Workspace',
      href: '/workspaces/create',
      permission: 'canEditWorkspace',
    },
  ];

  const filteredNavOptions = navigationOptions.filter(
    (opt) => !opt.permission || hasPermission(opt.permission as never)
  );

  const filteredActionOptions = actionOptions.filter(
    (opt) => !opt.permission || hasPermission(opt.permission as never)
  );

  // Check if search matches any options
  const searchLower = searchValue.toLowerCase();
  const hasManualMatches = [...filteredNavOptions, ...filteredActionOptions].some(
    (opt) => opt.label.toLowerCase().includes(searchLower)
  );

  // Fetch AI suggestion when no manual matches found
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset AI state if search is empty or has manual matches
    if (!searchValue || searchValue.length < 2 || hasManualMatches) {
      setAiSuggestion(null);
      setIsLoadingAI(false);
      return;
    }

    // Debounce AI request
    setIsLoadingAI(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const suggestion = await suggestRoute(searchValue, allowedRoutes);
        setAiSuggestion(suggestion);
      } catch {
        setAiSuggestion(null);
      } finally {
        setIsLoadingAI(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, hasManualMatches, allowedRoutes]);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          'relative h-9 w-9 p-0 sm:w-64 sm:justify-start sm:px-3 sm:py-2',
          'text-muted-foreground'
        )}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type a command or search..." 
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>
            {isLoadingAI ? (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                <span>Asking AI for suggestions...</span>
              </div>
            ) : aiSuggestion?.path ? (
              <div className="py-2 px-2">
                <p className="text-sm text-muted-foreground mb-3 text-center">No exact match found.</p>
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">AI Suggestion</div>
                <button
                  onClick={handleAISuggestionSelect}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                >
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">
                      {aiSuggestion.route?.label || aiSuggestion.path}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{aiSuggestion.reason}</span>
                  </div>
                </button>
              </div>
            ) : (
              'No results found.'
            )}
          </CommandEmpty>

          <CommandGroup heading="Navigation">
            {filteredNavOptions.map((option) => (
              <CommandItem
                key={option.label}
                onSelect={() => handleSelect(option)}
                className="cursor-pointer"
              >
                <option.icon className="mr-2 h-4 w-4" />
                <span>{option.label}</span>
                {option.shortcut && (
                  <CommandShortcut>{option.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          {filteredActionOptions.length > 0 && (
            <CommandGroup heading="Actions">
              {filteredActionOptions.map((option) => (
                <CommandItem
                  key={option.label}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <option.icon className="mr-2 h-4 w-4" />
                  <span>{option.label}</span>
                  {option.shortcut && (
                    <CommandShortcut>{option.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
