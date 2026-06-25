const express = require('express')
const router = express.Router()
const GymTracker = require('../models/GymTracker')
const authMiddleware = require('../middleware/authMiddleware')

// GET /api/tracker or /api/tracker?date=YYYY-MM-DD
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = { userId: req.user.id }
    if (req.query.date) {
      const start = new Date(req.query.date)
      const end = new Date(req.query.date)
      end.setDate(end.getDate() + 1)
      query.date = { $gte: start, $lt: end }
    }
    const logs = await GymTracker.find(query).sort({ date: -1 })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tracker — save/overwrite a workout log for a given date
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, scheduleId, dayCardId, exercises } = req.body
    if (!date) return res.status(400).json({ error: 'date is required' })

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    const log = await GymTracker.findOneAndUpdate(
      { userId: req.user.id, date: parsedDate },
      { scheduleId, dayCardId, exercises },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    )
    res.json(log)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
