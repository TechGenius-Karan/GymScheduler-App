const router = require('express').Router()
const Program = require('../models/Program')
const Schedule = require('../models/Schedule')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

// If the user has an old single Schedule doc but no Programs yet, migrate it transparently
async function migrateIfNeeded(userId) {
  const count = await Program.countDocuments({ userId })
  if (count > 0) return

  const oldSchedule = await Schedule.findOne({ userId })
  if (!oldSchedule) return

  const program = Program.fromJSON(userId, 'My Schedule', oldSchedule.days)
  program.isActive = true
  await program.save()
}

// GET /api/programs — list all programs (no days, for the switcher)
router.get('/', authMiddleware, async (req, res) => {
  try {
    await migrateIfNeeded(req.user.id)
    const programs = await Program
      .find({ userId: req.user.id }, 'name isActive createdAt updatedAt')
      .sort({ createdAt: 1 })
    res.json(programs)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/programs/active — full active program with days
router.get('/active', authMiddleware, async (req, res) => {
  try {
    await migrateIfNeeded(req.user.id)
    const program = await Program.findOne({ userId: req.user.id, isActive: true })
    res.json(program ?? null)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/programs/:id — full program by id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const program = await Program.findOne({ _id: req.params.id, userId: req.user.id })
    if (!program) return res.status(404).json({ message: 'Program not found' })
    res.json(program)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/programs — create a new program
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, days } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Program name is required' })

    const existingCount = await Program.countDocuments({ userId: req.user.id })
    const isFirst = existingCount === 0

    const program = days && Array.isArray(days)
      ? Program.fromJSON(req.user.id, name.trim(), days)
      : Program.buildBlank(req.user.id, name.trim())

    if (isFirst) {
      program.isActive = true
    } else {
      await Program.updateMany({ userId: req.user.id }, { isActive: false })
      program.isActive = true
    }

    await program.save()

    if (isFirst) {
      await User.findByIdAndUpdate(req.user.id, { firstLogin: false })
    }

    res.status(201).json(program)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

// PUT /api/programs/:id — save days (and optionally rename)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { days, name } = req.body
    const program = await Program.findOne({ _id: req.params.id, userId: req.user.id })
    if (!program) return res.status(404).json({ message: 'Program not found' })

    if (days && Array.isArray(days)) {
      program.days = Program.fromJSON(req.user.id, program.name, days).days
    }
    if (name?.trim()) program.name = name.trim()
    program.updatedAt = new Date()
    await program.save()

    const user = await User.findById(req.user.id)
    if (user?.firstLogin) {
      await User.findByIdAndUpdate(req.user.id, { firstLogin: false })
    }

    res.json(program)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

// PATCH /api/programs/:id/activate — switch active program
router.patch('/:id/activate', authMiddleware, async (req, res) => {
  try {
    const program = await Program.findOne({ _id: req.params.id, userId: req.user.id })
    if (!program) return res.status(404).json({ message: 'Program not found' })
    await program.activate()
    res.json(program)
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/programs/:id/rename
router.patch('/:id/rename', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })
    const program = await Program.findOne({ _id: req.params.id, userId: req.user.id })
    if (!program) return res.status(404).json({ message: 'Program not found' })
    program.name = name.trim()
    program.updatedAt = new Date()
    await program.save()
    res.json({ _id: program._id, name: program.name })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/programs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const program = await Program.findOne({ _id: req.params.id, userId: req.user.id })
    if (!program) return res.status(404).json({ message: 'Program not found' })

    const wasActive = program.isActive
    await program.deleteOne()

    if (wasActive) {
      const next = await Program.findOne({ userId: req.user.id }).sort({ updatedAt: -1 })
      if (next) {
        next.isActive = true
        await next.save()
        return res.json({ deleted: true, newActiveId: next._id.toString() })
      }
    }

    res.json({ deleted: true, newActiveId: null })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
