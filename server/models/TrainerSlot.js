const mongoose = require('mongoose')
const { randomUUID } = require('crypto')

const trainerSlotSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID() },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    gymName: { type: String },
    location: { type: String },
    isBooked: { type: Boolean, default: false },
    recurrenceRule: { type: String, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('TrainerSlot', trainerSlotSchema)
