const mongoose = require('mongoose')
const { randomUUID } = require('crypto')

const logEntrySchema = new mongoose.Schema({
  exerciseId: { type: String, required: true },
  exerciseName: { type: String, required: true },
  plannedSets: { type: Number },
  plannedReps: { type: Number },
  actualSets: { type: Number },
  actualReps: { type: Number },
  notes: { type: String },
})

const gymTrackerSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID() },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
    dayCardId: { type: String },
    exercises: { type: [logEntrySchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

gymTrackerSchema.index({ userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('GymTracker', gymTrackerSchema)
