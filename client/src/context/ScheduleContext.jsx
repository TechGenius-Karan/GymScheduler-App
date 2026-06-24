import { createContext, useContext, useState } from 'react'
import { getTemplate } from '../api/templateApi'

const BLANK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ScheduleContext = createContext(null)

export function ScheduleProvider({ children }) {
  const [activeView, setActiveView] = useState('splitPicker')
  const [templateData, setTemplateData] = useState(null)
  const [myScheduleData, setMyScheduleData] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  // ── template actions ──────────────────────────────────────────────

  async function selectTemplate(id) {
    setLoadingTemplate(true)
    try {
      const template = await getTemplate(id)
      setTemplateData(template)
      setSelectedTemplateId(id)
      setActiveView('template')
    } finally {
      setLoadingTemplate(false)
    }
  }

  function copyToMySchedule() {
    if (!templateData) return
    const days = templateData.days.map(d => ({
      day: d.day,
      isRest: d.isRest,
      splitName: d.splitName,
      exercises: d.exercises.map(ex => ({
        id: crypto.randomUUID(),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
      })),
    }))
    setMyScheduleData({ days })
    setActiveView('mySchedule')
  }

  function startFresh() {
    setMyScheduleData({
      days: BLANK_DAYS.map(day => ({ day, isRest: false, splitName: '', exercises: [] })),
    })
    setActiveView('mySchedule')
  }

  // ── schedule mutation helpers ─────────────────────────────────────

  function updateDay(dayName, updates) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d => d.day === dayName ? { ...d, ...updates } : d),
    }))
  }

  function addExercise(dayName) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.day === dayName
          ? { ...d, exercises: [...d.exercises, { id: crypto.randomUUID(), name: '', sets: 3, reps: 10 }] }
          : d
      ),
    }))
  }

  function removeExercise(dayName, exerciseId) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.day === dayName
          ? { ...d, exercises: d.exercises.filter(ex => ex.id !== exerciseId) }
          : d
      ),
    }))
  }

  function updateExercise(dayName, exerciseId, updates) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.day === dayName
          ? { ...d, exercises: d.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex) }
          : d
      ),
    }))
  }

  return (
    <ScheduleContext.Provider value={{
      activeView, setActiveView,
      templateData, setTemplateData,
      myScheduleData, setMyScheduleData,
      selectedTemplateId,
      loadingTemplate,
      selectTemplate,
      copyToMySchedule,
      startFresh,
      updateDay,
      addExercise,
      removeExercise,
      updateExercise,
    }}>
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
