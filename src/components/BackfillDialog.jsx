import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { initializeProject, getProjectStartDate } from '@/lib/backfill'
import { formatDate } from '@/lib/scoring'
import { loadProjectStartDate } from '@/lib/storage'

export function BackfillDialog({ onClose }) {
  const [startDate, setStartDate] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const projectStart = await getProjectStartDate()
      if (projectStart) {
        setStartDate(formatDate(projectStart))
      } else {
        // Default to 12/22 of current year if not set
        const currentYear = new Date().getFullYear()
        setStartDate(`${currentYear}-12-22`)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleInitialize = async () => {
    try {
      const result = await initializeProject(startDate)
      setStatus(`Project initialized! Start date: ${result.startDate}, Total days: ${result.totalDays}`)
      setTimeout(() => {
        if (onClose) onClose()
        window.location.reload() // Refresh to show the new date range
      }, 1500)
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Initialize Project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Project Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will set the start date for your tracking. All dates from this date to today will be available.
          </p>
        </div>
        
        {status && (
          <div className={`p-3 rounded ${status.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {status}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button onClick={handleInitialize} className="flex-1">
            Initialize Project
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
