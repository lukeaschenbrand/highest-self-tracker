// Authentication utilities for viewer/editor modes

const AUTH_KEY = 'hst_auth'
const AUTH_EXPIRY_DAYS = 7

export const USER_TYPES = {
  JOKER: 'joker',
  BATMAN: 'batman',
}

export function setAuth(userType, password = null) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + AUTH_EXPIRY_DAYS)
  
  const authData = {
    userType,
    expiry: expiryDate.getTime(),
    ...(password && { password }) // Store password for verification if needed
  }
  
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
}

export function getAuth() {
  const authStr = localStorage.getItem(AUTH_KEY)
  if (!authStr) return null
  
  try {
    const authData = JSON.parse(authStr)
    const now = Date.now()
    
    // Check if expired
    if (authData.expiry < now) {
      clearAuth()
      return null
    }
    
    return {
      userType: authData.userType,
      expiry: authData.expiry
    }
  } catch (e) {
    clearAuth()
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated() {
  return getAuth() !== null
}

export function isEditor() {
  const auth = getAuth()
  return auth && auth.userType === USER_TYPES.BATMAN
}

export function isViewer() {
  const auth = getAuth()
  return auth && auth.userType === USER_TYPES.JOKER
}

export function verifyPassword(password) {
  return password === 'enterthebatcave'
}

