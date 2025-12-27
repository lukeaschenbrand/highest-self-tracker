import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function SleepChart({ data }) {
  const chartData = data
    .filter(d => d.sleep_hours !== null && d.sleep_hours !== undefined)
    .map(d => ({
      date: d.date.split('-').slice(1).join('/'), // MM/DD format
      sleep: parseFloat(d.sleep_hours)
    }))
    .slice(-30) // Last 30 days

  if (chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No sleep data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 12]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sleep" stroke="#8884d8" strokeWidth={2} name="Sleep (hours)" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function EnergyChart({ data }) {
  const chartData = data
    .filter(d => d.energy_1_10 !== null && d.energy_1_10 !== undefined)
    .map(d => ({
      date: d.date.split('-').slice(1).join('/'),
      energy: parseInt(d.energy_1_10)
    }))
    .slice(-30)

  if (chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No energy data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[1, 10]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="energy" stroke="#82ca9d" strokeWidth={2} name="Energy (1-10)" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function WeightChart({ data }) {
  const chartData = data
    .filter(d => d.weight_lbs !== null && d.weight_lbs !== undefined && d.weight_lbs !== 'P')
    .map(d => ({
      date: d.date.split('-').slice(1).join('/'),
      weight: parseFloat(d.weight_lbs)
    }))
    .slice(-30)

  if (chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No weight data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="weight" stroke="#ffc658" strokeWidth={2} name="Weight (lbs)" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CompletionChart({ data }) {
  // data should be array of { date, score } objects
  const chartData = data
    .filter(d => d.score !== null && d.score !== undefined)
    .map(d => ({
      date: d.date.split('-').slice(1).join('/'),
      score: d.score
    }))
    .slice(-30)

  if (chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No completion data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="score" fill="#8884d8" name="Completion %" />
      </BarChart>
    </ResponsiveContainer>
  )
}

