/**
 * useSessionsListState Hook
 * Manages sessions list state with URL persistence for filters and pagination.
 */

import { useState, useCallback, useMemo } from 'react';
import type { SessionStatus, Session } from '../api/sessions.service';

// Types previously from deleted components
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export type DatePreset = 'today' | 'last7days' | 'last30days' | 'custom' | 'all' | null;
export type SortField = 'status' | 'scheduledAt' | 'startedAt' | 'expiresAt';
export type SortOrder = 'asc' | 'desc';
export type PageSize = 10 | 20 | 50 | 100;

interface SessionsListState {
  // Search
  search: string;
  // Filters
  selectedStatuses: SessionStatus[];
  selectedWorkspaceId: string | undefined;
  selectedDomainType: string | undefined;
  dateRange: DateRange;
  datePreset: DatePreset;
  // Sorting
  sortField: SortField | null;
  sortOrder: SortOrder;
  // Selection
  selectedIds: Set<string>;
  // Pagination
  currentPage: number;
  pageSize: PageSize;
}

interface SessionsListActions {
  setSearch: (search: string) => void;
  setSelectedStatuses: (statuses: SessionStatus[]) => void;
  toggleStatus: (status: SessionStatus | null) => void;
  setSelectedWorkspaceId: (id: string | undefined) => void;
  setSelectedDomainType: (type: string | undefined) => void;
  setDateRange: (range: DateRange, preset: DatePreset) => void;
  setSortField: (field: SortField | null, order: SortOrder) => void;
  setSelectedIds: (ids: Set<string>) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: PageSize) => void;
  clearAllFilters: () => void;
  clearSelection: () => void;
}

interface UseSessionsListStateReturn extends SessionsListState, SessionsListActions {
  // Computed
  hasActiveFilters: boolean;
  filterSessions: (sessions: Session[]) => Session[];
  sortSessions: (sessions: Session[]) => Session[];
  paginateSessions: (sessions: Session[]) => { paginated: Session[]; total: number };
}

export function useSessionsListState(): UseSessionsListStateReturn {
  // Note: URL persistence could be added via useSearch when this hook
  // is used in routes that support search params. For now, we use
  // component-level state only.

  // State
  const [search, setSearchState] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<SessionStatus[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(undefined);
  const [selectedDomainType, setSelectedDomainType] = useState<string | undefined>(undefined);
  const [dateRange, setDateRangeState] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [datePreset, setDatePreset] = useState<DatePreset>(null);
  const [sortField, setSortFieldState] = useState<SortField | null>(null);
  const [sortOrder, setSortOrderState] = useState<SortOrder>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState<PageSize>(20);

  // Navigation for URL updates (optional, won't fail if route doesn't support it)
  // Note: URL persistence is not yet implemented - will be added when needed
  // const navigate = useNavigate();

  // Actions
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setCurrentPageState(1); // Reset to first page on search
  }, []);

  const toggleStatus = useCallback((status: SessionStatus | null) => {
    if (status === null) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses((prev) =>
        prev.includes(status)
          ? prev.filter((s) => s !== status)
          : [...prev, status]
      );
    }
    setCurrentPageState(1);
  }, []);

  const setDateRange = useCallback((range: DateRange, preset: DatePreset) => {
    setDateRangeState(range);
    setDatePreset(preset);
    setCurrentPageState(1);
  }, []);

  const setSortField = useCallback((field: SortField | null, order: SortOrder) => {
    setSortFieldState(field);
    setSortOrderState(order);
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
    setSelectedIds(new Set()); // Clear selection on page change
  }, []);

  const setPageSize = useCallback((size: PageSize) => {
    setPageSizeState(size);
    setCurrentPageState(1); // Reset to first page
    setSelectedIds(new Set());
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchState('');
    setSelectedStatuses([]);
    setSelectedWorkspaceId(undefined);
    setSelectedDomainType(undefined);
    setDateRangeState({ from: undefined, to: undefined });
    setDatePreset(null);
    setCurrentPageState(1);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Computed
  const hasActiveFilters = useMemo(() => {
    return (
      search !== '' ||
      selectedStatuses.length > 0 ||
      selectedWorkspaceId !== undefined ||
      selectedDomainType !== undefined ||
      dateRange.from !== undefined ||
      dateRange.to !== undefined
    );
  }, [search, selectedStatuses, selectedWorkspaceId, selectedDomainType, dateRange]);

  // Filter function
  const filterSessions = useCallback(
    (sessions: Session[]): Session[] => {
      return sessions.filter((session) => {
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesId = session.id.toLowerCase().includes(searchLower);
          const matchesExternalId = session.externalId?.toLowerCase().includes(searchLower);
          if (!matchesId && !matchesExternalId) {
            return false;
          }
        }

        // Status filter
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(session.status)) {
          return false;
        }

        // Workspace filter
        if (selectedWorkspaceId && session.workspaceId !== selectedWorkspaceId) {
          return false;
        }

        // Domain type filter
        if (selectedDomainType && session.domainType !== selectedDomainType) {
          return false;
        }

        // Date range filter
        if (dateRange.from || dateRange.to) {
          const sessionDate = new Date(session.createdAt);
          if (dateRange.from && sessionDate < dateRange.from) {
            return false;
          }
          if (dateRange.to) {
            const endOfDay = new Date(dateRange.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (sessionDate > endOfDay) {
              return false;
            }
          }
        }

        return true;
      });
    },
    [search, selectedStatuses, selectedWorkspaceId, selectedDomainType, dateRange]
  );

  // Sort function
  const sortSessions = useCallback(
    (sessions: Session[]): Session[] => {
      if (!sortField) return sessions;

      return [...sessions].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case 'status': {
            const statusOrder: Record<SessionStatus, number> = {
              ACTIVE: 0,
              WAITING: 1,
              PAUSED: 2,
              CREATED: 3,
              COMPLETED: 4,
              EXPIRED: 5,
              FAILED: 6,
            };
            comparison = statusOrder[a.status] - statusOrder[b.status];
            break;
          }
          case 'scheduledAt': {
            const aDate = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
            const bDate = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
            comparison = aDate - bDate;
            break;
          }
          case 'startedAt': {
            const aDate = a.startedAt ? new Date(a.startedAt).getTime() : 0;
            const bDate = b.startedAt ? new Date(b.startedAt).getTime() : 0;
            comparison = aDate - bDate;
            break;
          }
          case 'expiresAt': {
            const aDate = new Date(a.expiresAt).getTime();
            const bDate = new Date(b.expiresAt).getTime();
            comparison = aDate - bDate;
            break;
          }
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    },
    [sortField, sortOrder]
  );

  // Paginate function
  const paginateSessions = useCallback(
    (sessions: Session[]): { paginated: Session[]; total: number } => {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return {
        paginated: sessions.slice(startIndex, endIndex),
        total: sessions.length,
      };
    },
    [currentPage, pageSize]
  );

  return {
    // State
    search,
    selectedStatuses,
    selectedWorkspaceId,
    selectedDomainType,
    dateRange,
    datePreset,
    sortField,
    sortOrder,
    selectedIds,
    currentPage,
    pageSize,
    // Actions
    setSearch,
    setSelectedStatuses,
    toggleStatus,
    setSelectedWorkspaceId,
    setSelectedDomainType,
    setDateRange,
    setSortField,
    setSelectedIds,
    setCurrentPage,
    setPageSize,
    clearAllFilters,
    clearSelection,
    // Computed
    hasActiveFilters,
    filterSessions,
    sortSessions,
    paginateSessions,
  };
}
