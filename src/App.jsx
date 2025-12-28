import { useState, useEffect } from 'react'
import { DailyLog } from './components/DailyLog'
import { Dashboard } from './components/Dashboard'
import { BackfillDialog } from './components/BackfillDialog'
import { ViewerSelector } from './components/ViewerSelector'
import { PasswordEntry } from './components/PasswordEntry'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Button } from './components/ui/button'
import { formatDate } from './lib/scoring'
import { loadTasks, saveTasks } from './lib/storage'
import { getDefaultTasks } from './lib/tasks'
import { getProjectStartDate, initializeProject } from './lib/backfill'
import { getAuth, isEditor, USER_TYPES, clearAuth } from './lib/auth'

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('log')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showBackfill, setShowBackfill] = useState(false)
  const [authState, setAuthState] = useState(null) // null = checking, 'selecting' = show selector, 'password' = show password, 'authenticated' = show app
  const [userType, setUserType] = useState(null)

  // Check authentication on load
  useEffect(() => {
    const auth = getAuth()
    if (auth) {
      setUserType(auth.userType)
      setAuthState('authenticated')
    } else {
      setAuthState('selecting')
    }
  }, [])

  // Initialize tasks on first load (only when authenticated)
  useEffect(() => {
    if (authState === 'authenticated') {
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
    }
  }, [authState])

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

  const handleViewerSelect = (selectedType) => {
    if (selectedType === USER_TYPES.JOKER) {
      // Joker is already authenticated
      setUserType(USER_TYPES.JOKER)
      setAuthState('authenticated')
    } else {
      // Batman needs password
      setAuthState('password')
    }
  }

  const handlePasswordSuccess = () => {
    setUserType(USER_TYPES.BATMAN)
    setAuthState('authenticated')
  }

  const handlePasswordCancel = () => {
    setAuthState('selecting')
  }

  const handleLogout = () => {
    clearAuth()
    setAuthState('selecting')
    setUserType(null)
  }

  // Show loading state while checking auth
  if (authState === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // Show viewer selector
  if (authState === 'selecting') {
    return <ViewerSelector onSelect={handleViewerSelect} />
  }

  // Show password entry
  if (authState === 'password') {
    return (
      <PasswordEntry 
        onSuccess={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
      />
    )
  }

  // Show main app (authenticated)
  const isBatman = userType === USER_TYPES.BATMAN
  const isJoker = userType === USER_TYPES.JOKER
  const canEdit = isEditor()

  return (
    <div className={`min-h-screen ${isBatman ? 'bg-gray-900' : isJoker ? 'bg-gray-100' : 'bg-background'}`}>
      {/* Sticky Header */}
      <div className={`sticky top-0 z-50 border-b shadow-sm ${
        isBatman ? 'bg-gray-800 border-gray-700' : 'bg-card'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBatman ? (
                <h1 className="text-2xl font-bold text-yellow-400">Welcome Back, Batman.</h1>
              ) : isJoker ? (
                <>
                  <img 
                    src="/joker-opener.png" 
                    alt="Joker" 
                    className="w-8 h-8 rounded-full"
                  />
                  <h1 className="text-2xl font-bold text-purple-600">Welcome back, Joker.</h1>
                </>
              ) : (
                <h1 className="text-2xl font-bold">Highest Self Tracker</h1>
              )}
            </div>
            <div className="flex items-center gap-4">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackfill(true)}
                  className={isBatman ? 'bg-gray-700 hover:bg-yellow-600 hover:text-black text-yellow-400 border border-gray-600' : ''}
                >
                  Initialize/Backfill
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className={isBatman ? 'bg-gray-700 hover:bg-yellow-400 hover:text-black text-yellow-400 border border-gray-600' : ''}
              >
                Log Out
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDateChange(-1)}
                className={isBatman ? 'bg-gray-700 hover:bg-yellow-400 hover:text-black text-yellow-400 border border-gray-600' : ''}
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
                className={`px-3 py-2 border rounded-md transition-colors ${
                  isBatman 
                    ? 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-yellow-600 hover:text-black' 
                    : ''
                }`}
              />
              <Button
                variant="outline"
                onClick={() => handleDateChange(1)}
                className={isBatman ? 'bg-gray-700 hover:bg-yellow-400 hover:text-black text-yellow-400 border border-gray-600' : ''}
              >
                →
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
                className={isBatman ? 'bg-gray-700 hover:bg-yellow-400 hover:text-black text-yellow-400 border border-gray-600' : ''}
              >
                Today
              </Button>
            </div>
          </div>
        </div>
        
        {/* Sticky Tabs */}
        <div className={`border-t ${
          isBatman ? 'bg-gray-800 border-gray-700' : 'bg-background'
        }`}>
          <div className="max-w-7xl mx-auto px-4 py-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={isBatman ? 'bg-gray-800 border border-gray-700' : ''}>
                <TabsTrigger 
                  value="log"
                  className={isBatman 
                    ? `${activeTab === 'log' ? 'bg-yellow-600 text-black border-yellow-600' : 'bg-gray-700 text-yellow-400 border-gray-600'} hover:bg-yellow-600 hover:text-black border`
                    : isJoker
                    ? `${activeTab === 'log' ? 'bg-purple-600 text-green-400 border-purple-600' : 'bg-gray-200 text-gray-700 border-gray-300'} hover:bg-green-500 hover:text-purple-600 border`
                    : ''}
                >
                  Daily Log
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard"
                  className={isBatman 
                    ? `${activeTab === 'dashboard' ? 'bg-yellow-600 text-black border-yellow-600' : 'bg-gray-700 text-yellow-400 border-gray-600'} hover:bg-yellow-600 hover:text-black border`
                    : isJoker
                    ? `${activeTab === 'dashboard' ? 'bg-purple-600 text-green-400 border-purple-600' : 'bg-gray-200 text-gray-700 border-gray-300'} hover:bg-green-500 hover:text-purple-600 border`
                    : ''}
                >
                  Dashboard
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="log" className="mt-0">
          {isJoker && activeTab === 'log' ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-purple-600 mb-4">Nice try.</h2>
                <p className="text-2xl text-gray-700">You wish you were Batman.</p>
              </div>
            </div>
          ) : (
            <DailyLog 
              selectedDate={selectedDate} 
              onSave={handleSave}
              canEdit={canEdit}
              isBatman={isBatman}
              key={`log-${formatDate(selectedDate)}`}
            />
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0">
          <Dashboard 
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            canEdit={canEdit}
            isBatman={isBatman}
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

