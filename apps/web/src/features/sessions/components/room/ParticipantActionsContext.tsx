/**
 * ParticipantActionsContext
 *
 * Context for participant action callbacks (pin, message).
 * Avoids prop drilling through ParticipantList to ParticipantItem.
 */

import { createContext, useContext, type ReactNode } from 'react';

interface ParticipantActions {
  /** Called when a participant is pinned */
  onPin?: (participantId: string) => void;

  /** Called when messaging a participant */
  onMessage?: (participantId: string) => void;
}

const ParticipantActionsContext = createContext<ParticipantActions>({});

interface ParticipantActionsProviderProps extends ParticipantActions {
  children: ReactNode;
}

/**
 * Provider for participant action callbacks.
 * Wrap ParticipantList content with this provider.
 *
 * @example
 * ```tsx
 * <ParticipantActionsProvider onPin={handlePin} onMessage={handleMessage}>
 *   <ParticipantItem participant={participant} />
 * </ParticipantActionsProvider>
 * ```
 */
export function ParticipantActionsProvider({
  children,
  onPin,
  onMessage,
}: ParticipantActionsProviderProps) {
  return (
    <ParticipantActionsContext.Provider value={{ onPin, onMessage }}>
      {children}
    </ParticipantActionsContext.Provider>
  );
}

/**
 * Hook to access participant action callbacks.
 *
 * @example
 * ```tsx
 * function ParticipantItem({ participant }: Props) {
 *   const { onPin, onMessage } = useParticipantActions();
 *
 *   return (
 *     <div>
 *       {onPin && <button onClick={() => onPin(participant.id)}>Pin</button>}
 *       {onMessage && <button onClick={() => onMessage(participant.id)}>Message</button>}
 *     </div>
 *   );
 * }
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useParticipantActions(): ParticipantActions {
  return useContext(ParticipantActionsContext);
}
