const express = require('express')
const router = express.Router()
const TrainerSlot = require('../models/TrainerSlot')
const authMiddleware = require('../middleware/authMiddleware')

// GET /api/slots — all slots for the logged-in trainer
router.get('/', authMiddleware, async (req, res) => {
  try {
    const slots = await TrainerSlot.find({ trainerId: req.user.id }).sort({ date: 1, startTime: 1 })
    res.json(slots)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/slots/:trainerId — public: open slots for a specific trainer
router.get('/:trainerId', async (req, res) => {
  try {
    const slots = await TrainerSlot.find({
      trainerId: req.params.trainerId,
      isBooked: false,
    }).sort({ date: 1, startTime: 1 })
    res.json(slots)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/slots — create one slot or an array of slots
router.post('/', authMiddleware, async (req, res) => {
  try {
    const payload = req.body
    if (Array.isArray(payload)) {
      const slots = payload.map(s => ({ ...s, trainerId: req.user.id }))
      const created = await TrainerSlot.insertMany(slots)
      return res.status(201).json(created)
    }
    const slot = await TrainerSlot.create({ ...payload, trainerId: req.user.id })
    res.status(201).json(slot)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/slots/:id — edit a slot (only if not booked)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const slot = await TrainerSlot.findOne({ id: req.params.id, trainerId: req.user.id })
    if (!slot) return res.status(404).json({ error: 'Slot not found' })
    if (slot.isBooked) return res.status(400).json({ error: 'Cannot edit a booked slot' })

    const { date, startTime, endTime, gymName, location, recurrenceRule } = req.body
    if (date !== undefined) slot.date = date
    if (startTime !== undefined) slot.startTime = startTime
    if (endTime !== undefined) slot.endTime = endTime
    if (gymName !== undefined) slot.gymName = gymName
    if (location !== undefined) slot.location = location
    if (recurrenceRule !== undefined) slot.recurrenceRule = recurrenceRule

    await slot.save()
    res.json(slot)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/slots/:id — remove a slot (only if not booked)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const slot = await TrainerSlot.findOne({ id: req.params.id, trainerId: req.user.id })
    if (!slot) return res.status(404).json({ error: 'Slot not found' })
    if (slot.isBooked) return res.status(400).json({ error: 'Cannot delete a booked slot' })

    await slot.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
