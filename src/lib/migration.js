// Manual migration utility to sync localStorage to Supabase
import { supabase, isSupabaseConfigured } from './supabase'

const STORAGE_KEYS = {
  TASKS: 'hst_tasks',
  LOG_ENTRIES: 'hst_log_entries',
  METRIC_ENTRIES: 'hst_metric_entries',
  PROJECT_START_DATE: 'hst_project_start_date',
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

export async function migrateLocalStorageToSupabase() {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase is not configured' }
  }

  try {
    const results = {
      tasks: 0,
      logEntries: 0,
      metricEntries: 0,
      projectStartDate: false,
    }

    // Migrate tasks
    const tasks = loadFromLocalStorage(STORAGE_KEYS.TASKS, [])
    if (tasks.length > 0) {
      // Delete all existing tasks
      await supabase.from('tasks').delete().neq('id', '')
      
      // Filter to only include valid columns for Supabase schema
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
      
      // Insert all tasks
      const { data, error: tasksError } = await supabase.from('tasks').insert(sanitizedTasks).select()
      if (tasksError) {
        console.error('Migration task insert error:', tasksError)
        throw tasksError
      }
      results.tasks = tasks.length
    }

    // Migrate log entries
    const logEntries = loadFromLocalStorage(STORAGE_KEYS.LOG_ENTRIES, [])
    if (logEntries.length > 0) {
      for (const entry of logEntries) {
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
        results.logEntries++
      }
    }

    // Migrate metric entries
    const metricEntries = loadFromLocalStorage(STORAGE_KEYS.METRIC_ENTRIES, [])
    if (metricEntries.length > 0) {
      for (const entry of metricEntries) {
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
        results.metricEntries++
      }
    }

    // Migrate project start date
    const projectStartDate = loadFromLocalStorage(STORAGE_KEYS.PROJECT_START_DATE, null)
    if (projectStartDate) {
      const { error } = await supabase
        .from('project_settings')
        .upsert({
          key: 'project_start_date',
          value: projectStartDate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
      if (error) throw error
      results.projectStartDate = true
    }

    return {
      success: true,
      message: `Migrated ${results.tasks} tasks, ${results.logEntries} log entries, ${results.metricEntries} metric entries${results.projectStartDate ? ', and project start date' : ''}`,
      results
    }
  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      error
    }
  }
}

