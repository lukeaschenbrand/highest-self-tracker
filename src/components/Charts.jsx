import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getProjectStartDate } from '@/lib/backfill'
import { formatDate } from '@/lib/scoring'

// Helper to get date range from project start to today
function useDateRange() {
  const [dateRange, setDateRange] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDateRange = async () => {
      try {
        setLoading(true)
        const projectStart = await getProjectStartDate()
        if (!projectStart) {
          setDateRange([])
          setLoading(false)
          return
        }
        const today = new Date()
        const dates = []
        const current = new Date(projectStart)
        
        while (current <= today) {
          const dateStr = formatDate(new Date(current))
          if (dateStr && typeof dateStr === 'string' && dateStr.length === 10) {
            dates.push(dateStr)
          }
          current.setDate(current.getDate() + 1)
        }
        
        setDateRange(dates.sort())
        setLoading(false)
      } catch (error) {
        console.error('Error loading date range:', error)
        setDateRange([])
        setLoading(false)
      }
    }
    loadDateRange()
  }, [])

  return { dateRange: dateRange || [], loading }
}

// Helper to format date for display - MUST return a string
function formatDateForDisplay(dateString) {
  if (!dateString) return ''
  if (typeof dateString !== 'string') {
    const str = String(dateString)
    if (str.includes('-')) {
      const parts = str.split('-')
      if (parts.length >= 3) {
        return `${parts[1]}/${parts[2]}`
      }
    }
    return str
  }
  const parts = dateString.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateString
}

// Helper to create safe chart data - ensures every entry is valid
function createSafeChartData(dateRange, dataMap, valueKey) {
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return []
  }
  
  const result = []
  for (const date of dateRange) {
    if (!date || typeof date !== 'string') continue
    
    const dateStr = String(date).trim()
    if (dateStr.length !== 10 || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    
    const value = dataMap.get(dateStr)
    const entry = {
      date: dateStr,
      [valueKey]: (value !== undefined && value !== null && !isNaN(value)) ? Number(value) : null
    }
    
    // Ensure the entry is a plain object with the expected structure
    if (entry.date && typeof entry.date === 'string') {
      result.push(entry)
    }
  }
  
  // Sort by date to ensure chronological order
  return result.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return a.date.localeCompare(b.date)
  })
}

// Validate chart data before passing to Recharts
function validateChartData(data) {
  if (!Array.isArray(data)) return false
  if (data.length === 0) return false
  
  // Every entry must be an object with a string date
  return data.every(entry => {
    return entry && 
           typeof entry === 'object' && 
           entry.date && 
           typeof entry.date === 'string' &&
           entry.date.length === 10 &&
           entry.date.match(/^\d{4}-\d{2}-\d{2}$/)
  })
}

