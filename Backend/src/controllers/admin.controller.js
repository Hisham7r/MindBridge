// Admin Controller — Phase 2
// Will handle: listAllUsers, getDashboardStats, reviewPayment, listAllSessions

export const listAllUsers = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'listAllUsers not yet implemented' })
  } catch (err) { next(err) }
}

export const getDashboardStats = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'getDashboardStats not yet implemented' })
  } catch (err) { next(err) }
}

export const reviewPayment = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'reviewPayment not yet implemented' })
  } catch (err) { next(err) }
}

export const listAllSessions = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'listAllSessions not yet implemented' })
  } catch (err) { next(err) }
}
