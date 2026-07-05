const PHRASES = [
  {
    keywords: ['full'],
    phrases: [
      'No muscle left behind.',
      'A little bit of suffering for every body part.',
      'Every muscle gets a turn.',
      'Covering all bases today.',
    ],
  },
  {
    keywords: ['push', 'chest'],
    phrases: [
      'Chest day is the best day.',
      'Pushing problems away one rep at a time.',
      'Bench first, questions later.',
      'Chest, shoulders, triceps. The holy trinity.',
      'The day everyone magically finds the bench.',
    ],
  },
  {
    keywords: ['pull'],
    phrases: [
      'Back is the new chest.',
      'Time to grow the wings.',
      'Pulling ourselves together.',
      'Rows before bros.',
      "Building the muscles you can't see.",
      'Because posture deserves love too.',
    ],
  },
  {
    keywords: ['leg'],
    phrases: [
      "Legs day \u{1F629} let's get it.",
      'The character-building session.',
      'Nobody wants to be the upside-down triangle.',
      "Today's goal: sit down carefully.",
      'Leg day. No further explanation needed.',
    ],
  },
  {
    keywords: ['arm'],
    phrases: [
      'Time to fill those sleeves.',
      'Ticket sales for the gun show.',
      'One curl closer to greatness.',
      'Sleeves under pressure.',
      'Because everyone asks about arms.',
    ],
  },
  {
    keywords: ['shoulder', 'delt'],
    phrases: [
      'Building coat hangers.',
      'Making doorways feel smaller.',
      'The secret to looking bigger.',
      'Putting the cap in shoulder caps.',
      'Wider from every angle.',
      'The V-taper workshop.',
    ],
  },
  {
    keywords: ['upper'],
    phrases: [
      'All the good stuff in one session.',
      'Making T-shirts fit properly.',
      'Built for handshakes and carrying groceries.',
      'The mirror muscles are getting attention today.',
      "Because nobody asks how much you squat.",
      "Sleeves aren't going to fill themselves.",
      "Putting the 'up' in upper body.",
    ],
  },
  {
    keywords: ['lower'],
    phrases: [
      'Basically legs, but you get to call it something nicer.',
      'Walking tomorrow is optional.',
      'Building the foundation.',
      'Your future knees will thank you.',
      "Gravity's toughest opponent.",
    ],
  },
  {
    keywords: ['back'],
    phrases: [
      'Growing wings, one row at a time.',
      'Out of sight, not out of mind.',
      'Making backpacks easier.',
      'Building the superhero silhouette.',
      'Future chiropractor bills reduced.',
    ],
  },
  {
    keywords: ['cardio'],
    phrases: [
      'Running from your problems.',
      'Breathing heavily for health.',
      'Heart gains count too.',
      'The longest 20 minutes of the day.',
      "Because fitness isn't just muscles.",
      "Trying to convince my lungs this is fun.",
    ],
  },
  {
    keywords: ['core', 'abs'],
    phrases: [
      "They're already there. Just need to uncover them.",
      "Abs are made in the kitchen, but we're helping.",
      'Future beach photos are decided here.',
    ],
  },
]

const GENERIC_PHRASES = [
  "Let's make future you proud.",
  "Just show up. We'll handle the rest.",
  'A bad workout still counts.',
  'One workout closer.',
  'Consistency beats motivation.',
  "Today's effort, tomorrow's results.",
  "You came. That's the hard part.",
  "Progress is boring until it isn't.",
]

// Detects combined split names like "Chest/Back", "Push & Pull", "Upper + Lower"
const COMBINED_SPLIT = /[\/&+]|\band\b/

// Uses the day name as a stable seed so the phrase is consistent per day.
function stableIndex(seed, length) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffff
  }
  return hash % length
}

export function getDayPhrase(splitName, dayName = '') {
  if (!splitName?.trim()) return GENERIC_PHRASES[stableIndex(dayName, GENERIC_PHRASES.length)]
  const lower = splitName.toLowerCase()

  // Combined splits (e.g. "Chest/Back") → generic
  if (!COMBINED_SPLIT.test(lower)) {
    for (const { keywords, phrases } of PHRASES) {
      if (keywords.some(k => lower.includes(k))) {
        return phrases[stableIndex(dayName, phrases.length)]
      }
    }
  }

  return GENERIC_PHRASES[stableIndex(dayName, GENERIC_PHRASES.length)]
}

const REST_PHRASES = [
  name => (name ? `Rest up, ${name}. Recovery is gains.` : 'Rest up. Recovery is gains.'),
  name => (name ? `The gains happen here, ${name}. Enjoy it.` : 'The gains happen here. Enjoy it.'),
  () => 'Doing absolutely everything by doing nothing.',
  () => 'Your muscles are clocking in today.',
  () => 'Trust the process. Stay out of the gym.',
  () => 'Recovery is training too.',
]

export function getRestPhrase(restIndex, firstName) {
  return REST_PHRASES[restIndex % REST_PHRASES.length](firstName)
}