export function SleepChart({ data, isBatman = false, isJoker = false }) {
  const { dateRange, loading } = useDateRange()
  
  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No date range available</div>
  }
  
  // Ensure data is an array and normalize it
  const safeData = Array.isArray(data) ? data : []
  const dataMap = new Map()
  
  for (const d of safeData) {
    if (!d || typeof d !== 'object') continue
    if (d.sleep_hours === null || d.sleep_hours === undefined) continue
    if (!d.date || typeof d.date !== 'string') continue
    
    const dateStr = String(d.date).trim()
    const sleepValue = parseFloat(d.sleep_hours)
    
    if (dateStr && !isNaN(sleepValue)) {
      dataMap.set(dateStr, sleepValue)
    }
  }
  
  const chartData = createSafeChartData(dateRange, dataMap, 'sleep')
  
  if (!validateChartData(chartData)) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  const hasData = chartData.some(d => d.sleep !== null && d.sleep !== undefined && !isNaN(d.sleep))
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  const sleepValues = chartData
    .map(d => d.sleep)
    .filter(v => v !== null && v !== undefined && !isNaN(v))
    .map(v => Number(v))
  
  if (sleepValues.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }
  
  const minSleep = Math.max(4, Math.floor(Math.min(...sleepValues) - 1))
  const maxSleep = Math.min(10, Math.ceil(Math.max(...sleepValues) + 1))

  // Final validation - ensure chartData is exactly what Recharts expects
  const finalData = chartData.filter(d => 
    d && 
    d.date && 
    typeof d.date === 'string' &&
    d.date.match(/^\d{4}-\d{2}-\d{2}$/)
  )

  if (!Array.isArray(finalData) || finalData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={finalData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={formatDateForDisplay}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minSleep, maxSleep]} />
        <Tooltip labelFormatter={formatDateForDisplay} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="sleep" 
          stroke={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#8884d8"} 
          strokeWidth={2} 
          name="Sleep (hours)" 
          connectNulls={false} 
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function EnergyChart({ data, isBatman = false, isJoker = false }) {
  const { dateRange, loading } = useDateRange()
  
  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No date range available</div>
  }
  
  const safeData = Array.isArray(data) ? data : []
  const dataMap = new Map()
  
  for (const d of safeData) {
    if (!d || typeof d !== 'object') continue
    if (d.energy_1_10 === null || d.energy_1_10 === undefined) continue
    if (!d.date || typeof d.date !== 'string') continue
    
    const dateStr = String(d.date).trim()
    const energyValue = parseInt(d.energy_1_10)
    
    if (dateStr && !isNaN(energyValue)) {
      dataMap.set(dateStr, energyValue)
    }
  }
  
  const chartData = createSafeChartData(dateRange, dataMap, 'energy')
  
  if (!validateChartData(chartData)) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  const hasData = chartData.some(d => d.energy !== null && d.energy !== undefined && !isNaN(d.energy))
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  const energyValues = chartData
    .map(d => d.energy)
    .filter(v => v !== null && v !== undefined && !isNaN(v))
    .map(v => Number(v))
  
  if (energyValues.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }
  
  const minEnergy = Math.max(1, Math.min(...energyValues) - 1)
  const maxEnergy = Math.min(10, Math.max(...energyValues) + 1)

  const finalData = chartData.filter(d => 
    d && 
    d.date && 
    typeof d.date === 'string' &&
    d.date.match(/^\d{4}-\d{2}-\d{2}$/)
  )

  if (!Array.isArray(finalData) || finalData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={finalData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={formatDateForDisplay}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minEnergy, maxEnergy]} />
        <Tooltip labelFormatter={formatDateForDisplay} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="energy" 
          stroke={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#82ca9d"} 
          strokeWidth={2} 
          name="Energy (1-10)" 
          connectNulls={false} 
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function WeightChart({ data, isBatman = false, isJoker = false }) {
  const { dateRange, loading } = useDateRange()
  
  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No date range available</div>
  }
  
  const safeData = Array.isArray(data) ? data : []
  const dataMap = new Map()
  
  for (const d of safeData) {
    if (!d || typeof d !== 'object') continue
    if (d.weight_lbs === null || d.weight_lbs === undefined || d.weight_lbs === 'P') continue
    if (!d.date || typeof d.date !== 'string') continue
    
    const dateStr = String(d.date).trim()
    const weightValue = parseFloat(d.weight_lbs)
    
    if (dateStr && !isNaN(weightValue)) {
      dataMap.set(dateStr, weightValue)
    }
  }
  
  const chartData = createSafeChartData(dateRange, dataMap, 'weight')
  
  if (!validateChartData(chartData)) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }

  const weightValues = chartData
    .map(d => d.weight)
    .filter(v => v !== null && v !== undefined && !isNaN(v))
    .map(v => Number(v))
  
  if (weightValues.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }
  
  const minWeight = 195
  const maxWeight = 260

  const finalData = chartData.filter(d => 
    d && 
    d.date && 
    typeof d.date === 'string' &&
    d.date.match(/^\d{4}-\d{2}-\d{2}$/)
  )

  if (!Array.isArray(finalData) || finalData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={finalData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={formatDateForDisplay}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minWeight, maxWeight]} />
        <Tooltip labelFormatter={formatDateForDisplay} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="weight" 
          stroke={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#8884d8"} 
          strokeWidth={2} 
          name="Weight (lbs)" 
          connectNulls={false} 
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CompletionChart({ data, isBatman = false, isJoker = false }) {
  const safeData = Array.isArray(data) ? data : []
  
  if (safeData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }
  
  // Build chart data with strict validation
  const chartData = []
  for (const d of safeData) {
    if (!d || typeof d !== 'object') continue
    if (d.score === null || d.score === undefined) continue
    if (!d.date || typeof d.date !== 'string') continue
    
    const dateStr = String(d.date).trim()
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    
    const scoreValue = Number(d.score)
    if (isNaN(scoreValue)) continue
    
    chartData.push({
      date: dateStr,
      score: scoreValue
    })
  }
  
  // Sort by date
  chartData.sort((a, b) => a.date.localeCompare(b.date))

  if (!validateChartData(chartData)) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  if (chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  // Final validation - ensure all dates are valid YYYY-MM-DD format
  const finalData = chartData.filter(d => 
    d && 
    d.date && 
    typeof d.date === 'string' &&
    d.date.length === 10 &&
    d.date.match(/^\d{4}-\d{2}-\d{2}$/) &&
    typeof d.score === 'number' &&
    !isNaN(d.score)
  )

  if (!Array.isArray(finalData) || finalData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={finalData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={formatDateForDisplay}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip labelFormatter={formatDateForDisplay} />
        <Legend />
        <Bar 
          dataKey="score" 
          fill={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#8884d8"} 
          name="Completion %" 
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
