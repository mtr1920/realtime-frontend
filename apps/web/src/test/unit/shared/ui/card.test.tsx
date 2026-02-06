/**
 * Card Component Tests
 *
 * Tests for the Card primitive component and its crystalline variant,
 * including decorative sub-components (CardStripe, CardAccent, CardCorner).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardStripe,
  CardAccent,
  CardCorner,
  getStaggerDelay,
  STAGGER_DELAYS,
} from '@/shared/ui';

describe('Card', () => {
  describe('default variant', () => {
    it('renders with default styling', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('border-border');
    });

    it('renders children', () => {
      render(
        <Card>
          <span>Test content</span>
        </Card>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Card data-testid="card" className="custom-class">
          Content
        </Card>
      );

      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      let cardRef: HTMLDivElement | null = null;

      render(
        <Card
          ref={(el) => {
            cardRef = el;
          }}
          data-testid="card"
        >
          Content
        </Card>
      );

      expect(cardRef).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('crystalline variant', () => {
    it('renders with crystalline styling', () => {
      render(
        <Card variant="crystalline" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('group');
      expect(card).toHaveClass('relative');
      expect(card).toHaveClass('overflow-hidden');
    });

    it('applies tall variant', () => {
      render(
        <Card variant="crystalline" tall data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('min-h-[180px]');
    });

    it('applies status glow when hovered', () => {
      const status = {
        gradient: 'from-emerald-400 to-teal-500',
        glow: 'shadow-emerald-500/20',
      };

      render(
        <Card variant="crystalline" status={status} isHovered data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('shadow-emerald-500/20');
    });

    it('does not apply glow when not hovered', () => {
      const status = {
        gradient: 'from-emerald-400 to-teal-500',
        glow: 'shadow-emerald-500/20',
      };

      render(
        <Card variant="crystalline" status={status} isHovered={false} data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');

      expect(card).not.toHaveClass('shadow-emerald-500/20');
    });

    it('applies ring when showRing is true', () => {
      const status = {
        gradient: 'from-emerald-400 to-teal-500',
        ring: 'ring-emerald-400/30',
      };

      render(
        <Card variant="crystalline" status={status} showRing data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');

      expect(card).toHaveClass('ring-1');
      expect(card).toHaveClass('ring-emerald-400/30');
    });

    it('applies stagger animation delay', () => {
      render(
        <Card variant="crystalline" staggerIndex={2} data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');

      expect(card).toHaveStyle({ animationDelay: '100ms' });
      expect(card).toHaveStyle({ animationFillMode: 'backwards' });
    });

    it('cycles stagger delays for indices beyond 6', () => {
      render(
        <Card variant="crystalline" staggerIndex={7} data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');

      // Index 7 % 6 = 1, delay should be 50ms
      expect(card).toHaveStyle({ animationDelay: '50ms' });
    });
  });
});

describe('CardStripe', () => {
  it('renders with gradient', () => {
    render(
      <CardStripe gradient="from-emerald-400 to-teal-500" data-testid="stripe" />
    );
    const stripe = screen.getByTestId('stripe');

    expect(stripe).toBeInTheDocument();
    expect(stripe).toHaveClass('from-emerald-400');
    expect(stripe).toHaveClass('to-teal-500');
    expect(stripe).toHaveClass('bg-gradient-to-b');
  });

  it('has narrow width by default', () => {
    render(<CardStripe data-testid="stripe" />);
    const stripe = screen.getByTestId('stripe');

    expect(stripe).toHaveClass('w-1');
  });

  it('expands width when hovered', () => {
    render(<CardStripe isHovered data-testid="stripe" />);
    const stripe = screen.getByTestId('stripe');

    expect(stripe).toHaveClass('w-1.5');
    expect(stripe).not.toHaveClass('w-1');
  });

  it('is aria-hidden for accessibility', () => {
    render(<CardStripe data-testid="stripe" />);
    const stripe = screen.getByTestId('stripe');

    expect(stripe).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    render(<CardStripe className="custom-stripe" data-testid="stripe" />);
    const stripe = screen.getByTestId('stripe');

    expect(stripe).toHaveClass('custom-stripe');
  });
});

describe('CardAccent', () => {
  it('renders with gradient', () => {
    render(
      <CardAccent gradient="from-emerald-400 to-teal-500" data-testid="accent" />
    );
    const accent = screen.getByTestId('accent');

    expect(accent).toBeInTheDocument();
    expect(accent).toHaveClass('from-emerald-400');
    expect(accent).toHaveClass('to-teal-500');
    expect(accent).toHaveClass('bg-gradient-to-br');
  });

  it('has lower opacity by default', () => {
    render(<CardAccent data-testid="accent" />);
    const accent = screen.getByTestId('accent');

    expect(accent).toHaveClass('opacity-[0.08]');
  });

  it('increases opacity when hovered', () => {
    render(<CardAccent isHovered data-testid="accent" />);
    const accent = screen.getByTestId('accent');

    expect(accent).toHaveClass('opacity-[0.12]');
    expect(accent).not.toHaveClass('opacity-[0.08]');
  });

  it('is aria-hidden for accessibility', () => {
    render(<CardAccent data-testid="accent" />);
    const accent = screen.getByTestId('accent');

    expect(accent).toHaveAttribute('aria-hidden', 'true');
  });

  it('has clip-path for diagonal shape', () => {
    render(<CardAccent data-testid="accent" />);
    const accent = screen.getByTestId('accent');

    expect(accent).toHaveStyle({ clipPath: 'polygon(0 0, 100% 0, 0 100%)' });
  });
});

describe('CardCorner', () => {
  it('renders corner accent', () => {
    render(<CardCorner data-testid="corner" />);
    const corner = screen.getByTestId('corner');

    expect(corner).toBeInTheDocument();
  });

  it('is positioned bottom-right', () => {
    render(<CardCorner data-testid="corner" />);
    const corner = screen.getByTestId('corner');

    expect(corner).toHaveClass('absolute');
    expect(corner).toHaveClass('bottom-0');
    expect(corner).toHaveClass('right-0');
  });

  it('has clip-path for triangle shape', () => {
    render(<CardCorner data-testid="corner" />);
    const corner = screen.getByTestId('corner');

    expect(corner).toHaveStyle({
      clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
    });
  });

  it('is aria-hidden for accessibility', () => {
    render(<CardCorner data-testid="corner" />);
    const corner = screen.getByTestId('corner');

    expect(corner).toHaveAttribute('aria-hidden', 'true');
  });

  it('is non-interactive', () => {
    render(<CardCorner data-testid="corner" />);
    const corner = screen.getByTestId('corner');

    expect(corner).toHaveClass('pointer-events-none');
  });
});

describe('Card sub-components', () => {
  describe('CardHeader', () => {
    it('renders with correct padding', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');

      expect(header).toHaveClass('p-6');
    });

    it('applies flex layout', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');

      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3', () => {
      render(<CardTitle>Title</CardTitle>);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('applies font styling', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');

      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('tracking-tight');
    });
  });

  describe('CardDescription', () => {
    it('renders as paragraph', () => {
      render(<CardDescription>Description</CardDescription>);

      expect(screen.getByText('Description').tagName).toBe('P');
    });

    it('applies muted styling', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');

      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders with correct padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');

      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders with correct padding and layout', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');

      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
    });
  });
});

describe('getStaggerDelay', () => {
  it('returns correct delays for indices 0-5', () => {
    expect(getStaggerDelay(0)).toBe(0);
    expect(getStaggerDelay(1)).toBe(50);
    expect(getStaggerDelay(2)).toBe(100);
    expect(getStaggerDelay(3)).toBe(150);
    expect(getStaggerDelay(4)).toBe(200);
    expect(getStaggerDelay(5)).toBe(250);
  });

  it('cycles delays for indices beyond 5', () => {
    expect(getStaggerDelay(6)).toBe(0); // 6 % 6 = 0
    expect(getStaggerDelay(7)).toBe(50); // 7 % 6 = 1
    expect(getStaggerDelay(12)).toBe(0); // 12 % 6 = 0
  });
});

describe('STAGGER_DELAYS', () => {
  it('contains 6 delay values', () => {
    expect(STAGGER_DELAYS).toHaveLength(6);
  });

  it('contains expected delay values', () => {
    expect(STAGGER_DELAYS).toEqual([0, 50, 100, 150, 200, 250]);
  });
});

describe('Card composition pattern', () => {
  it('composes crystalline card with all sub-components', () => {
    const status = {
      gradient: 'from-emerald-400 to-teal-500',
      glow: 'shadow-emerald-500/20',
    };

    render(
      <Card variant="crystalline" status={status} staggerIndex={0} data-testid="card">
        <CardAccent gradient={status.gradient} data-testid="accent" />
        <CardStripe gradient={status.gradient} data-testid="stripe" />
        <CardContent data-testid="content">
          <CardHeader data-testid="header">
            <CardTitle>Test Card</CardTitle>
            <CardDescription>A test description</CardDescription>
          </CardHeader>
          <CardFooter data-testid="footer">Footer content</CardFooter>
        </CardContent>
        <CardCorner data-testid="corner" />
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('accent')).toBeInTheDocument();
    expect(screen.getByTestId('stripe')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('corner')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
  });
});
