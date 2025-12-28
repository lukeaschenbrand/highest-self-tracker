import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SleepChart, EnergyChart, WeightChart, CompletionChart } from '@/components/Charts'
import { 
  loadTasks, 
  loadLogEntries, 
  loadMetricEntries 
} from '@/lib/storage'
import { getDefaultTasks, PILLARS } from '@/lib/tasks'
import { 
  calculateScore, 
  calculatePeriodScore,
  formatDate,
  parseDate,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  getYearStart,
  getYearEnd,
} from '@/lib/scoring'
import { exportCurrentWeek, exportCurrentMonth, exportAll } from '@/lib/export'
import { getProjectStartDate } from '@/lib/backfill'
import { ImportDialog } from '@/components/ImportDialog'

export function Dashboard({ selectedDate, onDateChange, canEdit = true, isBatman = false, isJoker = false }) {
  const [tasks, setTasks] = useState([])
  const [logEntries, setLogEntries] = useState([])
  const [metricEntries, setMetricEntries] = useState([])
  const [period, setPeriod] = useState('day')
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    let loadedTasks = loadTasks()
    if (loadedTasks.length === 0) {
      loadedTasks = getDefaultTasks()
    }
    setTasks(loadedTasks)
    setLogEntries(loadLogEntries())
    setMetricEntries(loadMetricEntries())
  }, [])

  // Refresh data when date changes
  useEffect(() => {
    setLogEntries(loadLogEntries())
    setMetricEntries(loadMetricEntries())
  }, [selectedDate])

  const getOverallScore = () => {
    if (period === 'day') {
      return calculateScore(logEntries, tasks, selectedDate)
    } else if (period === 'week') {
      const weekStart = getWeekStart(selectedDate)
      const weekEnd = getWeekEnd(selectedDate)
      return calculatePeriodScore(logEntries, tasks, weekStart, weekEnd)
    } else if (period === 'month') {
      const monthStart = getMonthStart(selectedDate)
      const monthEnd = getMonthEnd(selectedDate)
      return calculatePeriodScore(logEntries, tasks, monthStart, monthEnd)
    } else if (period === 'year') {
      const yearStart = getYearStart(selectedDate)
      const yearEnd = getYearEnd(selectedDate)
      return calculatePeriodScore(logEntries, tasks, yearStart, yearEnd)
    }
    return null
  }

  const getPillarScore = (pillar) => {
    if (period === 'day') {
      return calculateScore(logEntries, tasks, selectedDate, pillar)
    } else if (period === 'week') {
      const weekStart = getWeekStart(selectedDate)
      const weekEnd = getWeekEnd(selectedDate)
      return calculatePeriodScore(logEntries, tasks, weekStart, weekEnd, pillar)
    } else if (period === 'month') {
      const monthStart = getMonthStart(selectedDate)
      const monthEnd = getMonthEnd(selectedDate)
      return calculatePeriodScore(logEntries, tasks, monthStart, monthEnd, pillar)
    } else if (period === 'year') {
      const yearStart = getYearStart(selectedDate)
      const yearEnd = getYearEnd(selectedDate)
      return calculatePeriodScore(logEntries, tasks, yearStart, yearEnd, pillar)
    }
    return null
  }

  const getWeeklyFitnessProgress = () => {
    const weekStart = getWeekStart(selectedDate)
    const weekEnd = getWeekEnd(selectedDate)
    const weekStartStr = formatDate(weekStart)
    const weekEndStr = formatDate(weekEnd)

    const liftingTasks = tasks.filter(t => 
      t.pillar === PILLARS.WEEKLY && t.label.startsWith('Lifting')
    )
    const cardioTask = tasks.find(t => 
      t.pillar === PILLARS.WEEKLY && t.label === 'Cardio Session'
    )

    let liftingCount = 0
    liftingTasks.forEach(task => {
      const entries = logEntries.filter(e => 
        e.task_id === task.id && 
        e.date >= weekStartStr && 
        e.date <= weekEndStr &&
        e.status === 'Y'
      )
      liftingCount += entries.length
    })

    let cardioCount = 0
    if (cardioTask) {
      const entries = logEntries.filter(e => 
        e.task_id === cardioTask.id && 
        e.date >= weekStartStr && 
        e.date <= weekEndStr &&
        e.status === 'Y'
      )
      cardioCount = entries.length
    }

    return {
      lifting: { completed: liftingCount, target: 4 },
      cardio: { completed: cardioCount, target: 3, min: 3, max: 5 },
    }
  }

  const overallScore = getOverallScore()
  const fitnessProgress = getWeeklyFitnessProgress()

  // Get completion data for chart
  const getCompletionData = () => {
    // Get date range from project start to today
    const projectStart = getProjectStartDate()
    const today = new Date()
    
    const dates = []
    const current = new Date(projectStart)
    
    while (current <= today) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates.map(date => {
      const score = calculateScore(logEntries, tasks, date)
      return {
        date: formatDate(date),
        score: score
      }
    })
  }

  const ScoreCard = ({ title, score, pillar }) => {
    const getColor = (score) => {
      if (isBatman) return 'text-yellow-400'
      if (score >= 80) return 'text-green-600'
      if (score >= 60) return 'text-yellow-600'
      return 'text-red-600'
    }

    if (score === null) {
      return (
        <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
          <CardHeader>
            <CardTitle className={`text-base ${isBatman ? 'text-yellow-400' : ''}`}>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isBatman ? 'text-yellow-400' : 'text-muted-foreground'}`}>—</div>
            <p className={`text-xs mt-1 ${isBatman ? 'text-yellow-400' : 'text-muted-foreground'}`}>No data</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className={isBatman ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className={`text-base ${isBatman ? 'text-yellow-400' : ''}`}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${getColor(score)}`}>
            {score}%
          </div>
          <div className={`mt-2 h-2 rounded-full overflow-hidden ${isBatman ? 'bg-gray-700' : 'bg-muted'}`}>
            <div
              className={`h-full ${isBatman ? 'bg-yellow-600' : (score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-yellow-600' : 'bg-red-600')}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const containerClass = isBatman 
    ? "max-w-6xl mx-auto p-4 space-y-6 bg-gray-900 min-h-screen"
    : isJoker
    ? "max-w-6xl mx-auto p-4 space-y-6 min-h-screen"
    : "max-w-6xl mx-auto p-4 space-y-6"

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${isBatman ? 'text-yellow-400' : ''}`}>Highest Self Dashboard</h1>
        {canEdit && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowImport(true)}
              className={isBatman ? 'bg-gray-700 hover:bg-yellow-600 hover:text-black text-yellow-400 border border-gray-600' : ''}
            >
              Import Data
            </Button>
            <Button 
              variant="outline" 
              onClick={exportCurrentWeek}
              className={isBatman ? 'bg-gray-700 hover:bg-yellow-600 hover:text-black text-yellow-400 border border-gray-600' : ''}
            >
              Export Week
            </Button>
            <Button 
              variant="outline" 
              onClick={exportCurrentMonth}
              className={isBatman ? 'bg-gray-700 hover:bg-yellow-600 hover:text-black text-yellow-400 border border-gray-600' : ''}
            >
              Export Month
            </Button>
            <Button 
              variant="outline" 
              onClick={exportAll}
              className={isBatman ? 'bg-gray-700 hover:bg-yellow-600 hover:text-black text-yellow-400 border border-gray-600' : ''}
            >
              Export All
            </Button>
          </div>
        )}
      </div>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList className={isBatman ? 'bg-gray-800 border border-gray-700' : ''}>
          <TabsTrigger 
            value="day"
            className={isBatman 
              ? `${period === 'day' ? 'bg-yellow-600 text-black border-yellow-600' : 'bg-gray-700 text-yellow-400 border-gray-600'} hover:bg-yellow-600 hover:text-black border`
              : isJoker
              ? `${period === 'day' ? 'bg-purple-600 text-green-400 border-purple-600' : 'bg-gray-200 text-gray-700 border-gray-300'} hover:bg-green-500 hover:text-purple-600 border`
              : ''}
          >
            Day
          </TabsTrigger>
          <TabsTrigger 
            value="week"
            className={isBatman 
              ? `${period === 'week' ? 'bg-yellow-600 text-black border-yellow-600' : 'bg-gray-700 text-yellow-400 border-gray-600'} hover:bg-yellow-600 hover:text-black border`
              : isJoker
              ? `${period === 'week' ? 'bg-purple-600 text-green-400 border-purple-600' : 'bg-gray-200 text-gray-700 border-gray-300'} hover:bg-green-500 hover:text-purple-600 border`
              : ''}
          >
            Week
          </TabsTrigger>
          <TabsTrigger 
            value="month"
            className={isBatman 
              ? `${period === 'month' ? 'bg-yellow-600 text-black border-yellow-600' : 'bg-gray-700 text-yellow-400 border-gray-600'} hover:bg-yellow-600 hover:text-black border`
              : isJoker
              ? `${period === 'month' ? 'bg-purple-600 text-green-400 border-purple-600' : 'bg-gray-200 text-gray-700 border-gray-300'} hover:bg-green-500 hover:text-purple-600 border`
              : ''}
          >
            Month
          </TabsTrigger>
          <TabsTrigger 
            value="year"
            className={isBatman 
              ? `${period === 'year' ? 'bg-yellow-600 text-black border-yellow-600' : 'bg-gray-700 text-yellow-400 border-gray-600'} hover:bg-yellow-600 hover:text-black border`
              : isJoker
              ? `${period === 'year' ? 'bg-purple-600 text-green-400 border-purple-600' : 'bg-gray-200 text-gray-700 border-gray-300'} hover:bg-green-500 hover:text-purple-600 border`
              : ''}
          >
            Year
          </TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-5">
              <ScoreCard title="Overall Highest Self" score={overallScore} />
            </div>
            <ScoreCard title="Morning" score={getPillarScore(PILLARS.MORNING)} />
            <ScoreCard title="Body" score={getPillarScore(PILLARS.BODY)} />
            <ScoreCard title="Work" score={getPillarScore(PILLARS.WORK)} />
            <ScoreCard title="Weekly" score={getPillarScore(PILLARS.WEEKLY)} />
          </div>

          {/* Weekly Fitness Progress */}
          {period === 'week' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
                <CardHeader>
                  <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Lifting Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isBatman ? 'text-yellow-400' : ''}`}>
                    {fitnessProgress.lifting.completed} / {fitnessProgress.lifting.target}
                  </div>
                  <div className={`mt-2 h-2 rounded-full overflow-hidden ${isBatman ? 'bg-gray-700' : 'bg-muted'}`}>
                    <div
                      className={`h-full ${isBatman ? 'bg-yellow-600' : 'bg-blue-600'}`}
                      style={{ 
                        width: `${Math.min(100, (fitnessProgress.lifting.completed / fitnessProgress.lifting.target) * 100)}%` 
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
                <CardHeader>
                  <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Cardio Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isBatman ? 'text-yellow-400' : ''}`}>
                    {fitnessProgress.cardio.completed} / {fitnessProgress.cardio.min}-{fitnessProgress.cardio.max}
                  </div>
                  <div className={`mt-2 h-2 rounded-full overflow-hidden ${isBatman ? 'bg-gray-700' : 'bg-muted'}`}>
                    <div
                      className={`h-full ${isBatman ? 'bg-yellow-600' : (fitnessProgress.cardio.completed >= fitnessProgress.cardio.min ? 'bg-green-600' : 'bg-yellow-600')}`}
                      style={{ 
                        width: `${Math.min(100, (fitnessProgress.cardio.completed / fitnessProgress.cardio.max) * 100)}%` 
                      }}
                    />
                  </div>
                  <Badge 
                    variant={fitnessProgress.cardio.completed >= fitnessProgress.cardio.min ? 'default' : 'secondary'}
                    className={`mt-2 ${
                      isBatman 
                        ? (fitnessProgress.cardio.completed >= fitnessProgress.cardio.min 
                            ? 'bg-yellow-600 text-black' 
                            : 'bg-white text-black hover:bg-white')
                        : ''
                    }`}
                  >
                    {fitnessProgress.cardio.completed >= fitnessProgress.cardio.min ? 'Minimum met' : 'Below minimum'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
              <CardHeader>
                <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Sleep Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <SleepChart data={metricEntries} isBatman={isBatman} isJoker={isJoker} />
              </CardContent>
            </Card>

            <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
              <CardHeader>
                <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Energy Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <EnergyChart data={metricEntries} isBatman={isBatman} isJoker={isJoker} />
              </CardContent>
            </Card>

            <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
              <CardHeader>
                <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Weight Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <WeightChart data={metricEntries} isBatman={isBatman} isJoker={isJoker} />
              </CardContent>
            </Card>

            <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
              <CardHeader>
                <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Daily Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <CompletionChart data={getCompletionData()} isBatman={isBatman} isJoker={isJoker} />
              </CardContent>
            </Card>
          </div>

          {/* Metrics Table */}
          <Card className={
          isBatman ? 'bg-gray-800 border-gray-700' 
          : isJoker ? 'bg-slate-800/80 border-purple-700/50 backdrop-blur-sm' 
          : ''
        }>
            <CardHeader>
              <CardTitle className={isBatman ? 'text-yellow-400' : ''}>Recent Body Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metricEntries.slice(-7).reverse().map(entry => (
                  <div 
                    key={entry.date} 
                    className={`flex items-center justify-between p-2 border rounded ${
                      isBatman ? 'border-gray-700 bg-gray-700' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${isBatman ? 'text-yellow-400' : ''}`}>{entry.date}</span>
                    <div className={`flex gap-4 text-sm ${isBatman ? 'text-yellow-400' : ''}`}>
                      <span>Sleep: {entry.sleep_hours || '—'}h</span>
                      <span>Energy: {entry.energy_1_10 || '—'}/10</span>
                      <span>Weight: {entry.weight_lbs === 'P' ? 'P' : (entry.weight_lbs || '—')}lbs</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <ImportDialog 
            onClose={() => setShowImport(false)} 
            onImport={() => {
              // Refresh data after import
              setTasks(loadTasks())
              setLogEntries(loadLogEntries())
              setMetricEntries(loadMetricEntries())
            }}
          />
        </div>
      )}
    </div>
  )
}

