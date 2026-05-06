// Session Controller — Phase 2
// Will handle: createSession, getSession, updateSessionStatus, listPatientSessions

export const createSession = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'createSession not yet implemented' })
  } catch (err) { next(err) }
}

export const getSession = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'getSession not yet implemented' })
  } catch (err) { next(err) }
}

export const updateSessionStatus = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'updateSessionStatus not yet implemented' })
  } catch (err) { next(err) }
}

export const listPatientSessions = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'listPatientSessions not yet implemented' })
  } catch (err) { next(err) }
}
