export function getStoredToken() {
  return localStorage.getItem('fnb_token') || ''
}

export function isMockSession() {
  return getStoredToken().startsWith('mock-jwt-token-')
}
