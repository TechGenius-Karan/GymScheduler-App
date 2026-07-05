import { createContext, useContext, useState, useMemo } from 'react'
import { getTemplate } from '../api/templateApi'
import {
  activateProgram, saveProgram, createProgram,
  getProgram, renameProgram, deleteProgram,
} from '../api/programApi'

const BLANK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ScheduleContext = createContext(null)

export function ScheduleProvider({ children }) {
  const [activeView, setActiveView] = useState('splitPicker')
  const [templateData, setTemplateData] = useState(null)
  const [myScheduleData, setMyScheduleData] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [programs, setPrograms] = useState([])
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [savedScheduleData, setSavedScheduleData] = useState(null)

  const hasUnsavedChanges = useMemo(() => {
    if (!myScheduleData?.days || !savedScheduleData?.days) return false
    return JSON.stringify(myScheduleData.days) !== JSON.stringify(savedScheduleData.days)
  }, [myScheduleData, savedScheduleData])

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

  function reorderExercises(dayName, oldIndex, newIndex) {
    setMyScheduleData(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.day !== dayName) return d
        const exercises = [...d.exercises]
        const [moved] = exercises.splice(oldIndex, 1)
        exercises.splice(newIndex, 0, moved)
        return { ...d, exercises }
      }),
    }))
  }

  // ── program actions ───────────────────────────────────────────────

  async function saveActiveProgram() {
    const days = myScheduleData?.days
    if (!days) return
    if (activeProgramId) {
      const updated = await saveProgram(activeProgramId, days)
      setMyScheduleData(updated)
      setSavedScheduleData(updated)
      setPrograms(prev => prev.map(p =>
        p._id === activeProgramId ? { ...p, name: updated.name, updatedAt: updated.updatedAt } : p
      ))
    } else {
      const created = await createProgram('My Schedule', days)
      setActiveProgramId(created._id)
      setMyScheduleData(created)
      setSavedScheduleData(created)
      setPrograms([{
        _id: created._id, name: created.name, isActive: created.isActive,
        createdAt: created.createdAt, updatedAt: created.updatedAt,
      }])
    }
  }

  async function switchProgram(id) {
    const program = await activateProgram(id)
    setActiveProgramId(id)
    setMyScheduleData(program)
    setSavedScheduleData(program)
    setActiveView('mySchedule')
    setPrograms(prev => prev.map(p => ({ ...p, isActive: p._id === id })))
  }

  async function createNewProgram(name, days) {
    const created = await createProgram(name, days)
    setActiveProgramId(created._id)
    setMyScheduleData(created)
    setSavedScheduleData(created)
    setActiveView('mySchedule')
    setPrograms(prev => [
      ...prev.map(p => ({ ...p, isActive: false })),
      { _id: created._id, name: created.name, isActive: created.isActive, createdAt: created.createdAt, updatedAt: created.updatedAt },
    ])
  }

  async function renameProgramById(id, name) {
    const updated = await renameProgram(id, name)
    setPrograms(prev => prev.map(p => p._id === id ? { ...p, name: updated.name } : p))
  }

  async function deleteProgramById(id) {
    const result = await deleteProgram(id)
    if (result.newActiveId) {
      const program = await getProgram(result.newActiveId)
      setActiveProgramId(result.newActiveId)
      setMyScheduleData(program)
      setSavedScheduleData(program)
      setPrograms(prev =>
        prev.filter(p => p._id !== id).map(p => ({ ...p, isActive: p._id === result.newActiveId }))
      )
    } else if (id === activeProgramId) {
      setActiveProgramId(null)
      setMyScheduleData(null)
      setSavedScheduleData(null)
      setActiveView('splitPicker')
      setPrograms([])
    } else {
      setPrograms(prev => prev.filter(p => p._id !== id))
    }
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
      reorderExercises,
      programs, setPrograms,
      activeProgramId, setActiveProgramId,
      savedScheduleData, setSavedScheduleData,
      hasUnsavedChanges,
      saveActiveProgram,
      switchProgram,
      createNewProgram,
      renameProgramById,
      deleteProgramById,
    }}>
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
