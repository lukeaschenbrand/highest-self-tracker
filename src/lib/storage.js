// Storage utilities with Supabase cloud sync and localStorage fallback
import { supabase, isSupabaseConfigured } from './supabase'

const STORAGE_KEYS = {
  TASKS: 'hst_tasks',
  LOG_ENTRIES: 'hst_log_entries',
  METRIC_ENTRIES: 'hst_metric_entries',
  PROJECT_START_DATE: 'hst_project_start_date',
}

// ========== LOCALSTORAGE FUNCTIONS (Fallback) ==========

function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error)
    return false
  }
}

function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error)
    return defaultValue
  }
}

// ========== SUPABASE FUNCTIONS ==========

async function saveTasksToSupabase(tasks) {
  if (!isSupabaseConfigured()) return false
  
  try {
    // Delete all existing tasks
    await supabase.from('tasks').delete().neq('id', '')
    
    // Insert all tasks
    if (tasks.length > 0) {
      const { error } = await supabase.from('tasks').insert(tasks)
      if (error) throw error
    }
    
    return true
  } catch (error) {
    console.error('Failed to save tasks to Supabase:', error)
    return false
  }
}

async function loadTasksFromSupabase() {
  if (!isSupabaseConfigured()) return []
  
  try {
    const { data, error } = await supabase.from('tasks').select('*').order('id')
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to load tasks from Supabase:', error)
    return []
  }
}

async function saveLogEntryToSupabase(entry) {
  if (!isSupabaseConfigured()) return false
  
  try {
    const { error } = await supabase
      .from('log_entries')
      .upsert({
        date: entry.date,
        task_id: entry.task_id,
        status: entry.status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'date,task_id'
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to save log entry to Supabase:', error)
    return false
  }
}

async function loadLogEntriesFromSupabase() {
  if (!isSupabaseConfigured()) return []
  
  try {
    const { data, error } = await supabase
      .from('log_entries')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to load log entries from Supabase:', error)
    return []
  }
}

async function saveMetricEntryToSupabase(entry) {
  if (!isSupabaseConfigured()) return false
  
  try {
    const { error } = await supabase
      .from('metric_entries')
      .upsert({
        date: entry.date,
        weight_lbs: entry.weight_lbs || null,
        sleep_hours: entry.sleep_hours || null,
        energy_1_10: entry.energy_1_10 || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'date'
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to save metric entry to Supabase:', error)
    return false
  }
}

async function loadMetricEntriesFromSupabase() {
  if (!isSupabaseConfigured()) return []
  
  try {
    const { data, error } = await supabase
      .from('metric_entries')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to load metric entries from Supabase:', error)
    return []
  }
}

async function saveProjectStartDateToSupabase(date) {
  if (!isSupabaseConfigured()) return false
  
  try {
    const { error } = await supabase
      .from('project_settings')
      .upsert({
        key: 'project_start_date',
        value: date,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key'
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to save project start date to Supabase:', error)
    return false
  }
}

async function loadProjectStartDateFromSupabase() {
  if (!isSupabaseConfigured()) return null
  
  try {
    const { data, error } = await supabase
      .from('project_settings')
      .select('value')
      .eq('key', 'project_start_date')
      .single()
    
    if (error) throw error
    return data?.value || null
  } catch (error) {
    console.error('Failed to load project start date from Supabase:', error)
    return null
  }
}

// ========== PUBLIC API (Hybrid: Supabase + localStorage) ==========

export async function saveTasks(tasks) {
  // Always save to localStorage first (fast, offline support)
  saveToLocalStorage(STORAGE_KEYS.TASKS, tasks)
  
  // Also save to Supabase if configured
  await saveTasksToSupabase(tasks)
  
  return true
}

export async function loadTasks() {
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    const supabaseTasks = await loadTasksFromSupabase()
    if (supabaseTasks.length > 0) {
      // Sync to localStorage
      saveToLocalStorage(STORAGE_KEYS.TASKS, supabaseTasks)
      return supabaseTasks
    }
  }
  
  // Fall back to localStorage
  return loadFromLocalStorage(STORAGE_KEYS.TASKS, [])
}

export async function saveLogEntry(entry) {
  // Always save to localStorage first
  const entries = loadFromLocalStorage(STORAGE_KEYS.LOG_ENTRIES, [])
  const existingIndex = entries.findIndex(
    e => e.date === entry.date && e.task_id === entry.task_id
  )
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry
  } else {
    entries.push(entry)
  }
  
  saveToLocalStorage(STORAGE_KEYS.LOG_ENTRIES, entries)
  
  // Also save to Supabase if configured
  await saveLogEntryToSupabase(entry)
  
  return true
}

export async function loadLogEntries() {
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    const supabaseEntries = await loadLogEntriesFromSupabase()
    if (supabaseEntries.length > 0) {
      // Sync to localStorage
      saveToLocalStorage(STORAGE_KEYS.LOG_ENTRIES, supabaseEntries)
      return supabaseEntries
    }
  }
  
  // Fall back to localStorage
  return loadFromLocalStorage(STORAGE_KEYS.LOG_ENTRIES, [])
}

export async function saveMetricEntry(entry) {
  // Always save to localStorage first
  const entries = loadFromLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, [])
  const existingIndex = entries.findIndex(e => e.date === entry.date)
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry
  } else {
    entries.push(entry)
  }
  
  saveToLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, entries)
  
  // Also save to Supabase if configured
  await saveMetricEntryToSupabase(entry)
  
  return true
}

export async function loadMetricEntries() {
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    const supabaseEntries = await loadMetricEntriesFromSupabase()
    if (supabaseEntries.length > 0) {
      // Sync to localStorage
      saveToLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, supabaseEntries)
      return supabaseEntries
    }
  }
  
  // Fall back to localStorage
  return loadFromLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, [])
}

export function getLogEntry(date, taskId) {
  const entries = loadFromLocalStorage(STORAGE_KEYS.LOG_ENTRIES, [])
  return entries.find(e => e.date === date && e.task_id === taskId)
}

export function getMetricEntry(date) {
  const entries = loadFromLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, [])
  return entries.find(e => e.date === date)
}

// Project start date helpers
export async function saveProjectStartDate(date) {
  saveToLocalStorage(STORAGE_KEYS.PROJECT_START_DATE, date)
  await saveProjectStartDateToSupabase(date)
  return true
}

export async function loadProjectStartDate() {
  if (isSupabaseConfigured()) {
    const supabaseDate = await loadProjectStartDateFromSupabase()
    if (supabaseDate) {
      saveToLocalStorage(STORAGE_KEYS.PROJECT_START_DATE, supabaseDate)
      return supabaseDate
    }
  }
  return loadFromLocalStorage(STORAGE_KEYS.PROJECT_START_DATE, null)
}

// Export all data as JSON
export function exportData() {
  return {
    tasks: loadFromLocalStorage(STORAGE_KEYS.TASKS, []),
    logEntries: loadFromLocalStorage(STORAGE_KEYS.LOG_ENTRIES, []),
    metricEntries: loadFromLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, []),
    exportedAt: new Date().toISOString(),
  }
}

// Import data
export async function importData(data) {
  try {
    if (data.tasks) await saveTasks(data.tasks)
    if (data.logEntries) {
      for (const entry of data.logEntries) {
        await saveLogEntry(entry)
      }
    }
    if (data.metricEntries) {
      for (const entry of data.metricEntries) {
        await saveMetricEntry(entry)
      }
    }
    return true
  } catch (error) {
    console.error('Failed to import data:', error)
    return false
  }
}
