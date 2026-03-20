import { useState, useCallback, useRef, lazy, Suspense, useEffect } from 'react'
import { Box, Container, Stack, Typography, IconButton, Tabs, Tab, Paper, Tooltip, useMediaQuery, useTheme, Button } from '@mui/material'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import ContributionGrid from './components/ContributionGrid'
import MonthGrid from './components/MonthGrid'
import TaskPanel from './components/TaskPanel'
import StatsBar from './components/StatsBar'
import YearNav from './components/YearNav'
import CategoryFilter from './components/CategoryFilter'
import SearchBar from './components/SearchBar'
import UndoToast from './components/UndoToast'
import { useTaskData } from './hooks/useTaskData'
import { useNoteData } from './hooks/useNoteData'
import './App.css'

const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'))
const GoalsPanel = lazy(() => import('./components/GoalsPanel'))

const CURRENT_YEAR = new Date().getFullYear()

function App({ themeMode, onThemeToggle }) {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [bulkDates, setBulkDates] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [activeView, setActiveView] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [undoToast, setUndoToast] = useState(null) // { taskName }
  const [importPreview, setImportPreview] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const importPreviewRef = useRef(null)
  const importPrimaryActionRef = useRef(null)
  const [exportBannerDismissed, setExportBannerDismissed] = useState(false)
  const undoRef = useRef(null)                      // { dateStr, task, timeoutId }
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { taskData, addTask, addTaskToMultipleDates, toggleTask, deleteTask, editTask, restoreTask, importData, getTasksForDate, getCompletionLevel } = useTaskData()
  const { noteData, setNote, getNote, importNotes } = useNoteData()

  const [lastExportAt, setLastExportAt] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('lastExportAt')
    setLastExportAt(stored ? Number(stored) : null)
  }, [])

  const showExportBanner = !exportBannerDismissed && (!lastExportAt || Date.now() - lastExportAt > 1000 * 60 * 60 * 24 * 30)

  // ── Drag / click ──────────────────────────────────────────
  const handleDragSelect = useCallback((dates) => {
    if (dates.length === 1) { setSelectedDate(dates[0]); setBulkDates(null) }
    else { setBulkDates(dates); setSelectedDate(null) }
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedDate(null)
    setBulkDates(null)
  }, [])

  // ── Undo delete ───────────────────────────────────────────
  const handleDeleteWithUndo = useCallback((dateStr, taskId) => {
    const task = getTasksForDate(dateStr).find(t => t.id === taskId)
    if (!task) return
    if (undoRef.current?.timeoutId) clearTimeout(undoRef.current.timeoutId)
    deleteTask(dateStr, taskId)
    const timeoutId = setTimeout(() => {
      undoRef.current = null
      setUndoToast(null)
    }, 5000)
    undoRef.current = { dateStr, task, timeoutId }
    setUndoToast({ taskName: task.name })
  }, [deleteTask, getTasksForDate])

  const handleUndo = useCallback(() => {
    if (!undoRef.current) return
    clearTimeout(undoRef.current.timeoutId)
    restoreTask(undoRef.current.dateStr, undoRef.current.task)
    undoRef.current = null
    setUndoToast(null)
  }, [restoreTask])

  // ── Month nav (mobile) ────────────────────────────────────
  const handleMonthChange = useCallback((delta) => {
    setViewMonth(prev => {
      const next = prev + delta
      if (next < 0)  { setYear(y => y - 1); return 11 }
      if (next > 11) { setYear(y => y + 1); return 0 }
      return next
    })
  }, [])

  // ── Export / Import ───────────────────────────────────────
  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ taskData, notes: noteData }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productivity-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    const now = Date.now()
    localStorage.setItem('lastExportAt', String(now))
    setLastExportAt(now)
    setExportBannerDismissed(false)
  }

  const summarizeImportDiff = useCallback((incomingTasks, incomingNotes) => {
    const currentDates = new Set(Object.keys(taskData || {}))
    const incomingDates = new Set(Object.keys(incomingTasks || {}))
    const addedDates = [...incomingDates].filter(d => !currentDates.has(d)).length
    const removedDates = [...currentDates].filter(d => !incomingDates.has(d)).length

    let taskDelta = 0
    let changedDates = 0
    const allDates = new Set([...currentDates, ...incomingDates])
    allDates.forEach(dateStr => {
      const currentTasks = taskData[dateStr] || []
      const nextTasks = incomingTasks?.[dateStr] || []
      const diff = nextTasks.length - currentTasks.length
      if (diff !== 0) taskDelta += diff
      if (diff !== 0) changedDates += 1
    })

    const currentNotes = noteData || {}
    const noteKeys = new Set([...Object.keys(currentNotes), ...Object.keys(incomingNotes || {})])
    let noteChanges = 0
    noteKeys.forEach(key => {
      if ((currentNotes[key] || '') !== (incomingNotes?.[key] || '')) noteChanges += 1
    })

    return { addedDates, removedDates, changedDates, taskDelta, noteChanges }
  }, [noteData, taskData])

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const incomingTasks = data.taskData || data
        const incomingNotes = data.notes || {}
        const summary = summarizeImportDiff(incomingTasks, incomingNotes)
        setPendingImport({ tasks: incomingTasks, notes: incomingNotes })
        setImportPreview(summary)
      } catch {
        alert('Invalid file. Please use a file exported from this app.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const clearImportPreview = useCallback(() => {
    setPendingImport(null)
    setImportPreview(null)
  }, [])

  useEffect(() => {
    if (importPreview) {
      importPrimaryActionRef.current?.focus()
    }
  }, [importPreview])

  useEffect(() => {
    if (!importPreview) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        clearImportPreview()
      }
      if (e.key === 'Tab' && importPreviewRef.current) {
        const focusable = importPreviewRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [importPreview, clearImportPreview])

  const handleConfirmImport = () => {
    if (!pendingImport) return
    importData(pendingImport.tasks)
    importNotes(pendingImport.notes)
    clearImportPreview()
  }

  const getLevel = useCallback(
    (dateStr) => getCompletionLevel(dateStr, categoryFilter),
    [getCompletionLevel, categoryFilter]
  )

  const viewIndex = ['grid', 'analytics', 'goals'].indexOf(activeView)

  return (
    <Container maxWidth="lg" className="app">
      <Paper elevation={0} className="app-shell">
        <Stack spacing={2.5} sx={{ p: { xs: 2.5, md: 3.5 } }}>
          {showExportBanner && (
            <Paper elevation={0} className="export-reminder">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                <Typography variant="body2">It looks like you haven’t exported your data recently. Consider saving a backup.</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={handleExport}>Export now</Button>
                  <Button size="small" variant="text" onClick={() => setExportBannerDismissed(true)}>Dismiss</Button>
                </Stack>
              </Stack>
            </Paper>
          )}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h1">365 Day Productivity Tracker</Typography>
              <Typography className="subtitle" variant="body2">Click any day to track tasks · Drag to bulk-select · ⌘K to search</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}>
                <IconButton onClick={onThemeToggle} color="primary" className="theme-toggle">
                  {themeMode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                </IconButton>
              </Tooltip>
              <Button variant="outlined" size="small" startIcon={<DownloadRoundedIcon />} onClick={handleExport}>Export</Button>
              <Button variant="outlined" size="small" component="label" startIcon={<UploadRoundedIcon />}>Import<input type="file" accept=".json" onChange={handleImport} hidden /></Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" className="toolbar">
            <Tabs value={viewIndex} onChange={(_, idx) => setActiveView(['grid', 'analytics', 'goals'][idx])} className="view-tabs" textColor="primary" indicatorColor="primary">
              <Tab label="Grid" />
              <Tab label="Analytics" />
              <Tab label="Goals" />
            </Tabs>
            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              taskData={taskData}
              onResultClick={(dateStr) => { setSelectedDate(dateStr); setActiveView('grid') }}
            />
          </Stack>

          {activeView === 'grid' && (
            <>
              <StatsBar taskData={taskData} year={year} />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" className="grid-controls">
                <YearNav year={year} onYearChange={y => { setYear(y); setViewMonth(0) }} />
                <CategoryFilter activeCategory={categoryFilter} onCategoryChange={setCategoryFilter} />
              </Stack>

              <Paper elevation={0} className="app-main">
                {isMobile ? (
                  <MonthGrid
                    year={year}
                    month={viewMonth}
                    taskData={taskData}
                    getCompletionLevel={getLevel}
                    onDayClick={(dateStr) => setSelectedDate(dateStr)}
                    onMonthChange={handleMonthChange}
                  />
                ) : (
                  <ContributionGrid
                    year={year}
                    taskData={taskData}
                    getCompletionLevel={getLevel}
                    selectedDate={selectedDate}
                    bulkDates={bulkDates}
                    onDragSelect={handleDragSelect}
                  />
                )}
              </Paper>

              {!isMobile && (
                <Box className="app-footer">
                  <div className="legend">
                    <span className="legend-label">Less</span>
                    <span className="legend-dot level-0" />
                    <span className="legend-dot level-1" />
                    <span className="legend-dot level-2" />
                    <span className="legend-dot level-3" />
                    <span className="legend-dot level-4" />
                    <span className="legend-label">More</span>
                  </div>
                </Box>
              )}
            </>
          )}

          {activeView === 'analytics' && (
            <Suspense fallback={<Box sx={{ p: 3 }}><Typography variant="body2">Loading analytics…</Typography></Box>}>
              <AnalyticsDashboard taskData={taskData} year={year} />
            </Suspense>
          )}
          {activeView === 'goals' && (
            <Suspense fallback={<Box sx={{ p: 3 }}><Typography variant="body2">Loading goals…</Typography></Box>}>
              <GoalsPanel taskData={taskData} />
            </Suspense>
          )}
        </Stack>
      </Paper>

      {selectedDate && (
        <TaskPanel
          dateStr={selectedDate}
          tasks={getTasksForDate(selectedDate)}
          note={getNote(selectedDate)}
          onAddTask={(name, category, recurring) => addTask(selectedDate, name, category, recurring, year)}
          onToggleTask={(taskId) => toggleTask(selectedDate, taskId)}
          onDeleteTask={(taskId) => handleDeleteWithUndo(selectedDate, taskId)}
          onEditTask={(taskId, newName) => editTask(selectedDate, taskId, newName)}
          onNoteChange={(text) => setNote(selectedDate, text)}
          onClose={handleClosePanel}
        />
      )}

      {bulkDates && (
        <TaskPanel
          bulkDates={bulkDates}
          onAddTask={(name, category) => addTaskToMultipleDates(bulkDates, name, category)}
          onClose={handleClosePanel}
        />
      )}

      {undoToast && (
        <UndoToast
          message={`Deleted "${undoToast.taskName}"`}
          onUndo={handleUndo}
          onDismiss={() => { clearTimeout(undoRef.current?.timeoutId); undoRef.current = null; setUndoToast(null) }}
        />
      )}

      {importPreview && (
        <div className="task-panel-overlay" onClick={clearImportPreview}>
          <div
            ref={importPreviewRef}
            className="task-panel"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-preview-title"
          >
            <div className="task-panel-header">
              <div>
                <h2 id="import-preview-title">Import preview</h2>
                <p className="task-count">Review changes before replacing your data.</p>
              </div>
              <button className="close-btn" onClick={clearImportPreview} aria-label="Close import preview">&times;</button>
            </div>
            <div className="task-list">
              <div className="bulk-date-item">Dates added: {importPreview.addedDates}</div>
              <div className="bulk-date-item">Dates removed: {importPreview.removedDates}</div>
              <div className="bulk-date-item">Dates changed: {importPreview.changedDates}</div>
              <div className="bulk-date-item">Task count delta: {importPreview.taskDelta >= 0 ? `+${importPreview.taskDelta}` : importPreview.taskDelta}</div>
              <div className="bulk-date-item">Notes changed: {importPreview.noteChanges}</div>
            </div>
            <div className="task-form" style={{ paddingTop: 0 }}>
              <div className="task-form-row">
                <button ref={importPrimaryActionRef} type="button" className="add-btn" onClick={handleConfirmImport}>Replace data</button>
                <button type="button" className="close-btn" onClick={clearImportPreview}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export default App
