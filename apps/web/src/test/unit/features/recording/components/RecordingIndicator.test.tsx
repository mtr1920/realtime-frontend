/**
 * RecordingIndicator Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecordingIndicator } from '@/features/recording/components/RecordingIndicator';
import type { RecordingStatus } from '@/features/recording/types/recording.types';

// Mock useRecordingStatus hook
const mockRecordingStatus: {
  isRecording: boolean;
  isRecordingInProgress: boolean;
  formattedDuration: string;
  status: RecordingStatus;
} = {
  isRecording: false,
  isRecordingInProgress: false,
  formattedDuration: '00:00',
  status: 'idle',
};

vi.mock('@/features/recording/hooks/useRecordingStatus', () => ({
  useRecordingStatus: () => mockRecordingStatus,
}));

// Mock useReducedMotion hook
let mockPrefersReducedMotion = false;
vi.mock('@/shared/theme/useReducedMotion', () => ({
  useReducedMotion: () => mockPrefersReducedMotion,
}));

describe('RecordingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordingStatus.isRecording = false;
    mockRecordingStatus.isRecordingInProgress = false;
    mockRecordingStatus.formattedDuration = '00:00';
    mockRecordingStatus.status = 'idle';
    mockPrefersReducedMotion = false;
  });

  describe('visibility', () => {
    it('should not render when not recording', () => {
      mockRecordingStatus.isRecordingInProgress = false;

      const { container } = render(<RecordingIndicator />);

      expect(container.firstChild).toBeNull();
    });

    it('should render when recording is in progress', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      render(<RecordingIndicator />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render when recording is starting', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = false;
      mockRecordingStatus.status = 'pending';

      render(<RecordingIndicator />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('status text', () => {
    it('should show "Starting..." when status is starting', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.status = 'pending';
      mockRecordingStatus.isRecording = false;

      render(<RecordingIndicator />);

      expect(screen.getByText('Starting...')).toBeInTheDocument();
    });

    it('should show "REC" when recording', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      render(<RecordingIndicator />);

      expect(screen.getByText('REC')).toBeInTheDocument();
    });
  });

  describe('duration display', () => {
    it('should show duration when showDuration is true and recording', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockRecordingStatus.formattedDuration = '02:35';

      render(<RecordingIndicator showDuration={true} />);

      expect(screen.getByText('02:35')).toBeInTheDocument();
    });

    it('should show duration by default', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockRecordingStatus.formattedDuration = '01:00';

      render(<RecordingIndicator />);

      expect(screen.getByText('01:00')).toBeInTheDocument();
    });

    it('should hide duration when showDuration is false', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockRecordingStatus.formattedDuration = '02:35';

      render(<RecordingIndicator showDuration={false} />);

      expect(screen.queryByText('02:35')).not.toBeInTheDocument();
    });

    it('should not show duration when starting', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = false;
      mockRecordingStatus.status = 'pending';
      mockRecordingStatus.formattedDuration = '00:00';

      render(<RecordingIndicator showDuration={true} />);

      expect(screen.queryByText('00:00')).not.toBeInTheDocument();
    });
  });

  describe('pulsing animation', () => {
    it('should show pulsing animation when recording and reduced motion is off', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockPrefersReducedMotion = false;

      const { container } = render(<RecordingIndicator />);

      const pulseElement = container.querySelector('.motion-safe\\:animate-ping');
      expect(pulseElement).toBeInTheDocument();
    });

    it('should not show pulsing animation when reduced motion is preferred', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockPrefersReducedMotion = true;

      const { container } = render(<RecordingIndicator />);

      const pulseElement = container.querySelector('.motion-safe\\:animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('should not show pulsing animation when starting', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = false;
      mockRecordingStatus.status = 'pending';
      mockPrefersReducedMotion = false;

      const { container } = render(<RecordingIndicator />);

      const pulseElement = container.querySelector('.motion-safe\\:animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="status" for screen readers', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      render(<RecordingIndicator />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      render(<RecordingIndicator />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have descriptive aria-label when recording', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockRecordingStatus.formattedDuration = '05:30';

      render(<RecordingIndicator />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute(
        'aria-label',
        'Recording in progress, duration 05:30'
      );
    });

    it('should have descriptive aria-label when starting', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = false;
      mockRecordingStatus.status = 'pending';

      render(<RecordingIndicator />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Recording starting');
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      render(<RecordingIndicator className="custom-class" />);

      const status = screen.getByRole('status');
      expect(status).toHaveClass('custom-class');
    });

    it('should have red styling', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      render(<RecordingIndicator />);

      const status = screen.getByRole('status');
      expect(status).toHaveClass('text-red-600');
    });

    it('should have rounded pill shape', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      render(<RecordingIndicator />);

      const status = screen.getByRole('status');
      expect(status).toHaveClass('rounded-full');
    });
  });

  describe('red dot indicator', () => {
    it('should render red dot when recording', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';

      const { container } = render(<RecordingIndicator />);

      // The solid red dot should be present
      const redDot = container.querySelector('.text-red-500');
      expect(redDot).toBeInTheDocument();
    });

    it('should render lighter red dot when starting', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = false;
      mockRecordingStatus.status = 'pending';

      const { container } = render(<RecordingIndicator />);

      const redDot = container.querySelector('.text-red-400');
      expect(redDot).toBeInTheDocument();
    });
  });

  describe('duration format', () => {
    it('should display MM:SS format', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockRecordingStatus.formattedDuration = '12:45';

      render(<RecordingIndicator />);

      expect(screen.getByText('12:45')).toBeInTheDocument();
    });

    it('should display HH:MM:SS format for long recordings', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockRecordingStatus.formattedDuration = '01:23:45';

      render(<RecordingIndicator />);

      expect(screen.getByText('01:23:45')).toBeInTheDocument();
    });

    it('should have tabular-nums class for consistent spacing', () => {
      mockRecordingStatus.isRecordingInProgress = true;
      mockRecordingStatus.isRecording = true;
      mockRecordingStatus.status = 'recording';
      mockRecordingStatus.formattedDuration = '00:30';

      const { container } = render(<RecordingIndicator />);

      const duration = container.querySelector('.tabular-nums');
      expect(duration).toBeInTheDocument();
    });
  });
});
