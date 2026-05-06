/**
 * Global Express error handler — must be the LAST middleware registered.
 * Catches any error passed via next(err) from routes or middleware.
 */
export default function errorHandler(err, req, res, next) {
  console.error(err.stack)

  const status  = err.status  || 500
  const message = err.message || 'Internal server error'

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
