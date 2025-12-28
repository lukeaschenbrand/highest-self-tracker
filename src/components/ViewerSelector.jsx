import { useState } from 'react'
import { setAuth, USER_TYPES } from '@/lib/auth'

export function ViewerSelector({ onSelect }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (userType) => {
    setSelected(userType)
    
    if (userType === USER_TYPES.JOKER) {
      // Joker = viewer only, no password needed
      setAuth(USER_TYPES.JOKER)
      onSelect(USER_TYPES.JOKER)
    } else {
      // Batman = needs password, will be handled by parent
      onSelect(USER_TYPES.BATMAN)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-white mb-12">
          Who's viewing?
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Joker - Left */}
          <div 
            className={`cursor-pointer transform transition-all duration-300 hover:scale-105 ${
              selected === USER_TYPES.JOKER ? 'ring-4 ring-purple-500' : ''
            }`}
            onClick={() => handleSelect(USER_TYPES.JOKER)}
          >
            <div className="bg-gray-800 rounded-lg p-6 shadow-2xl border-2 border-purple-600">
              <img 
                src="/joker-opener.png" 
                alt="Joker" 
                className="w-full h-[400px] object-cover rounded-lg mb-4"
              />
              <h2 className="text-3xl font-bold text-purple-400 mb-2">Joker</h2>
              <p className="text-gray-300">View Only</p>
            </div>
          </div>

          {/* Batman - Right */}
          <div 
            className={`cursor-pointer transform transition-all duration-300 hover:scale-105 ${
              selected === USER_TYPES.BATMAN ? 'ring-4 ring-yellow-500' : ''
            }`}
            onClick={() => handleSelect(USER_TYPES.BATMAN)}
          >
            <div className="bg-gray-800 rounded-lg p-6 shadow-2xl border-2 border-yellow-600">
              <img 
                src="/batman-opener.png" 
                alt="Batman" 
                className="w-full h-[400px] object-cover rounded-lg mb-4"
              />
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">Batman</h2>
              <p className="text-gray-300">Editor Mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

