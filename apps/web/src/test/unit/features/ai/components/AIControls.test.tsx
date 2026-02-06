/**
 * AIControls Component Tests
 * Tests for AI interaction controls including permission checks and keyboard handling.
 *
 * Note: AIControls uses usePermissions which uses useCurrentUser.
 * We mock useCurrentUser to avoid needing full query infrastructure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIControls } from '@/features/ai/components/AIControls';
import {
  resetAuthStore,
  setAuthenticated,
  createMockUser,
  getMockCurrentUserState,
  setMockCurrentUser,
  resetMockCurrentUser,
} from '@/features/auth/test/auth-test-utils';

// Mock useCurrentUser using centralized helper
vi.mock('@/shared/hooks/useCurrentUser', () => ({
  useCurrentUser: () => getMockCurrentUserState(),
}));

// Default props for AIControls
const defaultProps = {
  state: 'ready' as const,
  inputMode: 'push_to_talk' as const,
  isUserSpeaking: false,
  isAISpeaking: false,
  audioLevel: 0,
  onStartSpeaking: vi.fn(),
  onStopSpeaking: vi.fn(),
  onInterrupt: vi.fn(),
};

describe('AIControls', () => {
  beforeEach(() => {
    resetAuthStore();
    resetMockCurrentUser();
    vi.clearAllMocks();
  });

  describe('permission checks', () => {
    it('disables controls when canUseAI permission is false', () => {
      // VIEWER role does not have canUseAI permission (requires MEMBER)
      setMockCurrentUser(createMockUser('VIEWER'));
      setAuthenticated('VIEWER');

      render(<AIControls {...defaultProps} />);

      // The push-to-talk button should be disabled
      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toBeDisabled();
    });

    it('enables controls when canUseAI permission is true', () => {
      // MEMBER role has canUseAI permission
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(<AIControls {...defaultProps} />);

      // The push-to-talk button should be enabled
      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).not.toBeDisabled();
    });

    it('enables controls for ADMIN role', () => {
      setMockCurrentUser(createMockUser('ADMIN'));
      setAuthenticated('ADMIN');

      render(<AIControls {...defaultProps} />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).not.toBeDisabled();
    });

    it('enables controls for OWNER role', () => {
      setMockCurrentUser(createMockUser('OWNER'));
      setAuthenticated('OWNER');

      render(<AIControls {...defaultProps} />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).not.toBeDisabled();
    });

    it('disables controls when unauthenticated', () => {
      // No authentication set (resetAuthStore was called)
      render(<AIControls {...defaultProps} />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toBeDisabled();
    });
  });

  describe('keyboard handling', () => {
    it('space key does not trigger PTT when typing in input', async () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onStartSpeaking = vi.fn();

      // Render AIControls with an input field in the same document
      render(
        <div>
          <input data-testid="text-input" type="text" />
          <AIControls {...defaultProps} onStartSpeaking={onStartSpeaking} />
        </div>
      );

      // Focus the input field
      const input = screen.getByTestId('text-input');
      input.focus();

      // Press space while focused on input
      fireEvent.keyDown(input, { code: 'Space' });

      // onStartSpeaking should NOT be called
      expect(onStartSpeaking).not.toHaveBeenCalled();
    });

    it('space key does not trigger PTT when typing in textarea', async () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onStartSpeaking = vi.fn();

      render(
        <div>
          <textarea data-testid="text-area" />
          <AIControls {...defaultProps} onStartSpeaking={onStartSpeaking} />
        </div>
      );

      const textarea = screen.getByTestId('text-area');
      textarea.focus();

      fireEvent.keyDown(textarea, { code: 'Space' });

      expect(onStartSpeaking).not.toHaveBeenCalled();
    });

    it('space key does not trigger PTT when typing in contentEditable element', async () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onStartSpeaking = vi.fn();

      render(
        <div>
          <div data-testid="editable" contentEditable="true" />
          <AIControls {...defaultProps} onStartSpeaking={onStartSpeaking} />
        </div>
      );

      const editable = screen.getByTestId('editable');
      editable.focus();

      fireEvent.keyDown(editable, { code: 'Space' });

      expect(onStartSpeaking).not.toHaveBeenCalled();
    });

    it('space key triggers PTT when focused on non-text elements', async () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onStartSpeaking = vi.fn();

      render(
        <div>
          <button data-testid="other-button">Other Button</button>
          <AIControls {...defaultProps} onStartSpeaking={onStartSpeaking} />
        </div>
      );

      // Focus a non-text element
      const button = screen.getByTestId('other-button');
      button.focus();

      // Press space while focused on button
      fireEvent.keyDown(button, { code: 'Space' });

      // onStartSpeaking should be called
      expect(onStartSpeaking).toHaveBeenCalled();
    });

    it('space key triggers PTT when no element is focused (document body)', async () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onStartSpeaking = vi.fn();

      render(<AIControls {...defaultProps} onStartSpeaking={onStartSpeaking} />);

      // Fire keydown on document body (simulating global key press)
      fireEvent.keyDown(document.body, { code: 'Space' });

      expect(onStartSpeaking).toHaveBeenCalled();
    });
  });

  describe('state-based disabled behavior', () => {
    it('disables controls in idle state even with permission', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(<AIControls {...defaultProps} state="idle" />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toBeDisabled();
    });

    it('disables controls in starting state', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(<AIControls {...defaultProps} state="starting" />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toBeDisabled();
    });

    it('disables controls in error state', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(<AIControls {...defaultProps} state="error" />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toBeDisabled();
    });

    it('disables speaking when AI is speaking', () => {
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');

      render(<AIControls {...defaultProps} isAISpeaking={true} />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      expect(pttButton).toBeDisabled();
    });
  });

  describe('push-to-talk interaction', () => {
    it('calls onStartSpeaking on mouse down', async () => {
      const user = userEvent.setup();
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onStartSpeaking = vi.fn();

      render(<AIControls {...defaultProps} onStartSpeaking={onStartSpeaking} />);

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });
      await user.pointer({ keys: '[MouseLeft>]', target: pttButton });

      expect(onStartSpeaking).toHaveBeenCalled();
    });

    it('calls onStopSpeaking on mouse up', async () => {
      const user = userEvent.setup();
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onStartSpeaking = vi.fn();
      const onStopSpeaking = vi.fn();

      render(
        <AIControls
          {...defaultProps}
          onStartSpeaking={onStartSpeaking}
          onStopSpeaking={onStopSpeaking}
        />
      );

      const pttButton = screen.getByRole('button', { name: /hold to speak/i });

      // Mouse down then mouse up
      await user.pointer({ keys: '[MouseLeft>]', target: pttButton });
      await user.pointer({ keys: '[/MouseLeft]', target: pttButton });

      expect(onStartSpeaking).toHaveBeenCalled();
      expect(onStopSpeaking).toHaveBeenCalled();
    });

    it('calls onInterrupt when AI is speaking and interrupt button is clicked', async () => {
      const user = userEvent.setup();
      setMockCurrentUser(createMockUser('MEMBER'));
      setAuthenticated('MEMBER');
      const onInterrupt = vi.fn();

      render(
        <AIControls {...defaultProps} isAISpeaking={true} onInterrupt={onInterrupt} />
      );

      const interruptButton = screen.getByRole('button', { name: /interrupt ai/i });
      await user.click(interruptButton);

      expect(onInterrupt).toHaveBeenCalled();
    });
  });
});
