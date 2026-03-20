import { useState, useCallback, useEffect } from 'react'

const NOTES_KEY = 'productivity-tracker-notes'

function loadNotes() {
  try {
    const saved = localStorage.getItem(NOTES_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

export function useNoteData() {
  const [noteData, setNoteData] = useState(loadNotes)

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(noteData))
  }, [noteData])

  const setNote = useCallback((dateStr, text) => {
    setNoteData(prev => {
      if (!text.trim()) {
        const { [dateStr]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [dateStr]: text }
    })
  }, [])

  const getNote = useCallback((dateStr) => noteData[dateStr] || '', [noteData])

  const importNotes = useCallback((data) => setNoteData(data || {}), [])

  return { noteData, setNote, getNote, importNotes }
}
