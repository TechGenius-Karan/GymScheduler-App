const mongoose = require('mongoose')
const { randomUUID } = require('crypto')

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID() },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainerSchedule', required: true, unique: true },
    traineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

module.exports = mongoose.model('Review', reviewSchema)
