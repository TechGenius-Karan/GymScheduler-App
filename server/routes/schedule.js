const router = require('express').Router()
const Schedule = require('../models/Schedule')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

// GET /api/schedule — return user's schedule or null
router.get('/', authMiddleware, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ userId: req.user.id })
    res.json(schedule ?? null)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/schedule — create or overwrite user's schedule
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { days } = req.body
    if (!Array.isArray(days) || days.length !== 7) {
      return res.status(400).json({ message: 'days must be an array of 7 entries' })
    }

    const existing = await Schedule.findOne({ userId: req.user.id })
    const isFirstSave = !existing

    let schedule
    if (existing) {
      existing.days = Schedule.fromJSON(req.user.id, days).days
      existing.updatedAt = new Date()
      schedule = await existing.save()
    } else {
      schedule = await Schedule.fromJSON(req.user.id, days).save()
    }

    if (isFirstSave) {
      await User.findByIdAndUpdate(req.user.id, { firstLogin: false })
    }

    res.json(schedule)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

module.exports = router
