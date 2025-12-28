// Real-time subscriptions for Supabase
import { supabase, isSupabaseConfigured } from './supabase'

export function subscribeToLogEntries(callback) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel('log_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'log_entries',
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToMetricEntries(callback) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel('metric_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'metric_entries',
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToTasks(callback) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel('tasks_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

