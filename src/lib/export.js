// CSV export functionality

import { 
  formatDate, 
  parseDate, 
  getWeekStart, 
  getWeekEnd,
  getMonthStart,
  getMonthEnd 
} from './scoring'
import { loadTasks, loadLogEntries, loadMetricEntries } from './storage'

export function exportToCSV(startDate, endDate) {
  const tasks = loadTasks()
  const logEntries = loadLogEntries()
  const metricEntries = loadMetricEntries()
  
  // Generate all dates in range
  const dates = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  // Build header row
  const headers = ['Date', 'Sleep (hours)', 'Energy (1-10)', 'Weight (lbs)']
  
  // Add task columns
  tasks.forEach(task => {
    headers.push(task.label)
  })
  
  // Build data rows
  const rows = dates.map(date => {
    const dateStr = formatDate(date)
    const metric = metricEntries.find(m => m.date === dateStr)
    
    const row = [
      dateStr,
      metric?.sleep_hours ?? '',
      metric?.energy_1_10 ?? '',
      metric?.weight_lbs ?? '',
    ]
    
    // Add task statuses
    tasks.forEach(task => {
      const entry = logEntries.find(
        e => e.date === dateStr && e.task_id === task.id
      )
      row.push(entry?.status ?? '')
    })
    
    return row
  })
  
  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape commas and quotes in cell values
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}

export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportCurrentWeek() {
  const today = new Date()
  const weekStart = getWeekStart(today)
  const weekEnd = getWeekEnd(today)
  const csv = exportToCSV(weekStart, weekEnd)
  const filename = `highest-self-week-${formatDate(weekStart)}.csv`
  downloadCSV(csv, filename)
}

export function exportCurrentMonth() {
  const today = new Date()
  const monthStart = getMonthStart(today)
  const monthEnd = getMonthEnd(today)
  const csv = exportToCSV(monthStart, monthEnd)
  const filename = `highest-self-month-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}.csv`
  downloadCSV(csv, filename)
}

export function exportAll() {
  // Find earliest and latest dates
  const logEntries = loadLogEntries()
  const metricEntries = loadMetricEntries()
  
  const allDates = [
    ...logEntries.map(e => e.date),
    ...metricEntries.map(e => e.date),
  ]
  
  if (allDates.length === 0) {
    alert('No data to export')
    return
  }
  
  const sortedDates = allDates.sort()
  const startDate = parseDate(sortedDates[0])
  const endDate = parseDate(sortedDates[sortedDates.length - 1])
  
  const csv = exportToCSV(startDate, endDate)
  const filename = `highest-self-all-${formatDate(startDate)}-to-${formatDate(endDate)}.csv`
  downloadCSV(csv, filename)
}

// CSV import functionality
export function importFromCSV(csvContent) {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid')
    }
    
    // Parse header row
    const headers = parseCSVLine(lines[0])
    const dateIndex = headers.indexOf('Date')
    const sleepIndex = headers.indexOf('Sleep (hours)')
    const energyIndex = headers.indexOf('Energy (1-10)')
    const weightIndex = headers.indexOf('Weight (lbs)')
    
    if (dateIndex === -1) {
      throw new Error('Date column not found in CSV')
    }
    
    // Get task labels from headers (everything after Weight)
    const taskLabels = headers.slice(weightIndex + 1)
    
    // Load existing tasks to map labels to task IDs
    const tasks = loadTasks()
    const taskLabelToId = new Map()
    tasks.forEach(task => {
      taskLabelToId.set(task.label, task.id)
    })
    
    const logEntries = []
    const metricEntries = []
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i])
      if (row.length < headers.length) continue
      
      const date = row[dateIndex]
      if (!date) continue
      
      // Parse metrics
      const sleep = row[sleepIndex] ? parseFloat(row[sleepIndex]) : null
      const energy = row[energyIndex] ? parseInt(row[energyIndex]) : null
      const weight = row[weightIndex] ? (row[weightIndex] === 'P' ? 'P' : parseFloat(row[weightIndex])) : null
      
      if (sleep !== null || energy !== null || weight !== null) {
        metricEntries.push({
          date: date,
          sleep_hours: sleep,
          energy_1_10: energy,
          weight_lbs: weight,
        })
      }
      
      // Parse task entries
      taskLabels.forEach((label, idx) => {
        const taskId = taskLabelToId.get(label)
        if (!taskId) return // Skip if task doesn't exist
        
        const status = row[weightIndex + 1 + idx]
        if (status && status.trim() !== '') {
          logEntries.push({
            date: date,
            task_id: taskId,
            status: status.trim(),
            timestamp: new Date().toISOString(),
          })
        }
      })
    }
    
    return {
      logEntries,
      metricEntries,
    }
  } catch (error) {
    console.error('Failed to parse CSV:', error)
    throw error
  }
}

// Helper to parse CSV line (handles quoted values)
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  return result
}

// Import CSV file
export function importCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result
        const data = importFromCSV(csvContent)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

// Import JSON file (for full data backup)
export function importJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target.result)
        resolve(jsonContent)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

