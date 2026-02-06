/**
 * Color palette definitions.
 * HSL values for use in CSS variables (without hsl() wrapper).
 */

// Slate color palette (neutral grays)
export const slate = {
  50: '210 40% 98%',
  100: '210 40% 96%',
  200: '214 32% 91%',
  300: '213 27% 84%',
  400: '215 20% 65%',
  500: '215 16% 47%',
  600: '215 19% 35%',
  700: '215 25% 27%',
  800: '217 33% 17%',
  900: '222 47% 11%',
  950: '229 84% 5%',
} as const;

// Blue color palette (primary)
export const blue = {
  50: '214 100% 97%',
  100: '214 95% 93%',
  200: '213 97% 87%',
  300: '212 96% 78%',
  400: '213 94% 68%',
  500: '217 91% 60%',
  600: '221 83% 53%',
  700: '224 76% 48%',
  800: '226 71% 40%',
  900: '224 64% 33%',
  950: '226 57% 21%',
} as const;

// Green color palette (success)
export const green = {
  50: '138 76% 97%',
  100: '141 84% 93%',
  200: '141 79% 85%',
  300: '142 77% 73%',
  400: '142 69% 58%',
  500: '142 71% 45%',
  600: '142 76% 36%',
  700: '142 72% 29%',
  800: '143 64% 24%',
  900: '144 61% 20%',
  950: '145 80% 10%',
} as const;

// Red color palette (destructive)
export const red = {
  50: '0 86% 97%',
  100: '0 93% 94%',
  200: '0 96% 89%',
  300: '0 94% 82%',
  400: '0 91% 71%',
  500: '0 84% 60%',
  600: '0 72% 51%',
  700: '0 74% 42%',
  800: '0 70% 35%',
  900: '0 63% 31%',
  950: '0 75% 15%',
} as const;

// Amber color palette (warning)
export const amber = {
  50: '48 100% 96%',
  100: '48 96% 89%',
  200: '48 97% 77%',
  300: '46 97% 65%',
  400: '43 96% 56%',
  500: '38 92% 50%',
  600: '32 95% 44%',
  700: '26 90% 37%',
  800: '23 83% 31%',
  900: '22 78% 26%',
  950: '21 92% 14%',
} as const;

// Sky color palette (info)
export const sky = {
  50: '204 100% 97%',
  100: '204 94% 94%',
  200: '201 94% 86%',
  300: '199 95% 74%',
  400: '198 93% 60%',
  500: '199 89% 48%',
  600: '200 98% 39%',
  700: '201 96% 32%',
  800: '201 90% 27%',
  900: '202 80% 24%',
  950: '204 80% 16%',
} as const;

// Purple color palette (accent alternative)
export const purple = {
  50: '270 100% 98%',
  100: '269 100% 95%',
  200: '269 100% 92%',
  300: '269 97% 85%',
  400: '270 95% 75%',
  500: '271 91% 65%',
  600: '271 81% 56%',
  700: '272 72% 47%',
  800: '273 67% 39%',
  900: '274 66% 32%',
  950: '274 87% 21%',
} as const;

/**
 * Semantic color themes - synced with index.css values.
 * These define the complete color scheme for each theme mode.
 */
