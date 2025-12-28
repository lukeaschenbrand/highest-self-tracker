import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getProjectStartDate } from '@/lib/backfill'
import { formatDate, parseDate } from '@/lib/scoring'

// Helper to get date range from project start to today
function useDateRange() {
  const [dateRange, setDateRange] = useState([])

  useEffect(() => {
    const loadDateRange = async () => {
      try {
        const projectStart = await getProjectStartDate()
        if (!projectStart) {
          setDateRange([])
          return
        }
        const today = new Date()
        const dates = []
        const current = new Date(projectStart)
        
        while (current <= today) {
          const dateStr = formatDate(new Date(current))
          if (dateStr && typeof dateStr === 'string') {
            dates.push(dateStr)
          }
          current.setDate(current.getDate() + 1)
        }
        
        setDateRange(Array.isArray(dates) ? dates : [])
      } catch (error) {
        console.error('Error loading date range:', error)
        setDateRange([])
      }
    }
    loadDateRange()
  }, [])

  return Array.isArray(dateRange) ? dateRange : []
}

// Helper to format date for display
function formatDateForDisplay(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return ''
  }
  return dateString.split('-').slice(1).join('/') // MM/DD format
}

export function SleepChart({ data, isBatman = false, isJoker = false }) {
  const dateRange = useDateRange()
  
  if (dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : []
  
  // Create a map of existing data
  const dataMap = new Map()
  safeData
    .filter(d => d && d.sleep_hours !== null && d.sleep_hours !== undefined)
    .forEach(d => {
      dataMap.set(d.date, parseFloat(d.sleep_hours))
    })
  
  // Build chart data for all dates from start to today
  // Keep full date (YYYY-MM-DD) for proper ordering
  // Explicitly ensure dates are sorted chronologically
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  const chartData = dateRange
    .filter(date => date && typeof date === 'string') // Ensure date is a valid string
    .map(date => {
      const sleep = dataMap.get(date)
      return {
        date: String(date), // Ensure date is always a string
        sleep: sleep !== undefined ? sleep : null
      }
    })
    .filter(d => d && d.date) // Remove any invalid entries
    .sort((a, b) => String(a.date).localeCompare(String(b.date))) // Explicitly sort by date

  // Ensure chartData is a valid array
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  // Check if we have any actual data (not just empty dates)
  const hasData = chartData.some(d => d && d.sleep !== null)
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  // Calculate min/max for Y-axis (with some padding)
  const sleepValues = chartData.map(d => d.sleep).filter(v => v !== null)
  const minSleep = sleepValues.length > 0 ? Math.max(4, Math.floor(Math.min(...sleepValues) - 1)) : 4
  const maxSleep = sleepValues.length > 0 ? Math.min(10, Math.ceil(Math.max(...sleepValues) + 1)) : 10

  // Final safety check - ensure chartData is a valid array with valid entries
  // Double-check every property to ensure Recharts can process it
  let finalChartData = []
  if (Array.isArray(chartData) && chartData.length > 0) {
    finalChartData = chartData
      .filter(d => {
        // Ensure each entry is a valid object with a string date
        return d && 
               typeof d === 'object' && 
               d.date && 
               typeof d.date === 'string' &&
               d.date.length > 0
      })
      .map(d => ({
        date: String(d.date),
        sleep: typeof d.sleep === 'number' ? d.sleep : null
      }))
  }

  if (!Array.isArray(finalChartData) || finalChartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  // One more check - ensure all dates are valid strings
  const allDatesValid = finalChartData.every(d => d && d.date && typeof d.date === 'string')
  if (!allDatesValid) {
    return <div className="text-center text-muted-foreground py-8">Invalid data format</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={finalChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minSleep, maxSleep]} />
        <Tooltip 
          labelFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="sleep" stroke={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#8884d8"} strokeWidth={2} name="Sleep (hours)" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function EnergyChart({ data, isBatman = false, isJoker = false }) {
  const dateRange = useDateRange()
  
  if (dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : []
  
  // Create a map of existing data
  const dataMap = new Map()
  safeData
    .filter(d => d && d.energy_1_10 !== null && d.energy_1_10 !== undefined)
    .forEach(d => {
      dataMap.set(d.date, parseInt(d.energy_1_10))
    })
  
  // Build chart data for all dates from start to today
  // Keep full date (YYYY-MM-DD) for proper ordering
  // Explicitly ensure dates are sorted chronologically
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  const chartData = dateRange
    .filter(date => date && typeof date === 'string') // Ensure date is a valid string
    .map(date => {
      const energy = dataMap.get(date)
      return {
        date: String(date), // Ensure date is always a string
        energy: energy !== undefined ? energy : null
      }
    })
    .filter(d => d && d.date) // Remove any invalid entries
    .sort((a, b) => String(a.date).localeCompare(String(b.date))) // Explicitly sort by date

  // Ensure chartData is a valid array
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  // Check if we have any actual data (not just empty dates)
  const hasData = chartData.some(d => d && d.energy !== null)
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  // Calculate min/max for Y-axis (with some padding)
  const energyValues = chartData.map(d => d.energy).filter(v => v !== null)
  const minEnergy = energyValues.length > 0 ? Math.max(1, Math.min(...energyValues) - 1) : 1
  const maxEnergy = energyValues.length > 0 ? Math.min(10, Math.max(...energyValues) + 1) : 10

  // Final safety check - ensure chartData is a valid array with valid entries
  let finalChartData = []
  if (Array.isArray(chartData) && chartData.length > 0) {
    finalChartData = chartData
      .filter(d => {
        return d && 
               typeof d === 'object' && 
               d.date && 
               typeof d.date === 'string' &&
               d.date.length > 0
      })
      .map(d => ({
        date: String(d.date),
        energy: typeof d.energy === 'number' ? d.energy : null
      }))
  }

  if (!Array.isArray(finalChartData) || finalChartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  const allDatesValid = finalChartData.every(d => d && d.date && typeof d.date === 'string')
  if (!allDatesValid) {
    return <div className="text-center text-muted-foreground py-8">Invalid data format</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={finalChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minEnergy, maxEnergy]} />
        <Tooltip 
          labelFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="energy" stroke={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#82ca9d"} strokeWidth={2} name="Energy (1-10)" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function WeightChart({ data, isBatman = false, isJoker = false }) {
  const dateRange = useDateRange()
  
  if (dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : []
  
  // Create a map of existing data
  const dataMap = new Map()
  safeData
    .filter(d => d && d.weight_lbs !== null && d.weight_lbs !== undefined && d.weight_lbs !== 'P')
    .forEach(d => {
      dataMap.set(d.date, parseFloat(d.weight_lbs))
    })
  
  // Build chart data for all dates from start to today
  // Keep full date (YYYY-MM-DD) for proper ordering
  // Explicitly ensure dates are sorted chronologically
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  const chartData = dateRange
    .filter(date => date && typeof date === 'string') // Ensure date is a valid string
    .map(date => {
      const weight = dataMap.get(date)
      return {
        date: String(date), // Ensure date is always a string
        weight: weight !== undefined ? weight : null
      }
    })
    .filter(d => d && d.date) // Remove any invalid entries
    .sort((a, b) => String(a.date).localeCompare(String(b.date))) // Explicitly sort by date

  // Ensure chartData is a valid array
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }

  // Check if we have any actual data (not just empty dates)
  const weightValues = chartData.map(d => d && d.weight).filter(v => v !== null)
  if (weightValues.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }
  
  // Fixed Y-axis range: 195-260 lbs
  const minWeight = 195
  const maxWeight = 260

  // Final safety check - ensure chartData is a valid array with valid entries
  let finalChartData = []
  if (Array.isArray(chartData) && chartData.length > 0) {
    finalChartData = chartData
      .filter(d => {
        return d && 
               typeof d === 'object' && 
               d.date && 
               typeof d.date === 'string' &&
               d.date.length > 0
      })
      .map(d => ({
        date: String(d.date),
        weight: typeof d.weight === 'number' ? d.weight : null
      }))
  }

  if (!Array.isArray(finalChartData) || finalChartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }

  const allDatesValid = finalChartData.every(d => d && d.date && typeof d.date === 'string')
  if (!allDatesValid) {
    return <div className="text-center text-muted-foreground py-8">Invalid data format</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={finalChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minWeight, maxWeight]} />
        <Tooltip 
          labelFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="weight" stroke={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#8884d8"} strokeWidth={2} name="Weight (lbs)" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CompletionChart({ data, isBatman = false, isJoker = false }) {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : []
  
  if (safeData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }
  
  // data should be array of { date, score } objects
  // Already filtered to project start date range, so no need to slice
  // Keep full date (YYYY-MM-DD) for proper ordering
  const chartData = safeData
    .filter(d => d && d.score !== null && d.score !== undefined && d.date)
    .map(d => ({
      date: String(d.date), // Ensure date is always a string
      score: Number(d.score) || 0 // Ensure score is a number
    }))
    .filter(d => d && d.date) // Remove any invalid entries

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  // Final safety check - ensure chartData is a valid array with valid entries
  let finalChartData = []
  if (Array.isArray(chartData) && chartData.length > 0) {
    finalChartData = chartData
      .filter(d => {
        return d && 
               typeof d === 'object' && 
               d.date && 
               typeof d.date === 'string' &&
               d.date.length > 0 &&
               (d.score !== null && d.score !== undefined)
      })
      .map(d => ({
        date: String(d.date),
        score: typeof d.score === 'number' ? Number(d.score) : 0
      }))
  }

  if (!Array.isArray(finalChartData) || finalChartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  const allDatesValid = finalChartData.every(d => d && d.date && typeof d.date === 'string')
  if (!allDatesValid) {
    return <div className="text-center text-muted-foreground py-8">Invalid data format</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={finalChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
          interval="preserveStartEnd"
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip 
          labelFormatter={(value) => {
            try {
              return formatDateForDisplay(value)
            } catch {
              return ''
            }
          }}
        />
        <Legend />
        <Bar dataKey="score" fill={isBatman ? "#eab308" : isJoker ? "#9333ea" : "#8884d8"} name="Completion %" />
      </BarChart>
    </ResponsiveContainer>
  )
}
