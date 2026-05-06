// Auth Controller — Phase 2
// Will handle: register, login, logout, getMe

export const register = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'register not yet implemented' })
  } catch (err) { next(err) }
}

export const login = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'login not yet implemented' })
  } catch (err) { next(err) }
}

export const logout = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'logout not yet implemented' })
  } catch (err) { next(err) }
}

export const getMe = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'getMe not yet implemented' })
  } catch (err) { next(err) }
}
