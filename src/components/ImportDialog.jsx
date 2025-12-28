import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { importCSVFile, importJSONFile } from '@/lib/export'
import { importData, saveLogEntry, saveMetricEntry } from '@/lib/storage'

export function ImportDialog({ onClose, onImport }) {
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsLoading(true)
    setStatus('')

    try {
      const fileName = file.name.toLowerCase()
      
      if (fileName.endsWith('.csv')) {
        // Import CSV
        const data = await importCSVFile(file)
        
        // Save imported data
        data.logEntries.forEach(entry => {
          saveLogEntry(entry)
        })
        
        data.metricEntries.forEach(entry => {
          saveMetricEntry(entry)
        })
        
        setStatus(`Successfully imported ${data.logEntries.length} log entries and ${data.metricEntries.length} metric entries from CSV!`)
        
        if (onImport) {
          setTimeout(() => {
            onImport()
            if (onClose) onClose()
          }, 1500)
        } else if (onClose) {
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      } else if (fileName.endsWith('.json')) {
        // Import JSON (full backup)
        const data = await importJSONFile(file)
        
        if (importData(data)) {
          setStatus('Successfully imported all data from JSON backup!')
          
          if (onImport) {
            setTimeout(() => {
              onImport()
              if (onClose) onClose()
            }, 1500)
          } else if (onClose) {
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          }
        } else {
          throw new Error('Failed to import JSON data')
        }
      } else {
        throw new Error('Unsupported file type. Please use .csv or .json files.')
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select File to Import
          </label>
          <Input
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: CSV (exported from this app) or JSON (full backup)
          </p>
        </div>
        
        {status && (
          <div className={`p-3 rounded ${
            status.includes('Error') 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            {status}
          </div>
        )}
        
        {isLoading && (
          <div className="text-center text-muted-foreground">
            Importing...
          </div>
        )}
        
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

