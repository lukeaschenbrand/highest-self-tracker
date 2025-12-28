import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getProjectStartDate } from '@/lib/backfill'
import { formatDate, parseDate } from '@/lib/scoring'

// Helper to get date range from project start to today
function getDateRange() {
  const projectStart = getProjectStartDate()
  const today = new Date()
  const dates = []
  const current = new Date(projectStart)
  
  while (current <= today) {
    dates.push(formatDate(new Date(current)))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

// Helper to format date for display
function formatDateForDisplay(dateString) {
  return dateString.split('-').slice(1).join('/') // MM/DD format
}

export function SleepChart({ data, isBatman = false }) {
  const dateRange = getDateRange()
  
  // Create a map of existing data
  const dataMap = new Map()
  data
    .filter(d => d.sleep_hours !== null && d.sleep_hours !== undefined)
    .forEach(d => {
      dataMap.set(d.date, parseFloat(d.sleep_hours))
    })
  
  // Build chart data for all dates from start to today
  // Keep full date (YYYY-MM-DD) for proper ordering
  // Explicitly ensure dates are sorted chronologically
  const chartData = dateRange
    .map(date => {
      const sleep = dataMap.get(date)
      return {
        date: date, // Keep full date for ordering
        sleep: sleep !== undefined ? sleep : null
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date)) // Explicitly sort by date

  // Check if we have any actual data (not just empty dates)
  const hasData = chartData.some(d => d.sleep !== null)
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  // Calculate min/max for Y-axis (with some padding)
  const sleepValues = chartData.map(d => d.sleep).filter(v => v !== null)
  const minSleep = sleepValues.length > 0 ? Math.max(4, Math.floor(Math.min(...sleepValues) - 1)) : 4
  const maxSleep = sleepValues.length > 0 ? Math.min(10, Math.ceil(Math.max(...sleepValues) + 1)) : 10

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => formatDateForDisplay(value)}
          type="category"
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minSleep, maxSleep]} />
        <Tooltip 
          labelFormatter={(value) => formatDateForDisplay(value)}
        />
        <Legend />
        <Line type="monotone" dataKey="sleep" stroke={isBatman ? "#eab308" : "#8884d8"} strokeWidth={2} name="Sleep (hours)" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function EnergyChart({ data, isBatman = false }) {
  const dateRange = getDateRange()
  
  // Create a map of existing data
  const dataMap = new Map()
  data
    .filter(d => d.energy_1_10 !== null && d.energy_1_10 !== undefined)
    .forEach(d => {
      dataMap.set(d.date, parseInt(d.energy_1_10))
    })
  
  // Build chart data for all dates from start to today
  // Keep full date (YYYY-MM-DD) for proper ordering
  // Explicitly ensure dates are sorted chronologically
  const chartData = dateRange
    .map(date => {
      const energy = dataMap.get(date)
      return {
        date: date, // Keep full date for ordering
        energy: energy !== undefined ? energy : null
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date)) // Explicitly sort by date

  // Check if we have any actual data (not just empty dates)
  const hasData = chartData.some(d => d.energy !== null)
  if (!hasData) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  // Calculate min/max for Y-axis (with some padding)
  const energyValues = chartData.map(d => d.energy).filter(v => v !== null)
  const minEnergy = energyValues.length > 0 ? Math.max(1, Math.min(...energyValues) - 1) : 1
  const maxEnergy = energyValues.length > 0 ? Math.min(10, Math.max(...energyValues) + 1) : 10

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => formatDateForDisplay(value)}
          type="category"
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minEnergy, maxEnergy]} />
        <Tooltip 
          labelFormatter={(value) => formatDateForDisplay(value)}
        />
        <Legend />
        <Line type="monotone" dataKey="energy" stroke={isBatman ? "#eab308" : "#82ca9d"} strokeWidth={2} name="Energy (1-10)" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function WeightChart({ data, isBatman = false }) {
  const dateRange = getDateRange()
  
  // Create a map of existing data
  const dataMap = new Map()
  data
    .filter(d => d.weight_lbs !== null && d.weight_lbs !== undefined && d.weight_lbs !== 'P')
    .forEach(d => {
      dataMap.set(d.date, parseFloat(d.weight_lbs))
    })
  
  // Build chart data for all dates from start to today
  // Keep full date (YYYY-MM-DD) for proper ordering
  // Explicitly ensure dates are sorted chronologically
  const chartData = dateRange
    .map(date => {
      const weight = dataMap.get(date)
      return {
        date: date, // Keep full date for ordering
        weight: weight !== undefined ? weight : null
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date)) // Explicitly sort by date

  // Check if we have any actual data (not just empty dates)
  const weightValues = chartData.map(d => d.weight).filter(v => v !== null)
  if (weightValues.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }
  
  // Fixed Y-axis range: 195-260 lbs
  const minWeight = 195
  const maxWeight = 260

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => formatDateForDisplay(value)}
          type="category"
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[minWeight, maxWeight]} />
        <Tooltip 
          labelFormatter={(value) => formatDateForDisplay(value)}
        />
        <Legend />
        <Line type="monotone" dataKey="weight" stroke={isBatman ? "#eab308" : "#8884d8"} strokeWidth={2} name="Weight (lbs)" connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CompletionChart({ data, isBatman = false }) {
  // data should be array of { date, score } objects
  // Already filtered to project start date range, so no need to slice
  // Keep full date (YYYY-MM-DD) for proper ordering
  const chartData = data
    .filter(d => d.score !== null && d.score !== undefined)
    .map(d => ({
      date: d.date, // Keep full date for ordering
      score: d.score
    }))

  if (chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tickFormatter={(value) => formatDateForDisplay(value)}
          type="category"
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip 
          labelFormatter={(value) => formatDateForDisplay(value)}
        />
        <Legend />
        <Bar dataKey="score" fill={isBatman ? "#eab308" : "#8884d8"} name="Completion %" />
      </BarChart>
    </ResponsiveContainer>
  )
}

