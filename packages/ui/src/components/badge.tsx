import { forwardRef, type HTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-success text-success-foreground shadow hover:bg-success/80',
        warning:
          'border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type BadgeDivProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants> & {
    asButton?: false;
  };

type BadgeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> &
  VariantProps<typeof badgeVariants> & {
    asButton: true;
    className?: string;
  };

export type BadgeProps = BadgeDivProps | BadgeButtonProps;

const Badge = forwardRef<HTMLDivElement | HTMLButtonElement, BadgeProps>(
  (props, ref) => {
    if (props.asButton) {
      const { className, variant, asButton: _, ...buttonProps } = props;
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={cn(
            badgeVariants({ variant }),
            'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          {...buttonProps}
        />
      );
    }

    const { className, variant, asButton: _, ...divProps } = props;
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(badgeVariants({ variant }), className)}
        {...divProps}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
