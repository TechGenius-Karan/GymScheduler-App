const express = require('express')
const router = express.Router()
const Schedule = require('../models/Schedule')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

// GET /api/programs — list all user's programs (no days payload)
router.get('/', async (req, res) => {
  try {
    const programs = await Schedule.find(
      { userId: req.user._id },
      'programName goal isActive updatedAt'
    ).sort({ updatedAt: -1 })
    res.json(programs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/programs/active — get active program with full days
router.get('/active', async (req, res) => {
  try {
    const program = await Schedule.findOne({ userId: req.user._id, isActive: true })
    res.json(program || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/programs/:id
router.get('/:id', async (req, res) => {
  try {
    const program = await Schedule.findOne({ _id: req.params.id, userId: req.user._id })
    if (!program) return res.status(404).json({ error: 'Not found' })
    res.json(program)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/programs — create new program { name, days? }
router.post('/', async (req, res) => {
  try {
    const { name, days } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const existingCount = await Schedule.countDocuments({ userId: req.user._id })
    const isFirst = existingCount === 0

    let program
    if (days && days.length > 0) {
      program = Schedule.fromJSON(req.user._id, name, null, days)
    } else {
      program = Schedule.buildBlank(req.user._id, name, null)
    }
    program.isActive = isFirst
    await program.save()
    res.status(201).json(program)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/programs/:id — update days { days }
router.put('/:id', async (req, res) => {
  try {
    const { days } = req.body
    const program = await Schedule.findOne({ _id: req.params.id, userId: req.user._id })
    if (!program) return res.status(404).json({ error: 'Not found' })

    if (days) {
      const updated = Schedule.fromJSON(req.user._id, program.programName, program.goal, days)
      program.days = updated.days
    }
    program.updatedAt = new Date()
    await program.save()
    res.json(program)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/programs/:id/activate — set as active, deactivate others
router.patch('/:id/activate', async (req, res) => {
  try {
    await Schedule.updateMany({ userId: req.user._id }, { isActive: false })
    const program = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: true },
      { new: true }
    )
    if (!program) return res.status(404).json({ error: 'Not found' })
    res.json(program)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/programs/:id/rename — rename { name }
router.patch('/:id/rename', async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const program = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { programName: name, updatedAt: new Date() },
      { new: true }
    )
    if (!program) return res.status(404).json({ error: 'Not found' })
    res.json(program)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/programs/:id — delete; auto-activate next if active was deleted
router.delete('/:id', async (req, res) => {
  try {
    const program = await Schedule.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!program) return res.status(404).json({ error: 'Not found' })

    let newActiveId = null
    if (program.isActive) {
      const next = await Schedule.findOneAndUpdate(
        { userId: req.user._id },
        { isActive: true },
        { new: true, sort: { updatedAt: -1 } }
      )
      newActiveId = next ? next._id : null
    }

    res.json({ newActiveId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
