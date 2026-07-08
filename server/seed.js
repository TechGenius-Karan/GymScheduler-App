// Run: node server/seed.js
// Seeds test exercises and tracker logs for the first user found in the database.
// Pass an email to target a specific user: node server/seed.js user@example.com

require('dotenv').config({ path: __dirname + '/.env' })
const mongoose = require('mongoose')
const { randomUUID } = require('crypto')

const User = require('./models/User')
const ExerciseMaster = require('./models/ExerciseMaster')
const GymTracker = require('./models/GymTracker')
const TrainerSlot = require('./models/TrainerSlot')
const TrainerSchedule = require('./models/TrainerSchedule')
const Review = require('./models/Review')

const TEST_TRAINER = {
  googleId: 'seed-trainer-001',
  email: 'testtrainer@gymscheduler.dev',
  name: 'Alex Rivera',
  picture: '',
  firstLogin: false,
  isTrainer: true,
  trainerProfile: {
    bio: 'Certified personal trainer with 8 years of experience in strength and conditioning. Specialise in powerlifting and body recomposition.',
    certifications: 'NASM-CPT, CSCS, Precision Nutrition Level 1',
    gymName: 'Iron Peak Fitness',
    location: 'Mumbai, Maharashtra',
    averageRating: 4.7,
    reviewCount: 23,
  },
}

