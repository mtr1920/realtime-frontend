import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// =============================================================================
// Types
// =============================================================================

export type NetworkStatus = 'online' | 'offline';

interface NetworkState {
  // State
  status: NetworkStatus;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;

  // Actions
  setOnline: () => void;
  setOffline: () => void;
}

const initialState = {
  status: 'online' as NetworkStatus,
  lastOnlineAt: null as Date | null,
  lastOfflineAt: null as Date | null,
};

// =============================================================================
// Store
// =============================================================================

export const useNetworkStore = create<NetworkState>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      // ===========================================================================
      // Actions
      // ===========================================================================

      setOnline: () =>
        set((state) => {
          state.status = 'online';
          state.lastOnlineAt = new Date();
        }),

      setOffline: () =>
        set((state) => {
          state.status = 'offline';
          state.lastOfflineAt = new Date();
        }),
    }))
  )
);

// =============================================================================
// Subscription Helpers
// =============================================================================

/**
 * Subscribe to network status changes
 */
export const subscribeToNetworkStatus = (
  callback: (status: NetworkStatus) => void
) => {
  return useNetworkStore.subscribe(
    (state) => state.status,
    (status) => callback(status)
  );
};
