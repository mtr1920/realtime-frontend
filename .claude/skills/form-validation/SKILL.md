---
name: form-validation
description: Use when implementing forms, validation, or working with react-hook-form and Zod schemas
---

# Form Validation

React Hook Form with Zod schemas for type-safe form handling.

## Overview

This skill covers form patterns using react-hook-form, Zod schema validation, and integration with shadcn/ui form components.

---

## Basic Form Pattern

```typescript
// ✅ CORRECT - Form with Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui';

// 1. Define schema
const sessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  scheduledAt: z.date({ required_error: 'Date is required' }),
  duration: z.number().min(15).max(480),
  isRecordingEnabled: z.boolean().default(false),
});

type SessionFormData = z.infer<typeof sessionSchema>;

// 2. Create form component
export function SessionForm({ onSubmit }: { onSubmit: (data: SessionFormData) => void }) {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 60,
      isRecordingEnabled: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Session title" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this session.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRecordingEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Enable recording</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Session'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Schema Patterns

### Required vs Optional Fields

```typescript
// ✅ CORRECT - Clear required/optional distinction
const userSchema = z.object({
  // Required fields
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),

  // Optional fields
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),

  // Optional with default
  timezone: z.string().default('UTC'),

  // Nullable (can be null)
  avatarUrl: z.string().url().nullable(),
});
```

### Conditional Validation

```typescript
// ✅ CORRECT - Dependent field validation
const eventSchema = z.object({
  type: z.enum(['online', 'in-person']),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional(),
}).refine(
  (data) => {
    if (data.type === 'in-person' && !data.location) {
      return false;
    }
    if (data.type === 'online' && !data.meetingUrl) {
      return false;
    }
    return true;
  },
  {
    message: 'Location required for in-person, URL required for online',
    path: ['location'], // Error appears on location field
  }
);
```

### Password Confirmation

```typescript
// ✅ CORRECT - Password match validation
const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);
```

### Array Fields

```typescript
// ✅ CORRECT - Array with min/max items
const inviteSchema = z.object({
  emails: z
    .array(z.string().email('Invalid email'))
    .min(1, 'Add at least one email')
    .max(10, 'Maximum 10 invites at once'),
});
```

---

## Form State Management

### Loading and Errors

```typescript
// ✅ CORRECT - Form state handling
function CreateSessionForm() {
  const { create, isPending, error } = useCreateSession();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
  });

  const onSubmit = async (data: SessionFormData) => {
    try {
      await create(data);
      form.reset();
    } catch (error) {
      // Server validation errors
      if (isApiError(error) && error.isValidation()) {
        const fieldErrors = error.details as Record<string, string[]>;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof SessionFormData, {
            type: 'server',
            message: messages[0],
          });
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}

        {/* Global error */}
        {error && !form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create'}
        </Button>
      </form>
    </Form>
  );
}
```

### Form Reset

```typescript
// ✅ CORRECT - Reset form on success or cancel
function EditSessionForm({ session, onSuccess, onCancel }) {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: session.title,
      description: session.description ?? '',
    },
  });

  const handleCancel = () => {
    form.reset(); // Reset to defaultValues
    onCancel();
  };

  const onSubmit = async (data: SessionFormData) => {
    await updateSession(session.id, data);
    form.reset(data); // Reset dirty state with new values
    onSuccess();
  };

  return (
    <Form {...form}>
      {/* Form fields */}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          Save Changes
        </Button>
      </div>
    </Form>
  );
}
```

---

## Field Components

### Select Field

```typescript
// ✅ CORRECT - Select with FormField
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="owner">Owner</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Date Picker

```typescript
// ✅ CORRECT - Date picker with FormField
<FormField
  control={form.control}
  name="scheduledAt"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Date</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                'w-full pl-3 text-left font-normal',
                !field.value && 'text-muted-foreground'
              )}
            >
              {field.value ? (
                format(field.value, 'PPP')
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) => date < new Date()}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

```typescript
// ✅ CORRECT - Textarea with character count
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Describe this session..."
          className="resize-none"
          {...field}
        />
      </FormControl>
      <div className="flex justify-between">
        <FormDescription>Optional session description.</FormDescription>
        <span className="text-xs text-muted-foreground">
          {field.value?.length ?? 0}/500
        </span>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Dynamic Fields

### Array of Items

```typescript
// ✅ CORRECT - useFieldArray for dynamic lists
import { useFieldArray } from 'react-hook-form';

function InviteForm() {
  const form = useForm<{ emails: { value: string }[] }>({
    defaultValues: {
      emails: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'emails',
  });

  return (
    <Form {...form}>
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={form.control}
          name={`emails.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="email@example.com" {...field} />
                </FormControl>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ value: '' })}
        disabled={fields.length >= 10}
      >
        Add Email
      </Button>
    </Form>
  );
}
```

---

## Schema Export Pattern

```typescript
// ✅ CORRECT - Schema in separate file
// features/sessions/schemas/session.schema.ts
import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scheduledAt: z.date(),
  duration: z.number().min(15).max(480),
});

export const updateSessionSchema = createSessionSchema.partial();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// ✅ CORRECT - Import in component
import { createSessionSchema, type CreateSessionInput } from '../schemas/session.schema';
```

---

## FormDialog Pattern

```typescript
// ✅ CORRECT - Reusable form dialog
interface FormDialogProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
}

export function FormDialog<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  form,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
  children,
}: FormDialogProps<T>) {
  const handleSubmit = async (data: T) => {
    await onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {children}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Critical Rules

1. **Zod schemas in separate files** - reusable and testable
2. **Type inference from schema** - `z.infer<typeof schema>`
3. **zodResolver** - connect Zod to react-hook-form
4. **FormField wrapper** - for all controlled inputs
5. **Handle server errors** - map to field errors with `setError`
6. **Disable submit when invalid** - check `isSubmitting` and `isDirty`
7. **Reset on success** - `form.reset()` clears dirty state
8. **useFieldArray** - for dynamic lists of inputs

---

## Related Skills

- `api-service-patterns` - Form submission
- `error-handling` - Server validation errors
- `ui-component-patterns` - Form components
