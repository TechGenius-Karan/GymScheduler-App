const express = require('express')
const router = express.Router()
const TrainerSchedule = require('../models/TrainerSchedule')
const TrainerSlot = require('../models/TrainerSlot')
const authMiddleware = require('../middleware/authMiddleware')

// GET /api/bookings — all bookings for the current user (as trainer or trainee)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await TrainerSchedule.find({
      $or: [{ trainerId: req.user.id }, { traineeId: req.user.id }],
    }).sort({ date: -1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/bookings — create a booking request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { trainerId, traineeId, slotId, date, startTime, endTime, notes } = req.body
    const userId = req.user.id.toString()

    // Determine who is initiating
    const isTrainer = userId === (trainerId || '').toString()
    const isTrainee = userId === (traineeId || '').toString()
    if (!isTrainer && !isTrainee) {
      return res.status(403).json({ error: 'You must be the trainer or trainee to create a booking' })
    }

    const initiatedBy = isTrainer ? 'trainer' : 'trainee'
    const traineeApproved = initiatedBy === 'trainee'
    const trainerApproved = initiatedBy === 'trainer'
    const status = initiatedBy === 'trainee' ? 'pending_trainer_approval' : 'pending_trainee_approval'

    const booking = await TrainerSchedule.create({
      trainerId,
      traineeId,
      slotId: slotId || null,
      date,
      startTime,
      endTime,
      initiatedBy,
      traineeApproved,
      trainerApproved,
      status,
      notes,
    })

    // Hold the slot immediately when trainee initiates
    if (initiatedBy === 'trainee' && slotId) {
      await TrainerSlot.findByIdAndUpdate(slotId, { isBooked: true })
    }

    res.status(201).json(booking)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/bookings/:id/confirm — approve the booking (sets caller's side to true)
router.patch('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const booking = await TrainerSchedule.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ error: `Cannot confirm a ${booking.status} booking` })
    }

    const userId = req.user.id.toString()
    const isTrainer = userId === booking.trainerId.toString()
    const isTrainee = userId === booking.traineeId.toString()
    if (!isTrainer && !isTrainee) {
      return res.status(403).json({ error: 'Not a participant in this booking' })
    }

    if (isTrainer) booking.trainerApproved = true
    if (isTrainee) booking.traineeApproved = true

    if (booking.trainerApproved && booking.traineeApproved) {
      booking.status = 'confirmed'
    }

    await booking.save()
    res.json(booking)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/bookings/:id/cancel — cancel a booking at any stage
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await TrainerSchedule.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' })
    }

    const userId = req.user.id.toString()
    const isTrainer = userId === booking.trainerId.toString()
    const isTrainee = userId === booking.traineeId.toString()
    if (!isTrainer && !isTrainee) {
      return res.status(403).json({ error: 'Not a participant in this booking' })
    }

    booking.status = 'cancelled'
    booking.cancelledBy = isTrainer ? 'trainer' : 'trainee'
    booking.cancellationReason = req.body.cancellationReason || null

    // Free the slot if one was held
    if (booking.slotId) {
      await TrainerSlot.findByIdAndUpdate(booking.slotId, { isBooked: false })
    }

    await booking.save()
    res.json(booking)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
