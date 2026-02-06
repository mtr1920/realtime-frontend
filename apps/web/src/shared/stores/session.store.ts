import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Session,
  SessionStatus,
  Participant,
  SessionConfig,
  ConnectionState,
  MediaState,
  PublicRoleConfig,
} from '@protocol/index';

// =============================================================================
// Types
// =============================================================================

interface SessionState {
  // Session State
  sessionId: string | null;
  session: Session | null;
  participants: Map<string, Participant>;
  localParticipantId: string | null;
  status: SessionStatus | null;
  config: SessionConfig | null;
  /** Role config (canonical format) */
  roleConfig: PublicRoleConfig | null;

  // Join Token (for reconnection)
  realtimeToken: string | null;
  wsEndpoint: string | null;

  // Join context (for session.join message)
  displayName: string | null;
  /** Role ID from HTTP join response */
  roleId: string | null;

  /** Whether session.ready has been sent (participant announced to others) */
  hasAnnouncedReady: boolean;

  /** ICE servers for WebRTC connections */
  iceServers: RTCIceServer[] | null;
  iceServersExpiresAt: string | null;

  // Derived state helpers
  getParticipant: (id: string) => Participant | undefined;
  getLocalParticipant: () => Participant | undefined;
  getParticipantsList: () => Participant[];
  isLocalParticipant: (participantId: string) => boolean;

  // Session Actions
  setSession: (session: Session) => void;
  setRoleConfig: (config: PublicRoleConfig) => void;
  setLocalParticipantId: (id: string) => void;

  // Participant Actions
  addParticipant: (participant: Participant) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  setParticipants: (participants: Participant[]) => void;
  updateParticipantMedia: (participantId: string, mediaState: Partial<MediaState>) => void;
  updateParticipantConnection: (participantId: string, connectionState: ConnectionState) => void;

  // Credentials & Join Context
  setRealtimeCredentials: (token: string, wsEndpoint: string) => void;
  setJoinContext: (displayName: string, roleId?: string) => void;

  // Ready State Actions
  setHasAnnouncedReady: (value: boolean) => void;

  // ICE Servers
  setIceServers: (servers: RTCIceServer[], expiresAt: string) => void;

  // Lifecycle
  reset: () => void;
}

const initialState = {
  sessionId: null,
  session: null,
  participants: new Map<string, Participant>(),
  localParticipantId: null,
  status: null,
  config: null,
  roleConfig: null,
  realtimeToken: null,
  wsEndpoint: null,
  displayName: null,
  roleId: null,
  hasAnnouncedReady: false,
  iceServers: null,
  iceServersExpiresAt: null,
};

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // ===========================================================================
      // Derived State Helpers
      // ===========================================================================

      getParticipant: (id) => get().participants.get(id),

      getLocalParticipant: () => {
        const { localParticipantId, participants } = get();
        return localParticipantId
          ? participants.get(localParticipantId)
          : undefined;
      },

      getParticipantsList: () => Array.from(get().participants.values()),

      isLocalParticipant: (participantId) =>
        get().localParticipantId === participantId,

      // ===========================================================================
      // Session Actions
      // ===========================================================================

      setSession: (session) =>
        set((state) => {
          state.sessionId = session.id;
          state.session = session;
          state.status = session.status;
          state.config = session.config;
        }),

      setRoleConfig: (config) =>
        set((state) => {
          state.roleConfig = config;
        }),

      setLocalParticipantId: (id) =>
        set((state) => {
          state.localParticipantId = id;
        }),

      // ===========================================================================
      // Participant Actions
      // ===========================================================================

      addParticipant: (participant) =>
        set((state) => {
          state.participants.set(participant.id, participant);
        }),

      updateParticipant: (id, updates) =>
        set((state) => {
          const participant = state.participants.get(id);
          if (participant) {
            state.participants.set(id, { ...participant, ...updates });
          }
        }),

      removeParticipant: (id) =>
        set((state) => {
          state.participants.delete(id);
        }),

      setParticipants: (participants) =>
        set((state) => {
          state.participants.clear();
          for (const participant of participants) {
            state.participants.set(participant.id, participant);
          }
        }),

      updateParticipantMedia: (participantId, mediaState) =>
        set((state) => {
          const participant = state.participants.get(participantId);
          if (participant) {
            state.participants.set(participantId, {
              ...participant,
              mediaState: { ...participant.mediaState, ...mediaState },
            });
          }
        }),

      updateParticipantConnection: (participantId, connectionState) =>
        set((state) => {
          const participant = state.participants.get(participantId);
          if (participant) {
            state.participants.set(participantId, {
              ...participant,
              connectionState,
            });
          }
        }),

      // ===========================================================================
      // Credentials & Join Context
      // ===========================================================================

      setRealtimeCredentials: (token, wsEndpoint) =>
        set((state) => {
          state.realtimeToken = token;
          state.wsEndpoint = wsEndpoint;
        }),

      setJoinContext: (displayName, roleId) =>
        set((state) => {
          state.displayName = displayName;
          if (roleId) {
            state.roleId = roleId;
          }
        }),

      // ===========================================================================
      // Ready State Actions
      // ===========================================================================

      setHasAnnouncedReady: (value) =>
        set((state) => {
          state.hasAnnouncedReady = value;
        }),

      // ===========================================================================
      // ICE Servers
      // ===========================================================================

      setIceServers: (servers, expiresAt) =>
        set((state) => {
          state.iceServers = servers;
          state.iceServersExpiresAt = expiresAt;
        }),

      // ===========================================================================
      // Lifecycle
      // ===========================================================================

      reset: () =>
        set((state) => {
          Object.assign(state, initialState);
          state.participants = new Map();
        }),
    }))
  )
);

// =============================================================================
// Subscription Helpers for External Consumers
// =============================================================================

/**
 * Subscribe to participant changes
 */
export const subscribeToParticipants = (
  callback: (participants: Map<string, Participant>) => void
) => {
  return useSessionStore.subscribe(
    (state) => state.participants,
    (participants) => callback(participants)
  );
};

/**
 * Subscribe to session status changes
 */
export const subscribeToSessionStatus = (
  callback: (status: SessionStatus | null) => void
) => {
  return useSessionStore.subscribe(
    (state) => state.status,
    (status) => callback(status)
  );
};
