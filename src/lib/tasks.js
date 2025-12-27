// Task definitions and initialization

export const PILLARS = {
  MORNING: 'Morning',
  BODY: 'Body',
  WORK: 'Work',
  WEEKLY: 'Weekly',
}

export const CATEGORIES = {
  PERSONAL: 'Personal',
  WORK: 'Work',
}

export const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  CONDITIONAL: 'conditional',
}

// Initialize default tasks
export function getDefaultTasks() {
  return [
    // Morning Pillar - Daily
    {
      id: 'morning_1',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'No phone for first 15 minutes',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7], // All days
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'morning_2',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'Stretch upon waking',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'morning_3',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'Shower within 30 minutes',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'morning_4',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'Shave',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'morning_5',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'Lay out clothes for next day',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'morning_6',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'Vitamins taken & laid out',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'morning_7',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'Breakfast eaten',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'morning_8',
      pillar: PILLARS.MORNING,
      category: CATEGORIES.PERSONAL,
      label: 'Meditated',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    
    // Body Pillar - Daily
    {
      id: 'body_1',
      pillar: PILLARS.BODY,
      category: CATEGORIES.PERSONAL,
      label: 'Steps ≥ 10,000',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    
    // Work Pillar - Daily (Mon-Sat)
    {
      id: 'work_1',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'All follow-ups sent before logging off',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'work_2',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'Tomorrow planned before logging off',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'work_3',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'LinkedIn post',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: true, // Can pass on travel days
      weight: 1,
    },
    {
      id: 'work_4',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'Tweets (3 per day)',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: true,
      weight: 1,
    },
    {
      id: 'work_5',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'TikTok',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: true,
      weight: 1,
      is_numeric: true, // Track as numeric (count of TikToks)
    },
    {
      id: 'work_6',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'Finance',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'work_7',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'Legal',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'work_8',
      pillar: PILLARS.WORK,
      category: CATEGORIES.WORK,
      label: 'Product',
      frequency: FREQUENCIES.DAILY,
      active_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      allow_pass: false,
      weight: 1,
    },
    
    // Weekly Pillar
    {
      id: 'weekly_1',
      pillar: PILLARS.WEEKLY,
      category: CATEGORIES.PERSONAL,
      label: 'Lifting - Back',
      frequency: FREQUENCIES.WEEKLY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'weekly_2',
      pillar: PILLARS.WEEKLY,
      category: CATEGORIES.PERSONAL,
      label: 'Lifting - Chest',
      frequency: FREQUENCIES.WEEKLY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'weekly_3',
      pillar: PILLARS.WEEKLY,
      category: CATEGORIES.PERSONAL,
      label: 'Lifting - Legs',
      frequency: FREQUENCIES.WEEKLY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'weekly_4',
      pillar: PILLARS.WEEKLY,
      category: CATEGORIES.PERSONAL,
      label: 'Lifting - Arms',
      frequency: FREQUENCIES.WEEKLY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'weekly_5',
      pillar: PILLARS.WEEKLY,
      category: CATEGORIES.PERSONAL,
      label: 'Cardio Session',
      frequency: FREQUENCIES.WEEKLY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'weekly_6',
      pillar: PILLARS.WEEKLY,
      category: CATEGORIES.PERSONAL,
      label: 'Mask',
      frequency: FREQUENCIES.WEEKLY,
      active_days: [6, 0], // Sat, Sun
      window_start: 6, // Saturday
      window_end: 0, // Sunday
      allow_pass: false,
      weight: 1,
    },
    {
      id: 'weekly_7',
      pillar: PILLARS.WEEKLY,
      category: CATEGORIES.PERSONAL,
      label: 'Laundry',
      frequency: FREQUENCIES.WEEKLY,
      active_days: [1, 2, 3, 4, 5, 6, 7],
      allow_pass: false,
      weight: 1,
    },
  ]
}

// Check if task is active on a given date
export function isTaskActiveOnDate(task, date) {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
  return task.active_days.includes(dayOfWeek)
}

// Get tasks for a specific date, filtered by active days
export function getTasksForDate(tasks, date) {
  return tasks.filter(task => {
    if (task.frequency === FREQUENCIES.WEEKLY) {
      // For weekly tasks, check if we're in the current week
      return true // We'll handle weekly logic in the UI
    }
    return isTaskActiveOnDate(task, date)
  })
}

