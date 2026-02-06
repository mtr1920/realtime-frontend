import { Toaster as Sonner } from 'sonner';
import { zIndexTokens } from '@realtime/ui/themes';
import { useThemeContext } from '@/shared/theme/useThemeContext';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast notification container.
 * Uses sonner for toast management with theme-aware styling.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useThemeContext();

  return (
    <Sonner
      theme={resolvedTheme as 'light' | 'dark'}
      position="top-right"
      richColors
      closeButton
      visibleToasts={3}
      gap={8}
      toastOptions={{
        className: 'shadow-lg',
        duration: 4000,
      }}
      style={{ zIndex: zIndexTokens.maximum }}
      {...props}
    />
  );
};

export { Toaster };
