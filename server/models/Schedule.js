const mongoose = require('mongoose')
const { randomUUID } = require('crypto')
const { exerciseSchema } = require('./Exercise')

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const daySchema = new mongoose.Schema({
  day: { type: String, required: true, enum: DAYS_OF_WEEK },
  isRest: { type: Boolean, default: false },
  splitName: { type: String, default: '' },
  exercises: { type: [exerciseSchema], default: [] },
})

const scheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  programName: { type: String, required: true },
  goal: { type: String },
  isActive: { type: Boolean, default: false },
  days: { type: [daySchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
})

class Schedule {
  getDay(dayName) {
    return this.days.find(d => d.day === dayName) ?? null
  }

  static buildBlank(userId, programName, goal) {
    return new ScheduleModel({
      userId,
      programName,
      goal,
      days: DAYS_OF_WEEK.map(day => ({
        day,
        isRest: false,
        splitName: '',
        exercises: [],
      })),
    })
  }

  static fromJSON(userId, programName, goal, days) {
    return new ScheduleModel({
      userId,
      programName,
      goal,
      days: days.map(d => ({
        day: d.day,
        isRest: d.isRest ?? false,
        splitName: d.splitName ?? '',
        exercises: (d.exercises || []).map(ex => ({
          id: ex.id || randomUUID(),
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
        })),
      })),
      updatedAt: new Date(),
    })
  }
}

scheduleSchema.loadClass(Schedule)

const ScheduleModel = mongoose.model('Schedule', scheduleSchema)

module.exports = ScheduleModel
