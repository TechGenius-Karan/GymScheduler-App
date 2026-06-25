const mongoose = require('mongoose')
const { randomUUID } = require('crypto')

const trainerScheduleSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID() },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    traineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainerSlot', default: null },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    initiatedBy: { type: String, enum: ['trainer', 'trainee'], required: true },
    traineeApproved: { type: Boolean, default: false },
    trainerApproved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending_trainer_approval', 'pending_trainee_approval', 'confirmed', 'cancelled', 'completed'],
      required: true,
    },
    cancelledBy: { type: String, enum: ['trainer', 'trainee', null], default: null },
    cancellationReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('TrainerSchedule', trainerScheduleSchema)
