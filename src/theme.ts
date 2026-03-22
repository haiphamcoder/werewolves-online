import { createTheme, type MantineColorsTuple } from '@mantine/core'

/** Custom dark gray scale (0 = lightest … 9 = darkest), game-style neutrals */
const dark: MantineColorsTuple = [
  '#C1C2C5',
  '#A6A7AB',
  '#909296',
  '#5c5f66',
  '#373A40',
  '#2C2E33',
  '#25262b',
  '#1A1B1E',
  '#141517',
  '#101113',
]

export const theme = createTheme({
  primaryColor: 'red',
  /** Red accent reads well on dark UI */
  primaryShade: { light: 6, dark: 7 },

  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',

  headings: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    fontWeight: '700',
  },

  colors: {
    dark,
  },

  defaultRadius: 'md',
  cursorType: 'pointer',
  respectReducedMotion: true,
  defaultGradient: {
    from: 'red.6',
    to: 'red.8',
    deg: 135,
  },
})
