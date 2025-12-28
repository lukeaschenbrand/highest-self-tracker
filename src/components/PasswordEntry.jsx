import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { setAuth, verifyPassword, USER_TYPES } from '@/lib/auth'

export function PasswordEntry({ onSuccess, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (verifyPassword(password)) {
      setAuth(USER_TYPES.BATMAN, password)
      onSuccess()
    } else {
      setError('Incorrect password. Try again.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="mb-8">
          <img 
            src="/batman-icon.png" 
            alt="Batman" 
            className="w-32 h-32 mx-auto mb-6 rounded-full"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          Enter Password
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            placeholder="Enter password..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
            autoFocus
          />
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          
          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
            >
              Enter
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

