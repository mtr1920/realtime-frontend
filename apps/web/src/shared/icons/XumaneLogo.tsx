import { cn } from '@/shared/lib/utils';

interface XumaneLogoProps {
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

/**
 * Xumane Logo component with optional futuristic animation effects.
 * Used as the app logo and animated loader.
 */
export function XumaneLogo({
  className,
  animated = false,
  size = 'md',
}: XumaneLogoProps) {
  const uniqueId = `xumane-gradient-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={cn('relative', animated && 'xumane-logo-container')}>
      {/* Glow effect layer */}
      {animated && (
        <div
          className={cn(
            'absolute inset-0 rounded-lg blur-xl opacity-50',
            'bg-gradient-to-br from-[#0063ff] via-[#8200ff] to-[#d000ff]',
            'motion-safe:animate-pulse'
          )}
          style={{ animationDuration: '2s' }}
        />
      )}

      <svg
        viewBox="0 0 32 32"
        className={cn(
          sizeClasses[size],
          'relative z-10',
          animated && 'xumane-logo-animated',
          className
        )}
        aria-hidden="true"
      >
        <defs>
          {/* Animated gradient */}
          <linearGradient
            id={uniqueId}
            x1="16.06"
            y1="26.94"
            x2="16.06"
            y2="5.06"
            gradientUnits="userSpaceOnUse"
          >
            {animated ? (
              <>
                <stop offset="0" stopColor="#d000ff">
                  <animate
                    attributeName="stop-color"
                    values="#d000ff;#0063ff;#8200ff;#d000ff"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="0.5" stopColor="#8200ff">
                  <animate
                    attributeName="stop-color"
                    values="#8200ff;#d000ff;#0063ff;#8200ff"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="1" stopColor="#0063ff">
                  <animate
                    attributeName="stop-color"
                    values="#0063ff;#8200ff;#d000ff;#0063ff"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#d000ff" />
                <stop offset="0.29" stopColor="#8200ff" />
                <stop offset="1" stopColor="#0063ff" />
              </>
            )}
          </linearGradient>

          {/* Glow filter for animated state */}
          {animated && (
            <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background */}
        <rect
          width="32"
          height="32"
          rx="5"
          ry="5"
          fill="currentColor"
          className="text-foreground dark:text-background"
        />

        <g filter={animated ? `url(#${uniqueId}-glow)` : undefined}>
          {/* White X paths */}
          <path
            d="M12.46,17.08l-8.61,14.92h5.82l5.7-9.88-2.91-5.04ZM22.33,0l-5.64,9.78,2.92,5.05L28.15,0h-5.82Z"
            fill="white"
            className={cn(animated && 'xumane-x-paths')}
          >
            {animated && (
              <animate
                attributeName="opacity"
                values="1;0.7;1"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </path>

          {/* Gradient polygon - center stripe */}
          <polygon
            points="26.59 26.94 18.15 26.94 5.52 5.06 13.96 5.06 26.59 26.94"
            fill={`url(#${uniqueId})`}
            className={cn(animated && 'xumane-gradient-stripe')}
          >
            {animated && (
              <>
                <animate
                  attributeName="opacity"
                  values="1;0.85;1"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0;0.3,-0.3;0,0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </polygon>
        </g>

        {/* Energy particles (animated only) */}
        {animated && (
          <g className="xumane-particles">
            <circle cx="8" cy="12" r="0.5" fill="#0063ff">
              <animate
                attributeName="cy"
                values="12;8;12"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="24" cy="20" r="0.5" fill="#d000ff">
              <animate
                attributeName="cy"
                values="20;24;20"
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="16" cy="16" r="0.4" fill="#8200ff">
              <animate
                attributeName="r"
                values="0.4;0.8;0.4"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </svg>

      {/* CSS for additional animations */}
      {animated && (
        <style>{`
          .xumane-logo-container {
            animation: xumane-float 3s ease-in-out infinite;
          }

          .xumane-logo-animated {
            animation: xumane-pulse 2s ease-in-out infinite;
          }

          @keyframes xumane-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }

          @keyframes xumane-pulse {
            0%, 100% {
              filter: drop-shadow(0 0 8px rgba(130, 0, 255, 0.4));
            }
            50% {
              filter: drop-shadow(0 0 16px rgba(130, 0, 255, 0.7));
            }
          }
        `}</style>
      )}
    </div>
  );
}

/**
 * Animated loader variant with additional motion effects
 */
export function XumaneLoader({
  className,
  size = 'lg',
  message,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <XumaneLogo animated size={size} />
      {message && (
        <p className="text-sm text-muted-foreground motion-safe:animate-pulse">{message}</p>
      )}
    </div>
  );
}
