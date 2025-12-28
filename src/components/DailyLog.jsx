import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/scoring'
import { 
  loadTasks, 
  saveTasks, 
  getLogEntry, 
  saveLogEntry, 
  getMetricEntry, 
  saveMetricEntry 
} from '@/lib/storage'
import { getDefaultTasks, PILLARS, FREQUENCIES } from '@/lib/tasks'
import { cn } from '@/lib/utils'

export function DailyLog({ selectedDate, onSave, canEdit = true, isBatman = false }) {
  const [tasks, setTasks] = useState([])
  const [logEntries, setLogEntries] = useState({})
  const [metrics, setMetrics] = useState({
    sleep_hours: '',
    energy_1_10: 5,
    weight_lbs: '',
    weight_pass: false,
  })
  const [expandedPillars, setExpandedPillars] = useState({
    [PILLARS.MORNING]: true,
    [PILLARS.BODY]: true,
    [PILLARS.WORK]: true,
    [PILLARS.WEEKLY]: true,
  })
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const inputRefs = useRef({})
  const inputOrder = useRef([])

  useEffect(() => {
    // Load tasks or initialize with defaults
    let loadedTasks = loadTasks()
    if (loadedTasks.length === 0) {
      loadedTasks = getDefaultTasks()
      saveTasks(loadedTasks)
    }
    setTasks(loadedTasks)
    
    // Reset input order when date or tasks change
    // We'll rebuild it as inputs register
    inputOrder.current = []
    inputRefs.current = {}

    // Load existing entries for this date
    const dateStr = formatDate(selectedDate)
    const dayOfWeek = selectedDate.getDay()
    
    const entries = {}
    loadedTasks.forEach(task => {
      // Check if task is active today
      if (task.frequency === FREQUENCIES.WEEKLY) {
        // Weekly tasks are always available
        const entry = getLogEntry(dateStr, task.id)
        if (entry) {
          entries[task.id] = entry.status
        }
      } else if (task.active_days.includes(dayOfWeek)) {
        const entry = getLogEntry(dateStr, task.id)
        if (entry) {
          entries[task.id] = entry.status
        }
      }
    })
    setLogEntries(entries)

    // Load metrics
    const metricEntry = getMetricEntry(dateStr)
    if (metricEntry) {
      setMetrics({
        sleep_hours: metricEntry.sleep_hours || '',
        energy_1_10: metricEntry.energy_1_10 || 5,
        weight_lbs: metricEntry.weight_lbs === 'P' ? '' : (metricEntry.weight_lbs || ''),
        weight_pass: metricEntry.weight_lbs === 'P',
      })
    }

    // Load unsaved state from localStorage
    const unsavedKey = `unsaved_${dateStr}`
    const unsaved = localStorage.getItem(unsavedKey)
    if (unsaved) {
      try {
        const parsed = JSON.parse(unsaved)
        setLogEntries(prev => ({ ...prev, ...parsed.logEntries }))
        setMetrics(prev => ({ ...prev, ...parsed.metrics }))
        setUnsavedChanges(true)
      } catch (e) {
        console.error('Failed to load unsaved state:', e)
      }
    }
  }, [selectedDate])

  // Save unsaved state to localStorage
  useEffect(() => {
    if (unsavedChanges) {
      const dateStr = formatDate(selectedDate)
      const unsavedKey = `unsaved_${dateStr}`
      localStorage.setItem(unsavedKey, JSON.stringify({
        logEntries,
        metrics,
      }))
    }
  }, [logEntries, metrics, unsavedChanges, selectedDate])

  const handleTaskStatus = (taskId, status) => {
    setLogEntries(prev => ({ ...prev, [taskId]: status }))
    setUnsavedChanges(true)
  }

  const handleSave = () => {
    const dateStr = formatDate(selectedDate)
    const dayOfWeek = selectedDate.getDay()

    // Save all log entries
    tasks.forEach(task => {
      if (task.frequency === FREQUENCIES.WEEKLY || task.active_days.includes(dayOfWeek)) {
        const status = logEntries[task.id]
        // Save if status exists (including 0 for tweets)
        if (status !== undefined && status !== null && status !== '') {
          saveLogEntry({
            date: dateStr,
            task_id: task.id,
            status: status.toString(),
            timestamp: new Date().toISOString(),
          })
        }
      }
    })

    // Save metrics
    saveMetricEntry({
      date: dateStr,
      sleep_hours: metrics.sleep_hours ? parseFloat(metrics.sleep_hours) : null,
      energy_1_10: parseInt(metrics.energy_1_10) || null,
      weight_lbs: metrics.weight_pass ? 'P' : (metrics.weight_lbs ? parseFloat(metrics.weight_lbs) : null),
    })

    // Clear unsaved state
    const unsavedKey = `unsaved_${dateStr}`
    localStorage.removeItem(unsavedKey)
    setUnsavedChanges(false)

    if (onSave) onSave()
  }

  const togglePillar = (pillar) => {
    setExpandedPillars(prev => ({ ...prev, [pillar]: !prev[pillar] }))
  }

  const getTasksByPillar = (pillar) => {
    const dayOfWeek = selectedDate.getDay()
    return tasks.filter(task => {
      if (task.pillar !== pillar) return false
      if (task.frequency === FREQUENCIES.WEEKLY) return true
      return task.active_days.includes(dayOfWeek)
    })
  }

  // Register input in order for navigation
  const registerInput = (taskId, ref) => {
    if (ref) {
      // Always update the ref
      inputRefs.current[taskId] = ref
      // Only add to order if not already there
      if (!inputOrder.current.includes(taskId)) {
        inputOrder.current.push(taskId)
      }
    } else {
      // Remove from refs if element is null (unmounted)
      delete inputRefs.current[taskId]
      const index = inputOrder.current.indexOf(taskId)
      if (index > -1) {
        inputOrder.current.splice(index, 1)
      }
    }
  }
  
  // Rebuild input order when date or tasks change to ensure correct navigation order
  useEffect(() => {
    const dayOfWeek = selectedDate.getDay()
    const orderedTasks = []
    
    // Get tasks in pillar order: Morning, Body, Work, Weekly
    const pillarOrder = [PILLARS.MORNING, PILLARS.BODY, PILLARS.WORK, PILLARS.WEEKLY]
    
    pillarOrder.forEach(pillar => {
      const pillarTasks = tasks.filter(task => {
        if (task.pillar !== pillar) return false
        if (task.frequency === FREQUENCIES.WEEKLY) return true
        return task.active_days.includes(dayOfWeek)
      })
      orderedTasks.push(...pillarTasks)
    })
    
    // Rebuild input order based on task order, keeping only tasks that have refs
    const newOrder = orderedTasks
      .map(t => t.id)
      .filter(id => inputRefs.current[id])
    
    // Only update if order changed
    if (JSON.stringify(newOrder) !== JSON.stringify(inputOrder.current)) {
      inputOrder.current = newOrder
    }
  }, [tasks, selectedDate])

  // Navigate to next/previous input
  const navigateInput = (currentTaskId, direction) => {
    const currentIndex = inputOrder.current.indexOf(currentTaskId)
    if (currentIndex === -1) {
      console.warn('Task not found in input order:', currentTaskId)
      return
    }

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (nextIndex < 0 || nextIndex >= inputOrder.current.length) {
      // At the end, don't navigate
      return
    }

    const nextTaskId = inputOrder.current[nextIndex]
    const nextInput = inputRefs.current[nextTaskId]
    if (nextInput) {
      // Use setTimeout to ensure focus happens after any pending state updates
      setTimeout(() => {
        nextInput.focus()
        // Select all text for easy replacement
        if (nextInput.setSelectionRange) {
          nextInput.setSelectionRange(0, nextInput.value.length)
        }
      }, 10)
    } else {
      console.warn('Input ref not found for task:', nextTaskId)
    }
  }

  const parseStatusInput = (input) => {
    if (!input) return null
    const normalized = input.trim().toLowerCase()
    
    // Handle yes/y variations
    if (normalized === 'y' || normalized === 'yes' || normalized === '1') {
      return 'Y'
    }
    
    // Handle no/n variations
    if (normalized === 'n' || normalized === 'no' || normalized === '0') {
      return 'N'
    }
    
    // Handle pass/p variations
    if (normalized === 'p' || normalized === 'pass' || normalized === '-') {
      return 'P'
    }
    
    // Return as-is if it's already Y/N/P
    if (normalized === 'y' || normalized === 'n' || normalized === 'p') {
      return input.trim().toUpperCase()
    }
    
    return null
  }

  const formatStatusForDisplay = (status) => {
    if (!status) return ''
    // Only show formatted text if it's a valid status
    if (status === 'Y' || status === 'N' || status === 'P') {
      if (status === 'Y') return 'yes'
      if (status === 'N') return 'no'
      if (status === 'P') return 'pass'
    }
    // If it's partial input (user typing), show it as-is
    return status
  }

  const TaskButton = ({ task, status, canEdit = true, isBatman = false }) => {
    const hasPass = task.allow_pass
    const isTweets = task.label.includes('Tweets')
    const isTikTok = task.label === 'TikTok' && task.is_numeric
    const isNumeric = isTweets || isTikTok
    
    if (isNumeric) {
      // Handle numeric inputs (Tweets 0-3, TikTok any number)
      let numericValue = 0
      if (status === 'Y') {
        numericValue = isTweets ? 3 : 1 // Default TikTok to 1 if Y
      } else if (status === 'N') {
        numericValue = 0
      } else if (status && status !== 'P') {
        numericValue = parseInt(status) || 0
      }
      
      const maxValue = isTweets ? 3 : undefined
      const placeholder = isTweets ? "0-3" : "count"
      
      return (
        <div className="flex items-center gap-2 py-2">
          <span className={`flex-1 text-sm ${isBatman ? 'text-yellow-400' : ''}`}>{task.label}</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max={maxValue}
              value={numericValue}
              onChange={(e) => {
                if (canEdit) {
                  const val = parseInt(e.target.value) || 0
                  let clampedVal = val
                  if (isTweets) {
                    clampedVal = Math.max(0, Math.min(3, val))
                  } else {
                    clampedVal = Math.max(0, val)
                  }
                  // Store as number string
                  handleTaskStatus(task.id, clampedVal.toString())
                }
              }}
              disabled={!canEdit}
              className={`w-20 h-8 ${isBatman ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors' : ''}`}
              onKeyDown={(e) => {
                // Enter key navigation
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (e.shiftKey) {
                    // Shift+Enter: move up
                    navigateInput(task.id, 'up')
                  } else {
                    // Enter: move down
                    navigateInput(task.id, 'down')
                  }
                  return
                }
                
                // Arrow key navigation (only when at edges)
                if (e.key === 'ArrowUp' && (e.target.selectionStart === 0 || e.target.value === '')) {
                  e.preventDefault()
                  navigateInput(task.id, 'up')
                  return
                }
                if (e.key === 'ArrowDown' && (e.target.selectionStart === e.target.value.length || e.target.value === '')) {
                  e.preventDefault()
                  navigateInput(task.id, 'down')
                  return
                }
              }}
              ref={(el) => {
                if (el && canEdit) registerInput(task.id, el)
              }}
              placeholder={placeholder}
            />
            {hasPass && (
              <Input
                type="text"
                value={status === 'P' ? 'pass' : ''}
                onChange={(e) => {
                  if (canEdit) {
                    const parsed = parseStatusInput(e.target.value)
                    if (parsed === 'P') {
                      handleTaskStatus(task.id, 'P')
                    } else if (!e.target.value) {
                      handleTaskStatus(task.id, '')
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value && e.target.value !== 'pass') {
                    e.target.value = ''
                  }
                }}
                disabled={!canEdit}
                className={`w-20 h-8 ${isBatman ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors' : ''}`}
                placeholder="pass"
              />
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 py-2">
        <span className={`flex-1 text-sm ${isBatman ? 'text-yellow-400' : ''}`}>{task.label}</span>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={status ? formatStatusForDisplay(status) : ''}
            onChange={(e) => {
              if (canEdit) {
                const value = e.target.value
                if (!value) {
                  handleTaskStatus(task.id, '')
                  return
                }
                
                const parsed = parseStatusInput(value)
                if (parsed) {
                  handleTaskStatus(task.id, parsed)
                } else {
                  // Allow typing partial input
                  handleTaskStatus(task.id, value)
                }
              }
            }}
            disabled={!canEdit}
            onBlur={(e) => {
              // Only process blur if we're not navigating (check if next input is being focused)
              const relatedTarget = e.relatedTarget
              if (relatedTarget && relatedTarget.tagName === 'INPUT') {
                // We're moving to another input, don't process blur
                return
              }
              
              const parsed = parseStatusInput(e.target.value)
              if (parsed) {
                handleTaskStatus(task.id, parsed)
              } else if (e.target.value) {
                // If invalid input, clear it
                handleTaskStatus(task.id, '')
              }
            }}
            onKeyDown={(e) => {
              if (!canEdit) return
              // Enter key navigation
              if (e.key === 'Enter') {
                e.preventDefault()
                if (e.shiftKey) {
                  // Shift+Enter: move up
                  navigateInput(task.id, 'up')
                } else {
                  // Enter: move down
                  navigateInput(task.id, 'down')
                }
                return
              }
              
              // Arrow key navigation (only when not editing text)
              if (e.key === 'ArrowUp' && (e.target.selectionStart === 0 || e.target.value === '')) {
                e.preventDefault()
                navigateInput(task.id, 'up')
                return
              }
              if (e.key === 'ArrowDown' && (e.target.selectionStart === e.target.value.length || e.target.value === '')) {
                e.preventDefault()
                navigateInput(task.id, 'down')
                return
              }
              
              // Quick shortcuts: y, n, p keys (always work, not just when empty)
              if (e.key === 'y' || e.key === 'Y') {
                e.preventDefault()
                e.stopPropagation()
                handleTaskStatus(task.id, 'Y')
                // Auto-advance to next input after state update
                setTimeout(() => {
                  navigateInput(task.id, 'down')
                }, 50)
                return
              }
              if (e.key === 'n' || e.key === 'N') {
                e.preventDefault()
                e.stopPropagation()
                handleTaskStatus(task.id, 'N')
                // Auto-advance to next input after state update
                setTimeout(() => {
                  navigateInput(task.id, 'down')
                }, 50)
                return
              }
              if ((e.key === 'p' || e.key === 'P') && hasPass) {
                e.preventDefault()
                e.stopPropagation()
                handleTaskStatus(task.id, 'P')
                // Auto-advance to next input after state update
                setTimeout(() => {
                  navigateInput(task.id, 'down')
                }, 50)
                return
              }
            }}
            ref={(el) => {
              if (el && canEdit) registerInput(task.id, el)
            }}
            className={`w-24 h-8 text-sm ${isBatman ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors' : ''}`}
            placeholder={hasPass ? "y/n/p" : "y/n"}
          />
        </div>
      </div>
    )
  }

  const PillarSection = ({ pillar, label }) => {
    const pillarTasks = getTasksByPillar(pillar)
    if (pillarTasks.length === 0) return null

    const isExpanded = expandedPillars[pillar]

    return (
      <Card className={`mb-4 ${isBatman ? 'bg-gray-800 border-gray-700' : ''}`}>
        <CardHeader 
          className={canEdit ? "cursor-pointer" : ""}
          onClick={() => canEdit && togglePillar(pillar)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg ${isBatman ? 'text-yellow-400' : ''}`}>{label}</CardTitle>
            <Badge variant="secondary">{pillarTasks.length}</Badge>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="space-y-1">
              {pillarTasks.map(task => (
                <TaskButton
                  key={task.id}
                  task={task}
                  status={logEntries[task.id]}
                  canEdit={canEdit}
                  isBatman={isBatman}
                />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const containerClass = isBatman 
    ? "max-w-2xl mx-auto p-4 space-y-6 bg-gray-900 min-h-screen"
    : "max-w-2xl mx-auto p-4 space-y-6"

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isBatman ? 'text-yellow-400' : ''}`}>
          Daily Log - {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        {unsavedChanges && (
          <Badge variant="outline" className="text-orange-600">
            Unsaved
          </Badge>
        )}
      </div>

      {/* Metrics Section */}
      <Card className={isBatman ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Body Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={`text-sm font-medium mb-2 block ${isBatman ? 'text-yellow-400' : ''}`}>
              Sleep (hours)
            </label>
            <Input
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={metrics.sleep_hours}
              onChange={(e) => {
                if (canEdit) {
                  setMetrics(prev => ({ ...prev, sleep_hours: e.target.value }))
                  setUnsavedChanges(true)
                }
              }}
              placeholder="7.5"
              disabled={!canEdit}
              className={isBatman ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors' : ''}
            />
          </div>

          <div>
            <label className={`text-sm font-medium mb-2 block ${isBatman ? 'text-yellow-400' : ''}`}>
              Energy (1-10): {metrics.energy_1_10}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={metrics.energy_1_10}
              onChange={(e) => {
                if (canEdit) {
                  setMetrics(prev => ({ ...prev, energy_1_10: parseInt(e.target.value) }))
                  setUnsavedChanges(true)
                }
              }}
              className="w-full"
              disabled={!canEdit}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium mb-2 block ${isBatman ? 'text-yellow-400' : ''}`}>
              Weight (lbs)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={metrics.weight_lbs}
                onChange={(e) => {
                  if (canEdit) {
                    setMetrics(prev => ({ ...prev, weight_lbs: e.target.value }))
                    setUnsavedChanges(true)
                  }
                }}
                placeholder="180"
                disabled={!canEdit || metrics.weight_pass}
                className={`flex-1 ${isBatman ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors' : ''}`}
              />
              <Button
                variant={metrics.weight_pass ? 'default' : 'outline'}
                onClick={() => {
                  if (canEdit) {
                    setMetrics(prev => ({ 
                      ...prev, 
                      weight_pass: !prev.weight_pass,
                      weight_lbs: prev.weight_pass ? prev.weight_lbs : ''
                    }))
                    setUnsavedChanges(true)
                  }
                }}
                disabled={!canEdit}
                className={isBatman ? 'bg-gray-700 hover:bg-yellow-400 hover:text-black text-yellow-400 border border-gray-600' : ''}
              >
                P
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar Sections */}
      <PillarSection pillar={PILLARS.MORNING} label="Morning" />
      <PillarSection pillar={PILLARS.BODY} label="Body" />
      <PillarSection pillar={PILLARS.WORK} label="Work" />
      <PillarSection pillar={PILLARS.WEEKLY} label="Weekly" />

      {/* Save Button */}
      {canEdit && (
        <div className={`sticky bottom-4 p-4 rounded-lg border shadow-lg ${
          isBatman ? 'bg-gray-800 border-gray-700' : 'bg-background'
        }`}>
          <Button
            onClick={handleSave}
            className={`w-full ${isBatman ? 'bg-yellow-600 hover:bg-yellow-700 text-black' : ''}`}
            size="lg"
            disabled={!unsavedChanges}
          >
            Save Log
          </Button>
        </div>
      )}
    </div>
  )
}

