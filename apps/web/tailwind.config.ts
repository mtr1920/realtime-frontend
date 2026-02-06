import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  // Safelist for dynamically constructed classes (role-based avatars)
  safelist: [
    // Role avatar gradients
    'bg-gradient-to-br',
    'from-green-100', 'to-green-200', 'dark:from-green-900', 'dark:to-green-800',
    'from-blue-100', 'to-blue-200', 'dark:from-blue-900', 'dark:to-blue-800',
    'from-gray-100', 'to-gray-200', 'dark:from-gray-700', 'dark:to-gray-600',
    'from-amber-100', 'to-amber-200', 'dark:from-amber-900', 'dark:to-amber-800',
    'from-purple-100', 'to-purple-200', 'dark:from-purple-900', 'dark:to-purple-800',
    'from-primary/20', 'to-primary/40',
    // Role avatar text colors
    'text-green-700', 'dark:text-green-300',
    'text-blue-700', 'dark:text-blue-300',
    'text-gray-600', 'dark:text-gray-300',
    'text-amber-700', 'dark:text-amber-300',
    'text-purple-700', 'dark:text-purple-300',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0', willChange: 'height' },
          to: { height: 'var(--radix-accordion-content-height)', willChange: 'auto' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', willChange: 'height' },
          to: { height: '0', willChange: 'auto' },
        },
        'fade-in': {
          from: { opacity: '0', willChange: 'opacity' },
          to: { opacity: '1', willChange: 'auto' },
        },
        'fade-out': {
          from: { opacity: '1', willChange: 'opacity' },
          to: { opacity: '0', willChange: 'auto' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)', willChange: 'transform' },
          to: { transform: 'translateY(0)', willChange: 'auto' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)', willChange: 'transform' },
          to: { transform: 'translateY(0)', willChange: 'auto' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1', willChange: 'transform, opacity' },
          '100%': { transform: 'scale(1.5)', opacity: '0', willChange: 'auto' },
        },
        spin: {
          from: { transform: 'rotate(0deg)', willChange: 'transform' },
          to: { transform: 'rotate(360deg)', willChange: 'transform' },
        },
        // UI/UX Enhancement - speaking glow effect
        'speaking-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(34 197 94 / 0.4)', willChange: 'box-shadow' },
          '50%': { boxShadow: '0 0 0 8px rgb(34 197 94 / 0)', willChange: 'box-shadow' },
        },
        // Typing indicator bounce effect
        'bounce-dots': {
          '0%, 80%, 100%': { transform: 'scale(0)', willChange: 'transform' },
          '40%': { transform: 'scale(1)', willChange: 'transform' },
        },
        // Shimmer loading effect
        shimmer: {
          '0%': { backgroundPosition: '-200% 0', willChange: 'background-position' },
          '100%': { backgroundPosition: '200% 0', willChange: 'background-position' },
        },
        // Scale up animation for buttons
        'scale-up': {
          '0%': { transform: 'scale(0.95)', opacity: '0', willChange: 'transform, opacity' },
          '100%': { transform: 'scale(1)', opacity: '1', willChange: 'auto' },
        },
        // Subtle float effect
        float: {
          '0%, 100%': { transform: 'translateY(0)', willChange: 'transform' },
          '50%': { transform: 'translateY(-4px)', willChange: 'transform' },
        },
        // Audio waveform bar animation
        'waveform-bar': {
          '0%, 100%': { height: '20%', willChange: 'height' },
          '50%': { height: '100%', willChange: 'height' },
        },
        // Slide in from right for panels
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)', willChange: 'transform' },
          to: { transform: 'translateX(0)', willChange: 'auto' },
        },
        // Success checkmark
        'check-bounce': {
          '0%': { transform: 'scale(0)', willChange: 'transform' },
          '50%': { transform: 'scale(1.2)', willChange: 'transform' },
          '100%': { transform: 'scale(1)', willChange: 'auto' },
        },
        // Network reconnection pulse
        'reconnect-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        // Dashboard card slide-up-fade for staggered reveal
        'slide-up-fade': {
          '0%': {
            opacity: '0',
            transform: 'translateY(16px)',
            willChange: 'transform, opacity',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
            willChange: 'auto',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // UI/UX Enhancement animations
        'speaking-glow': 'speaking-glow 2s ease-in-out infinite',
        'bounce-dots': 'bounce-dots 1.4s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'scale-up': 'scale-up 0.2s ease-out',
        float: 'float 3s ease-in-out infinite',
        'waveform-bar': 'waveform-bar 0.8s ease-in-out infinite',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'check-bounce': 'check-bounce 0.4s ease-out',
        'reconnect-pulse': 'reconnect-pulse 2s ease-in-out infinite',
        'slide-up-fade': 'slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