export const semanticColors = {
  // Light theme - matches :root in index.css
  light: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96%',
    mutedForeground: '215 25% 35%',
    accent: '210 40% 96%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    success: '142.1 76.2% 36.3%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '20 60% 15%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '221.2 83.2% 53.3%',
    radius: '0.5rem',
  },

  // Dark theme - matches .dark in index.css
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 15% 72%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    success: '142.1 70.6% 45.3%',
    successForeground: '144.9 80.4% 10%',
    warning: '48 96% 53%',
    warningForeground: '20 70% 15%',
    info: '199 89% 48%',
    infoForeground: '201 96% 32%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '224.3 76.3% 48%',
    radius: '0.5rem',
  },

  // High contrast theme - matches .high-contrast in index.css
  highContrast: {
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    card: '0 0% 0%',
    cardForeground: '0 0% 100%',
    popover: '0 0% 0%',
    popoverForeground: '0 0% 100%',
    primary: '48 100% 50%',
    primaryForeground: '0 0% 0%',
    secondary: '0 0% 20%',
    secondaryForeground: '0 0% 100%',
    muted: '0 0% 20%',
    mutedForeground: '0 0% 80%',
    accent: '48 100% 50%',
    accentForeground: '0 0% 0%',
    destructive: '0 100% 60%',
    destructiveForeground: '0 0% 0%',
    success: '120 100% 50%',
    successForeground: '0 0% 0%',
    warning: '60 100% 50%',
    warningForeground: '0 0% 0%',
    info: '200 100% 50%',
    infoForeground: '0 0% 0%',
    border: '0 0% 100%',
    input: '0 0% 20%',
    ring: '48 100% 50%',
    radius: '0.5rem',
  },
} as const;

export type SemanticColorTheme = keyof typeof semanticColors;
export type SemanticColorKey = keyof (typeof semanticColors)['light'];

// Color palette types
export type SlateShade = keyof typeof slate;
export type BlueShade = keyof typeof blue;
export type GreenShade = keyof typeof green;
export type RedShade = keyof typeof red;
export type AmberShade = keyof typeof amber;
export type SkyShade = keyof typeof sky;
export type PurpleShade = keyof typeof purple;

/**
 * Generates CSS variable declarations for a theme.
 * @param theme - The theme name ('light' | 'dark' | 'highContrast')
 * @returns CSS string with variable declarations
 *
 * @example
 * ```ts
 * const lightCss = generateThemeCss('light');
 * // Returns: "--background: 0 0% 100%;\n--foreground: 222.2 84% 4.9%;\n..."
 * ```
 */
export function generateThemeCss(theme: SemanticColorTheme): string {
  const colors = semanticColors[theme];
  return Object.entries(colors)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case for CSS variable names
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `--${cssKey}: ${value};`;
    })
    .join('\n');
}

/**
 * Generates a complete CSS block for a theme with selector.
 * @param theme - The theme name
 * @param selector - CSS selector (default: ':root' for light, '.dark' for dark, '.high-contrast' for highContrast)
 * @returns Complete CSS block
 *
 * @example
 * ```ts
 * const darkCssBlock = generateThemeCssBlock('dark');
 * // Returns: ".dark {\n  --background: 222.2 84% 4.9%;\n  ...\n}"
 * ```
 */
export function generateThemeCssBlock(
  theme: SemanticColorTheme,
  selector?: string
): string {
  const defaultSelectors: Record<SemanticColorTheme, string> = {
    light: ':root',
    dark: '.dark',
    highContrast: '.high-contrast',
  };

  const cssSelector = selector ?? defaultSelectors[theme];
  const variables = generateThemeCss(theme)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

  return `${cssSelector} {\n${variables}\n}`;
}

/**
 * Gets a specific color value from a theme.
 * @param theme - The theme name
 * @param colorKey - The color key (e.g., 'primary', 'background')
 * @returns HSL value string
 */
export function getThemeColor(
  theme: SemanticColorTheme,
  colorKey: SemanticColorKey
): string {
  return semanticColors[theme][colorKey];
}

/**
 * Converts an HSL string to a CSS hsl() function call.
 * @param hsl - HSL values as string (e.g., "221.2 83.2% 53.3%")
 * @returns CSS hsl() function (e.g., "hsl(221.2 83.2% 53.3%)")
 */
export function toHslFunction(hsl: string): string {
  return `hsl(${hsl})`;
}

/**
 * Creates an HSL color with alpha channel.
 * @param hsl - HSL values as string
 * @param alpha - Alpha value (0-1)
 * @returns CSS hsl() function with alpha
 */
export function toHsla(hsl: string, alpha: number): string {
  return `hsl(${hsl} / ${alpha})`;
}
