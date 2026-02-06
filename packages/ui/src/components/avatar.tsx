import { forwardRef, useState, type ImgHTMLAttributes, type HTMLAttributes } from 'react';
import { User } from 'lucide-react';
import { cn } from '../utils';

const Avatar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    />
  )
);
Avatar.displayName = 'Avatar';

const AvatarImage = forwardRef<
  HTMLImageElement,
  ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt, ...props }, ref) => (
  <img
    ref={ref}
    alt={alt}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

/**
 * UserAvatar - Avatar with automatic user icon fallback
 * Shows image if src is valid, otherwise shows a user icon placeholder
 */
interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-16 w-16',
};

const iconSizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-8 w-8',
};

const textSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-lg',
};

function UserAvatar({ src, alt, fallback, className, size = 'md' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = src && !imageError;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {showImage ? (
        <AvatarImage
          src={src}
          alt={alt || 'User avatar'}
          onError={() => setImageError(true)}
        />
      ) : (
        <AvatarFallback className={textSizeClasses[size]}>
          {fallback ? (
            fallback
          ) : (
            <User className={cn(iconSizeClasses[size], 'text-muted-foreground')} />
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar };
