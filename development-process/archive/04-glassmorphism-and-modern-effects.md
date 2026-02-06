---
title: "4. Glassmorphism & Modern Effects"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 4. Glassmorphism & Modern Effects

### 4.1 Glass Utility Classes

```css
/* css/glassmorphism.css */

/* Base glass effect */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

/* Light mode glass variables */
:root {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-blur: 12px;
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Dark mode glass variables */
.dark {
  --glass-bg: rgba(15, 23, 42, 0.7);
  --glass-blur: 12px;
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Glass variants */
.glass-subtle {
  --glass-bg: rgba(255, 255, 255, 0.4);
  --glass-blur: 8px;
}

.dark .glass-subtle {
  --glass-bg: rgba(15, 23, 42, 0.4);
}

.glass-strong {
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-blur: 20px;
}

.dark .glass-strong {
  --glass-bg: rgba(15, 23, 42, 0.85);
}

/* Glass card component */
.glass-card {
  @apply glass rounded-xl p-6;
}

/* Glass modal backdrop */
.glass-modal {
  @apply glass rounded-2xl;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

/* Glass navbar */
.glass-nav {
  @apply glass;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border-bottom: 1px solid var(--glass-border);
}

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(12px)) {
  .glass {
    background: var(--bg-primary);
    opacity: 0.95;
  }
}
```

### 4.2 Animation System with Framer Motion

```typescript
// motion/variants.ts
import { Variants, Transition } from 'framer-motion';

// Default transition for most animations
export const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

// Fade in/out
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Slide up with fade
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 }
  },
};

// Scale with fade (for modals, dialogs)
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  },
};

// Stagger children
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

// Video tile animations
export const videoTileVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
  speaking: {
    scale: 1.02,
    boxShadow: '0 0 0 3px var(--brand-primary)',
    transition: { duration: 0.2 },
  },
};

// AI status indicator pulse
export const pulseVariants: Variants = {
  idle: { scale: 1, opacity: 0.5 },
  listening: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  speaking: {
    scale: [1, 1.15, 1],
    opacity: 1,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
```

### 4.3 Animation Provider with Reduced Motion

```typescript
// motion/AnimationProvider.tsx
import { createContext, useContext, useMemo } from 'react';
import { Variants } from 'framer-motion';
import { useTheme } from '@/theme/ThemeProvider';
import * as variants from './variants';

interface AnimationContextValue {
  // All variants, automatically disabled if reduced motion
  fadeVariants: Variants;
  slideUpVariants: Variants;
  scaleVariants: Variants;
  staggerContainerVariants: Variants;
  staggerItemVariants: Variants;
  videoTileVariants: Variants;
  pulseVariants: Variants;
  // Helper to check if animations enabled
  animationsEnabled: boolean;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

// No-op variants for reduced motion
const noOpVariants: Variants = {
  hidden: {},
  visible: {},
  exit: {},
};

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const { isReducedMotion } = useTheme();

  const value = useMemo<AnimationContextValue>(() => {
    if (isReducedMotion) {
      return {
        fadeVariants: noOpVariants,
        slideUpVariants: noOpVariants,
        scaleVariants: noOpVariants,
        staggerContainerVariants: noOpVariants,
        staggerItemVariants: noOpVariants,
        videoTileVariants: noOpVariants,
        pulseVariants: noOpVariants,
        animationsEnabled: false,
      };
    }

    return {
      ...variants,
      animationsEnabled: true,
    };
  }, [isReducedMotion]);

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimations() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimations must be used within an AnimationProvider');
  }
  return context;
}
```

### 4.4 Animated Components Example

```typescript
// components/AnimatedCard.tsx
import { motion } from 'framer-motion';
import { useAnimations } from '@/motion/AnimationProvider';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedCardProps) {
  const { slideUpVariants, animationsEnabled } = useAnimations();

  return (
    <motion.div
      className={cn('glass-card', className)}
      variants={slideUpVariants}
      initial={animationsEnabled ? 'hidden' : false}
      animate="visible"
      exit="exit"
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

// components/AnimatedList.tsx
export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}) {
  const { staggerContainerVariants, staggerItemVariants, animationsEnabled } = useAnimations();

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial={animationsEnabled ? 'hidden' : false}
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.div
          key={keyExtractor(item)}
          variants={staggerItemVariants}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 4.5 Accessibility Features

```css
/* css/accessibility.css */

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--bg-brand);
  color: var(--fg-inverse);
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}

/* Focus ring utilities */
.focus-ring {
  outline: none;
}

.focus-ring:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* High contrast mode overrides */
.high-contrast {
  /* Force maximum contrast */
  --bg-primary: #000000;
  --fg-primary: #ffffff;
  --bg-secondary: #1a1a1a;
  --fg-secondary: #e5e5e5;
  --border-primary: #ffffff;
  --border-focus: #ffff00;

  /* Disable glass effects in high contrast */
  --glass-bg: rgba(0, 0, 0, 0.95);
  --glass-border: #ffffff;
}

.high-contrast .glass {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* Minimum touch target size (44x44px) */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Reduced motion - disable all animations */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

### 4.6 Modern UI Component Examples

```typescript
// components/ui/GlassModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimations } from '@/motion/AnimationProvider';
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function GlassModal({ isOpen, onClose, title, children }: GlassModalProps) {
  const { scaleVariants, fadeVariants } = useAnimations();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={scaleVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="glass-modal w-full max-w-lg p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors focus-ring"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div>{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---
