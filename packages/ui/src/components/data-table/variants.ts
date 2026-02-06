/**
 * DataTable Variants
 *
 * CVA styling variants for table components.
 * Minimal, professional design following the visual specifications.
 */

import { cva } from 'class-variance-authority';

// ============================================================================
// Container
// ============================================================================

export const tableContainerVariants = cva(
  'rounded-lg ring-1 ring-border/50 shadow-sm overflow-hidden bg-card'
);

// ============================================================================
// Table Row
// ============================================================================

export const tableRowVariants = cva(
  'border-b border-border/40 transition-colors',
  {
    variants: {
      density: {
        compact: 'text-xs',
        default: 'text-sm',
        comfortable: 'text-sm',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-muted/30',
        false: '',
      },
      striped: {
        true: '',
        false: '',
      },
      selected: {
        true: 'bg-primary/5 border-l-2 border-l-primary',
        false: '',
      },
      status: {
        default: '',
        success: 'bg-success/5 border-l-2 border-l-success',
        warning: 'bg-warning/5 border-l-2 border-l-warning',
        error: 'bg-destructive/5 border-l-2 border-l-destructive',
        info: 'bg-primary/5 border-l-2 border-l-primary',
      },
    },
    compoundVariants: [
      {
        striped: true,
        selected: false,
        status: 'default',
        className: 'even:bg-muted/20',
      },
    ],
    defaultVariants: {
      density: 'default',
      interactive: false,
      striped: false,
      selected: false,
      status: 'default',
    },
  }
);

// ============================================================================
// Table Cell
// ============================================================================

export const tableCellVariants = cva('align-middle', {
  variants: {
    density: {
      compact: 'px-3 py-1',
      default: 'px-4 py-2',
      comfortable: 'px-5 py-3',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    density: 'default',
    align: 'left',
  },
});

// ============================================================================
// Table Header
// ============================================================================

export const tableHeadVariants = cva(
  'font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide border-b border-border/60',
  {
    variants: {
      density: {
        compact: 'px-3 py-2 text-[11px] tracking-wider',
        default: 'px-4 py-3 text-xs',
        comfortable: 'px-5 py-4 text-xs',
      },
      sortable: {
        true: 'cursor-pointer hover:text-foreground select-none',
        false: '',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      density: 'default',
      sortable: false,
      align: 'left',
    },
  }
);

// ============================================================================
// Content Typography
// ============================================================================

export const cellContentVariants = cva('', {
  variants: {
    type: {
      /** Primary content - names, titles */
      primary: 'font-medium text-foreground',
      /** Secondary content - descriptions, metadata */
      secondary: 'text-muted-foreground',
      /** Monospace content - IDs, keys, codes */
      mono: 'font-mono text-xs tabular-nums bg-muted/50 px-1.5 py-0.5 rounded',
      /** Numeric content */
      numeric: 'font-mono tabular-nums text-foreground',
      /** Timestamp content */
      timestamp: 'text-xs text-muted-foreground tabular-nums',
    },
  },
  defaultVariants: {
    type: 'secondary',
  },
});

// ============================================================================
// Empty & Loading States
// ============================================================================

export const emptyStateVariants = cva(
  'flex flex-col items-center justify-center py-16 text-center'
);

export const emptyIconVariants = cva('text-muted-foreground/40 h-10 w-10 mb-4');

export const emptyTitleVariants = cva('text-base font-medium text-foreground mb-1');

export const emptyDescriptionVariants = cva('text-sm text-muted-foreground');

export const loadingSkeletonVariants = cva('animate-pulse bg-muted rounded h-4');

// ============================================================================
// Toolbar
// ============================================================================

export const toolbarVariants = cva(
  'flex items-center justify-between gap-4 px-4 py-3 border-b border-border/40'
);

export const toolbarLeftVariants = cva('flex items-center gap-2');

export const toolbarRightVariants = cva('flex items-center gap-2');

// ============================================================================
// Pagination
// ============================================================================

export const paginationVariants = cva(
  'flex items-center justify-between gap-4 px-4 py-3 border-t border-border/40'
);

export const paginationInfoVariants = cva('text-sm text-muted-foreground');

export const paginationControlsVariants = cva('flex items-center gap-1');

// ============================================================================
// Action Variants
// ============================================================================

/**
 * Action menu item color variants
 * Used for dropdown menu items in RowActionsMenu
 * Uses semantic color tokens from the theme system
 */
export const actionMenuItemVariants = cva('', {
  variants: {
    variant: {
      default: '',
      primary: 'text-primary focus:text-primary',
      secondary: 'text-muted-foreground focus:text-muted-foreground',
      success: 'text-success focus:text-success',
      warning: 'text-warning focus:text-warning',
      destructive: 'text-destructive focus:text-destructive',
      info: 'text-primary focus:text-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Inline action button variants
 * Used for InlineActions component
 * Uses semantic color tokens from the theme system
 */
export const inlineActionButtonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'text-foreground hover:bg-muted',
        primary: 'text-primary hover:bg-primary/10',
        secondary: 'text-muted-foreground hover:bg-muted',
        success: 'text-success hover:bg-success/10',
        warning: 'text-warning hover:bg-warning/10',
        destructive: 'text-destructive hover:bg-destructive/10',
        info: 'text-primary hover:bg-primary/10',
      },
      size: {
        sm: 'h-7 px-2 text-xs',
        md: 'h-8 px-2.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

// ============================================================================
// Bulk Actions Bar
// ============================================================================

/**
 * Bulk actions bar container
 * Uses semantic color tokens from the theme system
 */
export const bulkActionsBarVariants = cva(
  'flex items-center justify-between gap-4 px-4 py-3 bg-accent border-b border-border'
);

export const bulkActionsInfoVariants = cva('text-sm font-medium text-accent-foreground');

export const bulkActionsControlsVariants = cva('flex items-center gap-2');
