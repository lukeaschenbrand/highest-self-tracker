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

