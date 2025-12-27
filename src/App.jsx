import { useState, useEffect } from 'react'
import { DailyLog } from './components/DailyLog'
import { Dashboard } from './components/Dashboard'
import { BackfillDialog } from './components/BackfillDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Button } from './components/ui/button'
import { formatDate } from './lib/scoring'
import { loadTasks, saveTasks } from './lib/storage'
import { getDefaultTasks } from './lib/tasks'
import { getProjectStartDate, initializeProject } from './lib/backfill'

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('log')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showBackfill, setShowBackfill] = useState(false)

  // Initialize tasks on first load
  useEffect(() => {
    const tasks = loadTasks()
    if (tasks.length === 0) {
      const defaultTasks = getDefaultTasks()
      saveTasks(defaultTasks)
    }
    
    // Check if project has been initialized
    const projectStart = localStorage.getItem('hst_project_start_date')
    if (!projectStart) {
      // Auto-initialize with 12/22/2024 (or current year)
      const currentYear = new Date().getFullYear()
      const initDate = `${currentYear}-12-22`
      initializeProject(initDate)
    }
  }, [])

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const handleSave = () => {
    // Trigger refresh of dashboard
    setRefreshKey(prev => prev + 1)
    // Auto-navigate to dashboard after save
    setActiveTab('dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Highest Self Tracker</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackfill(true)}
              >
                Initialize/Backfill
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDateChange(-1)}
              >
                ←
              </Button>
              <input
                type="date"
                value={formatDate(selectedDate)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value)
                  setSelectedDate(newDate)
                }}
                className="px-3 py-2 border rounded-md"
              />
              <Button
                variant="outline"
                onClick={() => handleDateChange(1)}
              >
                →
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
        </div>
        
        {/* Sticky Tabs */}
        <div className="border-t bg-background">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="log">Daily Log</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="log" className="mt-0">
          <DailyLog 
            selectedDate={selectedDate} 
            onSave={handleSave}
            key={`log-${formatDate(selectedDate)}`}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0">
          <Dashboard 
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            key={`dashboard-${refreshKey}`}
          />
        </TabsContent>
      </Tabs>
      
      {showBackfill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <BackfillDialog onClose={() => setShowBackfill(false)} />
        </div>
      )}
    </div>
  )
}

export default App

