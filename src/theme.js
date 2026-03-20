import { createTheme } from '@mui/material/styles'

const heatmap = {
  level0: 'var(--heatmap-0)',
  level1: 'var(--heatmap-1)',
  level2: 'var(--heatmap-2)',
  level3: 'var(--heatmap-3)',
  level4: 'var(--heatmap-4)',
}

export function getTheme(mode = 'dark') {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: '#58a6ff' },
      secondary: { main: '#bc8cff' },
      success: { main: '#3fb950' },
      warning: { main: '#f78166' },
      background: {
        default: isDark ? '#0d1117' : '#f6f8fa',
        paper: isDark ? '#161b22' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f0f6fc' : '#1f2328',
        secondary: isDark ? '#8b949e' : '#57606a',
      },
      divider: isDark ? '#30363d' : '#d0d7de',
    },
    typography: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
      h1: { fontSize: '2rem', fontWeight: 700 },
      h2: { fontSize: '1.4rem', fontWeight: 700 },
      h3: { fontSize: '1.05rem', fontWeight: 600 },
      subtitle1: { fontSize: '0.95rem' },
      body1: { fontSize: '0.95rem' },
      body2: { fontSize: '0.85rem' },
    },
    shape: { borderRadius: 12 },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--heatmap-0': isDark ? '#161b22' : '#eaeef2',
            '--heatmap-1': '#da6d42',
            '--heatmap-2': '#e8b730',
            '--heatmap-3': '#5fb85a',
            '--heatmap-4': '#39d353',
          },
          body: {
            backgroundColor: isDark ? '#0d1117' : '#f6f8fa',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: { height: 3, borderRadius: 3 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { minHeight: 40, paddingLeft: 12, paddingRight: 12 },
        },
      },
    },
  })
}

export { heatmap }