const EXERCISES = [
  // Chest
  { name: 'Bench Press',            description: 'Barbell flat bench press',           muscleImpact: ['chest', 'triceps', 'shoulders'] },
  { name: 'Incline Dumbbell Press', description: 'Upper chest focus',                  muscleImpact: ['chest', 'shoulders'] },
  { name: 'Cable Fly',              description: 'Cable crossover fly',                muscleImpact: ['chest'] },
  // Back
  { name: 'Deadlift',               description: 'Conventional barbell deadlift',      muscleImpact: ['back', 'glutes', 'hamstrings'] },
  { name: 'Pull-Up',                description: 'Bodyweight pull-up',                 muscleImpact: ['back', 'biceps'] },
  { name: 'Barbell Row',            description: 'Bent-over barbell row',              muscleImpact: ['back', 'biceps'] },
  { name: 'Lat Pulldown',           description: 'Cable lat pulldown',                 muscleImpact: ['back', 'biceps'] },
  // Shoulders
  { name: 'Overhead Press',         description: 'Barbell strict press',               muscleImpact: ['shoulders', 'triceps'] },
  { name: 'Lateral Raise',          description: 'Dumbbell lateral raise',             muscleImpact: ['shoulders'] },
  { name: 'Face Pull',              description: 'Cable face pull for rear delts',     muscleImpact: ['shoulders', 'back'] },
  // Arms
  { name: 'Barbell Curl',           description: 'Standing barbell bicep curl',        muscleImpact: ['biceps'] },
  { name: 'Tricep Pushdown',        description: 'Cable rope pushdown',                muscleImpact: ['triceps'] },
  { name: 'Hammer Curl',            description: 'Dumbbell hammer curl',               muscleImpact: ['biceps', 'forearms'] },
  // Legs
  { name: 'Squat',                  description: 'Barbell back squat',                 muscleImpact: ['quads', 'glutes', 'hamstrings'] },
  { name: 'Romanian Deadlift',      description: 'Barbell RDL for hamstrings',         muscleImpact: ['hamstrings', 'glutes', 'back'] },
  { name: 'Leg Press',              description: '45-degree leg press machine',        muscleImpact: ['quads', 'glutes'] },
  { name: 'Leg Curl',               description: 'Seated or lying leg curl machine',  muscleImpact: ['hamstrings'] },
  { name: 'Calf Raise',             description: 'Standing or seated calf raise',      muscleImpact: ['calves'] },
  // Core
  { name: 'Plank',                  description: 'Isometric core hold',                muscleImpact: ['core'] },
  { name: 'Cable Crunch',           description: 'Kneeling cable crunch',              muscleImpact: ['core'] },
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

async function seedExercises(userId) {
  const existing = await ExerciseMaster.countDocuments({ createdBy: userId })
  if (existing > 0) {
    console.log(`  Exercises: user already has ${existing} — skipping.`)
    return await ExerciseMaster.find({ createdBy: userId })
  }
  const docs = EXERCISES.map(ex => ({
    id: randomUUID(),
    name: ex.name,
    description: ex.description,
    muscleImpact: ex.muscleImpact,
    createdBy: userId,
  }))
  await ExerciseMaster.insertMany(docs)
  console.log(`  Exercises: seeded ${docs.length}.`)
  return docs
}

async function seedTracker(userId, exercises) {
  const existing = await GymTracker.countDocuments({ userId })
  if (existing > 0) {
    console.log(`  Tracker: user already has ${existing} logs — skipping.`)
    return
  }

  // Pick a few exercises by name for realistic daily logs
  const byName = name => exercises.find(e => e.name === name)

  const logs = [
    {
      id: randomUUID(),
      userId,
      date: daysAgo(6),
      exercises: [
        { exerciseId: byName('Bench Press').id,        exerciseName: 'Bench Press',        plannedSets: 4, plannedReps: 8,  actualSets: 4, actualReps: 7,  notes: 'Felt strong, slight shoulder tightness' },
        { exerciseId: byName('Incline Dumbbell Press').id, exerciseName: 'Incline Dumbbell Press', plannedSets: 3, plannedReps: 10, actualSets: 3, actualReps: 10 },
        { exerciseId: byName('Cable Fly').id,           exerciseName: 'Cable Fly',           plannedSets: 3, plannedReps: 12, actualSets: 3, actualReps: 12 },
        { exerciseId: byName('Tricep Pushdown').id,     exerciseName: 'Tricep Pushdown',     plannedSets: 3, plannedReps: 12, actualSets: 3, actualReps: 10 },
      ],
    },
    {
      id: randomUUID(),
      userId,
      date: daysAgo(5),
      exercises: [
        { exerciseId: byName('Deadlift').id,     exerciseName: 'Deadlift',     plannedSets: 4, plannedReps: 5,  actualSets: 4, actualReps: 5,  notes: 'PB attempt — hit 140kg' },
        { exerciseId: byName('Pull-Up').id,      exerciseName: 'Pull-Up',      plannedSets: 4, plannedReps: 8,  actualSets: 4, actualReps: 7 },
        { exerciseId: byName('Barbell Row').id,  exerciseName: 'Barbell Row',  plannedSets: 3, plannedReps: 10, actualSets: 3, actualReps: 10 },
        { exerciseId: byName('Barbell Curl').id, exerciseName: 'Barbell Curl', plannedSets: 3, plannedReps: 10, actualSets: 3, actualReps: 9 },
      ],
    },
    {
      id: randomUUID(),
      userId,
      date: daysAgo(3),
      exercises: [
        { exerciseId: byName('Squat').id,             exerciseName: 'Squat',             plannedSets: 5, plannedReps: 5,  actualSets: 5, actualReps: 5,  notes: 'Legs were heavy from Tuesday' },
        { exerciseId: byName('Romanian Deadlift').id, exerciseName: 'Romanian Deadlift', plannedSets: 3, plannedReps: 10, actualSets: 3, actualReps: 10 },
        { exerciseId: byName('Leg Press').id,         exerciseName: 'Leg Press',         plannedSets: 3, plannedReps: 12, actualSets: 2, actualReps: 12, notes: 'Cut last set short' },
        { exerciseId: byName('Calf Raise').id,        exerciseName: 'Calf Raise',        plannedSets: 4, plannedReps: 15, actualSets: 4, actualReps: 15 },
      ],
    },
    {
      id: randomUUID(),
      userId,
      date: daysAgo(1),
      exercises: [
        { exerciseId: byName('Overhead Press').id, exerciseName: 'Overhead Press', plannedSets: 4, plannedReps: 8,  actualSets: 4, actualReps: 8 },
        { exerciseId: byName('Lateral Raise').id,  exerciseName: 'Lateral Raise',  plannedSets: 4, plannedReps: 15, actualSets: 4, actualReps: 15 },
        { exerciseId: byName('Face Pull').id,       exerciseName: 'Face Pull',      plannedSets: 3, plannedReps: 15, actualSets: 3, actualReps: 15 },
        { exerciseId: byName('Hammer Curl').id,     exerciseName: 'Hammer Curl',    plannedSets: 3, plannedReps: 12, actualSets: 3, actualReps: 10 },
      ],
    },
  ]

  await GymTracker.insertMany(logs)
  console.log(`  Tracker: seeded ${logs.length} workout logs.`)
}

async function seedSlots(trainerId) {
  const existing = await TrainerSlot.countDocuments({ trainerId })
  if (existing > 0) {
    console.log(`  Slots: trainer already has ${existing} slots — skipping.`)
    return
  }

  function daysFromNow(n) {
    const d = new Date()
    d.setDate(d.getDate() + n)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const slots = [
    // Next week — open slots
    { id: randomUUID(), trainerId, date: daysFromNow(1), startTime: '07:00', endTime: '08:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    { id: randomUUID(), trainerId, date: daysFromNow(1), startTime: '09:00', endTime: '10:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    { id: randomUUID(), trainerId, date: daysFromNow(2), startTime: '07:00', endTime: '08:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    { id: randomUUID(), trainerId, date: daysFromNow(2), startTime: '18:00', endTime: '19:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    { id: randomUUID(), trainerId, date: daysFromNow(4), startTime: '07:00', endTime: '08:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    { id: randomUUID(), trainerId, date: daysFromNow(4), startTime: '10:00', endTime: '11:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    { id: randomUUID(), trainerId, date: daysFromNow(5), startTime: '09:00', endTime: '10:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    { id: randomUUID(), trainerId, date: daysFromNow(7), startTime: '08:00', endTime: '09:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: false },
    // A couple already booked
    { id: randomUUID(), trainerId, date: daysFromNow(3), startTime: '07:00', endTime: '08:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: true },
    { id: randomUUID(), trainerId, date: daysFromNow(6), startTime: '18:00', endTime: '19:00', gymName: 'Iron Peak Fitness', location: 'Mumbai, Maharashtra', isBooked: true },
  ]

  await TrainerSlot.insertMany(slots)
  console.log(`  Slots: seeded ${slots.length} (${slots.filter(s => !s.isBooked).length} open, ${slots.filter(s => s.isBooked).length} booked).`)
}

async function seedBookings(traineeId, trainerId) {
  const existing = await TrainerSchedule.countDocuments({ $or: [{ trainerId }, { traineeId }] })
  if (existing > 0) {
    console.log(`  Bookings: already has ${existing} bookings — skipping.`)
    return
  }

  // Grab the two booked slots to link them to bookings
  const bookedSlots = await TrainerSlot.find({ trainerId, isBooked: true }).limit(2)

  const bookings = [
    // Confirmed booking — linked to first booked slot
    {
      id: randomUUID(),
      trainerId,
      traineeId,
      slotId: bookedSlots[0]?._id ?? null,
      date: bookedSlots[0]?.date ?? daysAgo(3),
      startTime: bookedSlots[0]?.startTime ?? '07:00',
      endTime: bookedSlots[0]?.endTime ?? '08:00',
      initiatedBy: 'trainee',
      traineeApproved: true,
      trainerApproved: true,
      status: 'confirmed',
      notes: 'Focus on squat form and programming review',
    },
    // Pending trainer approval — linked to second booked slot
    {
      id: randomUUID(),
      trainerId,
      traineeId,
      slotId: bookedSlots[1]?._id ?? null,
      date: bookedSlots[1]?.date ?? daysAgo(1),
      startTime: bookedSlots[1]?.startTime ?? '18:00',
      endTime: bookedSlots[1]?.endTime ?? '19:00',
      initiatedBy: 'trainee',
      traineeApproved: true,
      trainerApproved: false,
      status: 'pending_trainer_approval',
    },
    // Completed past session — no slot linked
    {
      id: randomUUID(),
      trainerId,
      traineeId,
      slotId: null,
      date: daysAgo(10),
      startTime: '09:00',
      endTime: '10:00',
      initiatedBy: 'trainee',
      traineeApproved: true,
      trainerApproved: true,
      status: 'completed',
      notes: 'First introductory session',
    },
    // Cancelled booking — no slot linked
    {
      id: randomUUID(),
      trainerId,
      traineeId,
      slotId: null,
      date: daysAgo(5),
      startTime: '07:00',
      endTime: '08:00',
      initiatedBy: 'trainee',
      traineeApproved: true,
      trainerApproved: false,
      status: 'cancelled',
      cancelledBy: 'trainee',
      cancellationReason: 'Schedule conflict',
    },
  ]

  await TrainerSchedule.insertMany(bookings)
  console.log(`  Bookings: seeded ${bookings.length} (confirmed, pending, completed, cancelled).`)
}

async function seedReviews(traineeId, trainerId) {
  const existing = await Review.countDocuments({ trainerId })
  if (existing > 0) {
    console.log(`  Reviews: already has ${existing} reviews — skipping.`)
    return
  }

  const completedBooking = await TrainerSchedule.findOne({ trainerId, traineeId, status: 'completed' })
  if (!completedBooking) {
    console.log('  Reviews: no completed booking found — skipping.')
    return
  }

  const review = await Review.create({
    id: randomUUID(),
    bookingId: completedBooking._id,
    traineeId,
    trainerId,
    rating: 5,
    comment: 'Alex is an excellent trainer. Very knowledgeable about programming and form cues. Would highly recommend for anyone serious about strength training.',
  })

  // Update cached stats on trainer profile
  await User.findByIdAndUpdate(trainerId, {
    'trainerProfile.averageRating': 4.7,
    'trainerProfile.reviewCount': 24,
  })

  console.log(`  Reviews: seeded 1 review (rating: ${review.rating}/5).`)
}

async function seedTrainer() {
  const existing = await User.findOne({ googleId: TEST_TRAINER.googleId })
  if (existing) {
    console.log('  Trainer: test trainer already exists — skipping.')
    return existing
  }
  const trainer = await User.create(TEST_TRAINER)
  console.log(`  Trainer: created test trainer "${trainer.name}" (${trainer.email}).`)
  return trainer
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const emailArg = process.argv[2]
  const user = emailArg
    ? await User.findOne({ email: emailArg })
    : await User.findOne({ googleId: { $ne: TEST_TRAINER.googleId } })

  if (!user) {
    console.error(emailArg ? `No user found with email: ${emailArg}` : 'No users found. Log in first.')
    process.exit(1)
  }

  console.log(`Seeding data for: ${user.name} (${user.email})`)

  const exercises = await seedExercises(user._id)
  await seedTracker(user._id, exercises)
  const trainer = await seedTrainer()
  await seedSlots(trainer._id)
  await seedBookings(user._id, trainer._id)
  await seedReviews(user._id, trainer._id)

  console.log('Done.')
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
