/**
 * FormField Component
 *
 * Composable form field wrapper with label, description, and error display.
 * Works standalone or with react-hook-form.
 */

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ReactNode,
  type HTMLAttributes,
  type ComponentPropsWithoutRef,
} from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Label } from '../label';
import { cn } from '../../utils';

// ============================================================================
// Context
// ============================================================================

interface FormFieldContextValue {
  id: string;
  name?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | undefined>(
  undefined
);

function useFormFieldContext() {
  return useContext(FormFieldContext);
}

// ============================================================================
// FormField Root
// ============================================================================

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Field name for form integration */
  name?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Whether the field is disabled */
  isDisabled?: boolean;
  /** Children */
  children: ReactNode;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    { name, error, isRequired, isDisabled, className, children, ...props },
    ref
  ) => {
    const id = useId();

    return (
      <FormFieldContext.Provider
        value={{ id, name, error, isRequired, isDisabled }}
      >
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {children}
        </div>
      </FormFieldContext.Provider>
    );
  }
);
FormField.displayName = 'FormField';

// ============================================================================
// FormFieldLabel
// ============================================================================

export interface FormFieldLabelProps
  extends ComponentPropsWithoutRef<typeof Label> {
  /** Show required indicator */
  showRequired?: boolean;
}

export const FormFieldLabel = forwardRef<
  HTMLLabelElement,
  FormFieldLabelProps
>(({ className, showRequired = true, children, ...props }, ref) => {
  const context = useFormFieldContext();
  const isRequired = context?.isRequired;

  return (
    <Label
      ref={ref}
      htmlFor={context?.id}
      className={cn(
        context?.error && 'text-destructive',
        context?.isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {children}
      {showRequired && isRequired && (
        <span className="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </Label>
  );
});
FormFieldLabel.displayName = 'FormFieldLabel';

// ============================================================================
// FormFieldDescription
// ============================================================================

export interface FormFieldDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {}

export const FormFieldDescription = forwardRef<
  HTMLParagraphElement,
  FormFieldDescriptionProps
>(({ className, ...props }, ref) => {
  const context = useFormFieldContext();

  return (
    <p
      ref={ref}
      id={context?.id ? `${context.id}-description` : undefined}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
FormFieldDescription.displayName = 'FormFieldDescription';

// ============================================================================
// FormFieldError
// ============================================================================

export interface FormFieldErrorProps
  extends HTMLAttributes<HTMLParagraphElement> {
  /** Custom error message (overrides context error) */
  message?: string;
}

export const FormFieldError = forwardRef<
  HTMLParagraphElement,
  FormFieldErrorProps
>(({ className, message, children, ...props }, ref) => {
  const context = useFormFieldContext();
  const errorMessage = message ?? context?.error;

  if (!errorMessage && !children) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={context?.id ? `${context.id}-error` : undefined}
      className={cn('text-sm font-medium text-destructive', className)}
      role="alert"
      {...props}
    >
      {children ?? errorMessage}
    </p>
  );
});
FormFieldError.displayName = 'FormFieldError';

// ============================================================================
// FormFieldControl
// ============================================================================

export interface FormFieldControlProps
  extends ComponentPropsWithoutRef<typeof Slot> {}

export const FormFieldControl = forwardRef<
  HTMLElement,
  FormFieldControlProps
>(({ ...props }, ref) => {
  const context = useFormFieldContext();

  const ariaDescribedBy = [
    context?.id ? `${context.id}-description` : undefined,
    context?.error && context?.id ? `${context.id}-error` : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Slot
      ref={ref}
      id={context?.id}
      aria-invalid={!!context?.error}
      aria-describedby={ariaDescribedBy || undefined}
      aria-required={context?.isRequired}
      {...props}
    />
  );
});
FormFieldControl.displayName = 'FormFieldControl';

// ============================================================================
// Compound Export
// ============================================================================

export const Form = {
  Field: FormField,
  Label: FormFieldLabel,
  Description: FormFieldDescription,
  Error: FormFieldError,
  Control: FormFieldControl,
};
