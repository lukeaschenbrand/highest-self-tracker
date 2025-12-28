// Utility to backfill data for past days
import { formatDate, parseDate } from './scoring'
import { saveLogEntry, saveMetricEntry, saveProjectStartDate, loadProjectStartDate } from './storage'
import { loadTasks } from './storage'
import { getDefaultTasks } from './tasks'

/**
 * Backfill empty entries for a date range
 * This creates blank entries so the dates appear in the system
 */
export function backfillDateRange(startDate, endDate) {
  const tasks = loadTasks()
  if (tasks.length === 0) {
    const defaultTasks = getDefaultTasks()
    // We'll use the tasks from storage, but if empty, we need to save defaults first
    // This should be handled by the app initialization
  }
  
  const dates = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  // For each date, we don't create entries - blank dates are handled by the scoring system
  // But we can create placeholder metric entries if needed
  const created = []
  
  dates.forEach(date => {
    const dateStr = formatDate(date)
    // We don't create log entries for blank days - that's by design
    // But we could create empty metric entries if you want them to show up
    // For now, we'll just return the dates that would be backfilled
    created.push(dateStr)
  })
  
  return created
}

/**
 * Initialize project with start date
 * Creates the initial state for tracking
 */
export async function initializeProject(startDateString) {
  // Parse the start date (format: YYYY-MM-DD or MM/DD/YYYY)
  let startDate
  if (startDateString.includes('/')) {
    const [month, day, year] = startDateString.split('/')
    startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  } else {
    startDate = parseDate(startDateString)
  }
  
  const today = new Date()
  const dates = []
  const current = new Date(startDate)
  
  while (current <= today) {
    dates.push(formatDate(new Date(current)))
    current.setDate(current.getDate() + 1)
  }
  
  // Store the project start date
  await saveProjectStartDate(formatDate(startDate))
  
  return {
    startDate: formatDate(startDate),
    today: formatDate(today),
    totalDays: dates.length,
    dates: dates
  }
}

/**
 * Get project start date from storage
 */
export async function getProjectStartDate() {
  const stored = await loadProjectStartDate()
  if (stored) {
    return parseDate(stored)
  }
  // Default to today if not set
  return new Date()
}

