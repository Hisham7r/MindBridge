// Payment Controller — Phase 2
// Will handle: submitPayment, getPayment, approvePayment, rejectPayment

export const submitPayment = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'submitPayment not yet implemented' })
  } catch (err) { next(err) }
}

export const getPayment = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'getPayment not yet implemented' })
  } catch (err) { next(err) }
}

export const approvePayment = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'approvePayment not yet implemented' })
  } catch (err) { next(err) }
}

export const rejectPayment = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'rejectPayment not yet implemented' })
  } catch (err) { next(err) }
}
