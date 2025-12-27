// Scoring logic for Highest Self calculation

export function calculateScore(logEntries, tasks, date, pillar = null) {
  // Filter tasks by pillar if specified
  let relevantTasks = pillar 
    ? tasks.filter(t => t.pillar === pillar)
    : tasks
  
  // Filter tasks that are active on this date
  const dayOfWeek = date.getDay()
  relevantTasks = relevantTasks.filter(task => {
    if (task.frequency === 'weekly') return true
    return task.active_days.includes(dayOfWeek)
  })
  
  if (relevantTasks.length === 0) return null
  
  let numerator = 0
  let denominator = 0
  
  relevantTasks.forEach(task => {
    // Weekly tasks are excluded from daily scoring
    // They're tracked separately for weekly progress
    if (task.frequency === 'weekly') {
      return
    }
    
    const entry = logEntries.find(
      e => e.task_id === task.id && e.date === formatDate(date)
    )
    
    if (!entry) {
      // No entry = blank, excluded from calculation
      return
    }
    
    if (entry.status === 'P') {
      // Pass = excluded from denominator
      return
    }
    
    // Include in denominator
    denominator += task.weight
    
    // Handle numeric tasks (Tweets 0-3, TikTok any number)
    if (task.label && task.label.includes('Tweets')) {
      const tweetCount = parseInt(entry.status) || 0
      if (tweetCount >= 3) {
        numerator += task.weight
      }
    } else if (task.label === 'TikTok' && task.is_numeric) {
      const tiktokCount = parseInt(entry.status) || 0
      if (tiktokCount > 0) {
        numerator += task.weight
      }
    } else if (entry.status === 'Y') {
      // Yes = counts toward numerator
      numerator += task.weight
    }
    // N = 0, already counted in denominator
  })
  
  if (denominator === 0) return null
  
  return Math.round((numerator / denominator) * 100)
}

export function calculatePeriodScore(logEntries, tasks, startDate, endDate, pillar = null) {
  const dates = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  let totalNumerator = 0
  let totalDenominator = 0
  
  dates.forEach(date => {
    const dayOfWeek = date.getDay()
    let relevantTasks = pillar 
      ? tasks.filter(t => t.pillar === pillar)
      : tasks
    
    relevantTasks = relevantTasks.filter(task => {
      if (task.frequency === 'weekly') return true
      return task.active_days.includes(dayOfWeek)
    })
    
    relevantTasks.forEach(task => {
      // Weekly tasks are excluded from daily scoring
      if (task.frequency === 'weekly') {
        return
      }
      
      const entry = logEntries.find(
        e => e.task_id === task.id && e.date === formatDate(date)
      )
      
      if (!entry) return // Blank day, excluded
      if (entry.status === 'P') return // Pass, excluded
      
      totalDenominator += task.weight
      
      // Handle numeric tasks (Tweets 0-3, TikTok any number)
      if (task.label && task.label.includes('Tweets')) {
        const tweetCount = parseInt(entry.status) || 0
        if (tweetCount >= 3) {
          totalNumerator += task.weight
        }
      } else if (task.label === 'TikTok' && task.is_numeric) {
        const tiktokCount = parseInt(entry.status) || 0
        if (tiktokCount > 0) {
          totalNumerator += task.weight
        }
      } else if (entry.status === 'Y') {
        totalNumerator += task.weight
      }
    })
  })
  
  if (totalDenominator === 0) return null
  
  return Math.round((totalNumerator / totalDenominator) * 100)
}

export function formatDate(date) {
  if (typeof date === 'string') return date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Get week start (Monday) for a given date
export function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

// Get week end (Sunday) for a given date
export function getWeekEnd(date) {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  return weekEnd
}

// Get month start
export function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Get month end
export function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Get year start
export function getYearStart(date) {
  return new Date(date.getFullYear(), 0, 1)
}

// Get year end
export function getYearEnd(date) {
  return new Date(date.getFullYear(), 11, 31)
}

