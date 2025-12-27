// LocalStorage utilities for offline-first data persistence

const STORAGE_KEYS = {
  TASKS: 'hst_tasks',
  LOG_ENTRIES: 'hst_log_entries',
  METRIC_ENTRIES: 'hst_metric_entries',
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
    return true
  } catch (error) {
    console.error('Failed to save tasks:', error)
    return false
  }
}

export function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load tasks:', error)
    return []
  }
}

export function saveLogEntry(entry) {
  try {
    const entries = loadLogEntries()
    const existingIndex = entries.findIndex(
      e => e.date === entry.date && e.task_id === entry.task_id
    )
    
    if (existingIndex >= 0) {
      entries[existingIndex] = entry
    } else {
      entries.push(entry)
    }
    
    localStorage.setItem(STORAGE_KEYS.LOG_ENTRIES, JSON.stringify(entries))
    return true
  } catch (error) {
    console.error('Failed to save log entry:', error)
    return false
  }
}

export function loadLogEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOG_ENTRIES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load log entries:', error)
    return []
  }
}

export function saveMetricEntry(entry) {
  try {
    const entries = loadMetricEntries()
    const existingIndex = entries.findIndex(e => e.date === entry.date)
    
    if (existingIndex >= 0) {
      entries[existingIndex] = entry
    } else {
      entries.push(entry)
    }
    
    localStorage.setItem(STORAGE_KEYS.METRIC_ENTRIES, JSON.stringify(entries))
    return true
  } catch (error) {
    console.error('Failed to save metric entry:', error)
    return false
  }
}

export function loadMetricEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.METRIC_ENTRIES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load metric entries:', error)
    return []
  }
}

export function getLogEntry(date, taskId) {
  const entries = loadLogEntries()
  return entries.find(e => e.date === date && e.task_id === taskId)
}

export function getMetricEntry(date) {
  const entries = loadMetricEntries()
  return entries.find(e => e.date === date)
}

// Export all data as JSON
export function exportData() {
  return {
    tasks: loadTasks(),
    logEntries: loadLogEntries(),
    metricEntries: loadMetricEntries(),
    exportedAt: new Date().toISOString(),
  }
}

// Import data
export function importData(data) {
  try {
    if (data.tasks) saveTasks(data.tasks)
    if (data.logEntries) {
      data.logEntries.forEach(entry => saveLogEntry(entry))
    }
    if (data.metricEntries) {
      data.metricEntries.forEach(entry => saveMetricEntry(entry))
    }
    return true
  } catch (error) {
    console.error('Failed to import data:', error)
    return false
  }
}

