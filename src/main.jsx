import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { getTheme } from './theme'

function AppWithTheme() {
  const [mode, setMode] = React.useState(() => localStorage.getItem('pt-theme') || 'dark')

  React.useEffect(() => {
    localStorage.setItem('pt-theme', mode)
  }, [mode])

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <App themeMode={mode} onThemeToggle={() => setMode(prev => (prev === 'dark' ? 'light' : 'dark'))} />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>,
)
