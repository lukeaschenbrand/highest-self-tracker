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
      const fileType = file.type
      
      // Check if it's a JSON file first
      const isJSON = fileName.endsWith('.json') || fileType === 'application/json'
      
      // Default to CSV if not JSON (handles files without extensions)
      const isCSV = !isJSON && (
        fileName.endsWith('.csv') || 
        fileType === 'text/csv' || 
        fileType === 'application/vnd.ms-excel' ||
        fileType.startsWith('text/') ||
        fileType === '' // Some systems don't provide MIME type
      )
      
      if (isCSV || (!isJSON && !fileName.includes('.'))) {
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
      } else if (isJSON) {
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
        // Try to detect by reading first part of file
        const reader = new FileReader()
        
        reader.onload = async (e) => {
          try {
            const content = e.target.result
            // Check if it looks like CSV (has commas and Date column)
            if (content.includes(',') && content.includes('Date')) {
              const data = await importCSVFile(file)
              data.logEntries.forEach(entry => saveLogEntry(entry))
              data.metricEntries.forEach(entry => saveMetricEntry(entry))
              setStatus(`Successfully imported ${data.logEntries.length} log entries and ${data.metricEntries.length} metric entries!`)
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
            } else if (content.trim().startsWith('{')) {
              // Looks like JSON - read full file
              const fullReader = new FileReader()
              fullReader.onload = async (fullEvent) => {
                try {
                  const fullContent = fullEvent.target.result
                  const data = JSON.parse(fullContent)
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
                } catch (err) {
                  setStatus(`Error: ${err.message}`)
                  setIsLoading(false)
                }
              }
              fullReader.onerror = () => {
                setStatus('Error: Failed to read file')
                setIsLoading(false)
              }
              fullReader.readAsText(file)
              return // Don't set loading to false yet
            } else {
              throw new Error('Unsupported file type. File must be CSV (with Date column) or JSON format.')
            }
          } catch (err) {
            setStatus(`Error: ${err.message}`)
            setIsLoading(false)
          }
        }
        
        reader.onerror = () => {
          setStatus('Error: Failed to read file')
          setIsLoading(false)
        }
        
        // Read first 2KB to detect format
        const blob = file.slice(0, 2000)
        reader.readAsText(blob)
        return // Don't set loading to false yet, wait for detection
      }
    } catch (error) {
      console.error('Import error:', error)
      setStatus(`Error: ${error.message}. Please check the console for details.`)
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
            accept=".csv,.json,text/csv,application/json,text/plain"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: CSV (exported from this app) or JSON (full backup). Files without extensions will be detected by content.
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

