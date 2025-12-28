import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getProjectStartDate } from '@/lib/backfill'
import { formatDate } from '@/lib/scoring'

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
          if (dateStr && typeof dateStr === 'string' && dateStr.length > 0) {
            dates.push(dateStr)
          }
          current.setDate(current.getDate() + 1)
        }
        
        setDateRange(dates)
      } catch (error) {
        console.error('Error loading date range:', error)
        setDateRange([])
      }
    }
    loadDateRange()
  }, [])

  return dateRange || []
}

// Helper to format date for display
function formatDateForDisplay(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return ''
  }
  const parts = dateString.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateString
}

// Helper to create safe chart data
function createSafeChartData(dateRange, dataMap, valueKey) {
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return []
  }
  
  return dateRange
    .filter(date => date && typeof date === 'string')
    .map(date => {
      const value = dataMap.get(date)
      return {
        date: String(date),
        [valueKey]: value !== undefined && value !== null ? value : null
      }
    })
    .filter(d => d && d.date && typeof d.date === 'string')
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function SleepChart({ data, isBatman = false, isJoker = false }) {
  const dateRange = useDateRange()
  
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  const safeData = Array.isArray(data) ? data : []
  const dataMap = new Map()
  
  safeData
    .filter(d => d && d.sleep_hours !== null && d.sleep_hours !== undefined)
    .forEach(d => {
      if (d.date) {
        dataMap.set(String(d.date), parseFloat(d.sleep_hours))
      }
    })
  
  const chartData = createSafeChartData(dateRange, dataMap, 'sleep')
  
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  const hasData = chartData.some(d => d.sleep !== null && d.sleep !== undefined)
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  const sleepValues = chartData.map(d => d.sleep).filter(v => v !== null && v !== undefined)
  const minSleep = sleepValues.length > 0 ? Math.max(4, Math.floor(Math.min(...sleepValues) - 1)) : 4
  const maxSleep = sleepValues.length > 0 ? Math.min(10, Math.ceil(Math.max(...sleepValues) + 1)) : 10

  try {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
  } catch (error) {
    console.error('Error rendering SleepChart:', error)
    return <div className="text-center text-muted-foreground py-8">Error loading chart</div>
  }
}

export function EnergyChart({ data, isBatman = false, isJoker = false }) {
  const dateRange = useDateRange()
  
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  const safeData = Array.isArray(data) ? data : []
  const dataMap = new Map()
  
  safeData
    .filter(d => d && d.energy_1_10 !== null && d.energy_1_10 !== undefined)
    .forEach(d => {
      if (d.date) {
        dataMap.set(String(d.date), parseInt(d.energy_1_10))
      }
    })
  
  const chartData = createSafeChartData(dateRange, dataMap, 'energy')
  
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  const hasData = chartData.some(d => d.energy !== null && d.energy !== undefined)
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  const energyValues = chartData.map(d => d.energy).filter(v => v !== null && v !== undefined)
  const minEnergy = energyValues.length > 0 ? Math.max(1, Math.min(...energyValues) - 1) : 1
  const maxEnergy = energyValues.length > 0 ? Math.min(10, Math.max(...energyValues) + 1) : 10

  try {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
  } catch (error) {
    console.error('Error rendering EnergyChart:', error)
    return <div className="text-center text-muted-foreground py-8">Error loading chart</div>
  }
}

export function WeightChart({ data, isBatman = false, isJoker = false }) {
  const dateRange = useDateRange()
  
  if (!Array.isArray(dateRange) || dateRange.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>
  }
  
  const safeData = Array.isArray(data) ? data : []
  const dataMap = new Map()
  
  safeData
    .filter(d => d && d.weight_lbs !== null && d.weight_lbs !== undefined && d.weight_lbs !== 'P')
    .forEach(d => {
      if (d.date) {
        dataMap.set(String(d.date), parseFloat(d.weight_lbs))
      }
    })
  
  const chartData = createSafeChartData(dateRange, dataMap, 'weight')
  
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }

  const weightValues = chartData.map(d => d.weight).filter(v => v !== null && v !== undefined)
  if (weightValues.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }
  
  const minWeight = 195
  const maxWeight = 260

  try {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
  } catch (error) {
    console.error('Error rendering WeightChart:', error)
    return <div className="text-center text-muted-foreground py-8">Error loading chart</div>
  }
}

export function CompletionChart({ data, isBatman = false, isJoker = false }) {
  const safeData = Array.isArray(data) ? data : []
  
  if (safeData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }
  
  const chartData = safeData
    .filter(d => d && d.date && (d.score !== null && d.score !== undefined))
    .map(d => ({
      date: String(d.date),
      score: Number(d.score) || 0
    }))
    .filter(d => d && d.date && typeof d.date === 'string')
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  try {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
  } catch (error) {
    console.error('Error rendering CompletionChart:', error)
    return <div className="text-center text-muted-foreground py-8">Error loading chart</div>
  }
}
