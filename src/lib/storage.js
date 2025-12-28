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
    
    // Insert all tasks - only include columns that exist in the schema
    if (tasks.length > 0) {
      // First, try with all columns including active_days
      const validColumns = ['id', 'label', 'category', 'pillar', 'frequency', 'allow_pass', 'active_days', 'weight']
      const sanitizedTasks = tasks.map(task => {
        const sanitized = {}
        for (const col of validColumns) {
          if (task.hasOwnProperty(col)) {
            // Ensure active_days is a proper array
            if (col === 'active_days') {
              sanitized[col] = Array.isArray(task[col]) ? task[col] : [1, 2, 3, 4, 5, 6, 7]
            } else {
              sanitized[col] = task[col]
            }
          }
        }
        // Ensure required fields have defaults
        if (!sanitized.active_days || !Array.isArray(sanitized.active_days)) {
          sanitized.active_days = [1, 2, 3, 4, 5, 6, 7]
        }
        if (sanitized.weight === undefined || sanitized.weight === null) {
          sanitized.weight = 1
        }
        return sanitized
      })
      
      let { data, error } = await supabase.from('tasks').insert(sanitizedTasks).select()
      
      // If columns don't exist, try with only basic columns
      if (error && error.message && (error.message.includes('active_days') || error.message.includes('weight'))) {
        console.warn('Some columns not found in database. Saving tasks with only basic columns.')
        console.warn('Please run this SQL in Supabase to add missing columns:')
        console.warn('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS active_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;')
        
        // Try with only the basic required columns
        const basicColumns = ['id', 'label', 'category', 'pillar', 'frequency', 'allow_pass']
        const basicTasks = tasks.map(task => {
          const sanitized = {}
          for (const col of basicColumns) {
            if (task.hasOwnProperty(col)) {
              sanitized[col] = task[col]
            }
          }
          return sanitized
        })
        
        const { data: data2, error: error2 } = await supabase.from('tasks').insert(basicTasks).select()
        if (error2) {
          console.error('Supabase insert error details:', error2)
          console.error('First task being inserted:', basicTasks[0])
          throw error2
        }
        console.log(`Successfully saved ${basicTasks.length} tasks to Supabase (using basic columns only)`)
        return true
      }
      
      if (error) {
        console.error('Supabase insert error details:', error)
        console.error('First task being inserted:', sanitizedTasks[0])
        throw error
      }
      console.log(`Successfully saved ${sanitizedTasks.length} tasks to Supabase`)
    }
    
    return true
  } catch (error) {
    console.error('Failed to save tasks to Supabase:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
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
  const { getDefaultTasks } = await import('./tasks')
  
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    const supabaseTasks = await loadTasksFromSupabase()
    if (supabaseTasks.length > 0) {
      // Merge with defaults to add any new tasks
      const defaultTasks = getDefaultTasks()
      const mergedTasks = mergeTasksWithDefaults(supabaseTasks, defaultTasks)
      if (mergedTasks.length !== supabaseTasks.length) {
        // New tasks were added, save the merged list
        console.log(`Merged ${mergedTasks.length - supabaseTasks.length} new task(s) into existing ${supabaseTasks.length} tasks`)
        await saveTasks(mergedTasks)
        return mergedTasks
      }
      // Sync to localStorage
      saveToLocalStorage(STORAGE_KEYS.TASKS, supabaseTasks)
      return supabaseTasks
    }
    // If Supabase is empty but localStorage has data, migrate it
    const localTasks = loadFromLocalStorage(STORAGE_KEYS.TASKS, [])
    if (localTasks.length > 0) {
      console.log('Migrating tasks from localStorage to Supabase:', localTasks.length, 'tasks')
      await saveTasksToSupabase(localTasks)
      return localTasks
    }
  }
  
  // Fall back to localStorage
  const localTasks = loadFromLocalStorage(STORAGE_KEYS.TASKS, [])
  if (localTasks.length > 0) {
    // Merge with defaults to add any new tasks
    const mergedTasks = mergeTasksWithDefaults(localTasks, getDefaultTasks())
    if (mergedTasks.length !== localTasks.length) {
      // New tasks were added, save the merged list
      await saveTasks(mergedTasks)
      return mergedTasks
    }
    return localTasks
  }
  
  // No tasks at all, return defaults
  return getDefaultTasks()
}

// Helper function to merge existing tasks with default tasks
// Adds any missing tasks from defaults without removing existing ones
function mergeTasksWithDefaults(existingTasks, defaultTasks) {
  const existingTaskIds = new Set(existingTasks.map(t => t.id))
  const merged = [...existingTasks]
  
  // Add any default tasks that don't exist yet
  defaultTasks.forEach(defaultTask => {
    if (!existingTaskIds.has(defaultTask.id)) {
      merged.push(defaultTask)
      console.log('Adding new default task:', defaultTask.id, defaultTask.label)
    }
  })
  
  // Sort merged tasks to maintain order (by pillar, then by id)
  const pillarOrder = { 'Morning': 1, 'Body': 2, 'Work': 3, 'Weekly': 4 }
  merged.sort((a, b) => {
    const pillarDiff = (pillarOrder[a.pillar] || 99) - (pillarOrder[b.pillar] || 99)
    if (pillarDiff !== 0) return pillarDiff
    return a.id.localeCompare(b.id)
  })
  
  return merged
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
    // If Supabase is empty but localStorage has data, migrate it
    const localEntries = loadFromLocalStorage(STORAGE_KEYS.LOG_ENTRIES, [])
    if (localEntries.length > 0) {
      console.log('Migrating log entries from localStorage to Supabase:', localEntries.length, 'entries')
      for (const entry of localEntries) {
        await saveLogEntryToSupabase(entry)
      }
      return localEntries
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
    // If Supabase is empty but localStorage has data, migrate it
    const localEntries = loadFromLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, [])
    if (localEntries.length > 0) {
      console.log('Migrating metric entries from localStorage to Supabase:', localEntries.length, 'entries')
      for (const entry of localEntries) {
        await saveMetricEntryToSupabase(entry)
      }
      return localEntries
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
    // If Supabase is empty but localStorage has data, migrate it
    const localDate = loadFromLocalStorage(STORAGE_KEYS.PROJECT_START_DATE, null)
    if (localDate) {
      await saveProjectStartDateToSupabase(localDate)
      return localDate
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
