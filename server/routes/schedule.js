const router = require('express').Router()
const Schedule = require('../models/Schedule')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

// GET /api/schedules — all programs for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.user.id })
    res.json(schedules)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/schedules — create a new program
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { programName, goal, days } = req.body
    if (!programName) {
      return res.status(400).json({ message: 'programName is required' })
    }
    if (!Array.isArray(days) || days.length !== 7) {
      return res.status(400).json({ message: 'days must be an array of 7 entries' })
    }

    const isFirstSave = (await Schedule.countDocuments({ userId: req.user.id })) === 0

    const schedule = await Schedule.fromJSON(req.user.id, programName, goal, days).save()

    if (isFirstSave) {
      await User.findByIdAndUpdate(req.user.id, { firstLogin: false })
    }

    res.status(201).json(schedule)
  } catch (err) {
    res.status(400).json({ message: err.message || 'Server error' })
  }
})

// PATCH /api/schedules/:id/activate — set active, deactivate all others
router.patch('/:id/activate', authMiddleware, async (req, res) => {
  try {
    await Schedule.updateMany({ userId: req.user.id }, { isActive: false })
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: true },
      { new: true }
    )
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' })
    res.json(schedule)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

// PATCH /api/schedules/:id — edit programName, goal, or days
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { programName, goal, days } = req.body
    const update = { updatedAt: new Date() }
    if (programName !== undefined) update.programName = programName
    if (goal !== undefined) update.goal = goal
    if (days !== undefined) {
      if (!Array.isArray(days) || days.length !== 7) {
        return res.status(400).json({ message: 'days must be an array of 7 entries' })
      }
      update.days = days.map(d => ({
        day: d.day,
        isRest: d.isRest ?? false,
        splitName: d.splitName ?? '',
        exercises: (d.exercises || []).map(ex => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
        })),
      }))
    }

    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      update,
      { new: true, runValidators: true }
    )
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' })
    res.json(schedule)
  } catch (err) {
    res.status(400).json({ message: err.message || 'Server error' })
  }
})

// DELETE /api/schedules/:id — delete a program
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

module.exports = router
