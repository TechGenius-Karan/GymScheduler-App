const express = require('express')
const router = express.Router()
const Review = require('../models/Review')
const TrainerSchedule = require('../models/TrainerSchedule')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

// POST /api/reviews — submit a review (booking must be completed)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body

    const booking = await TrainerSchedule.findById(bookingId)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review a completed booking' })
    }
    if (booking.traineeId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Only the trainee can submit a review' })
    }

    const review = await Review.create({
      bookingId,
      traineeId: booking.traineeId,
      trainerId: booking.trainerId,
      rating,
      comment,
    })

    // Update cached averageRating and reviewCount on the trainer's profile
    const stats = await Review.aggregate([
      { $match: { trainerId: booking.trainerId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    if (stats.length > 0) {
      const { avg, count } = stats[0]
      await User.findByIdAndUpdate(booking.trainerId, {
        'trainerProfile.averageRating': Math.round(avg * 10) / 10,
        'trainerProfile.reviewCount': count,
      })
    }

    res.status(201).json(review)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A review for this booking already exists' })
    }
    res.status(400).json({ error: err.message })
  }
})

// GET /api/reviews/:trainerId — public: all reviews for a trainer
router.get('/:trainerId', async (req, res) => {
  try {
    const reviews = await Review.find({ trainerId: req.params.trainerId }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
