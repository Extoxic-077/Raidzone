const { isProd } = require('../config/env');

class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code   = code;
  }
}

// Map well-known error names/codes to HTTP status + API error code
function classify(err) {
  if (err instanceof AppError) return { status: err.status, code: err.code, message: err.message };

  if (err.name === 'ValidationError') {
    const fields = {};
    for (const [k, v] of Object.entries(err.errors || {})) fields[k] = v.message;
    return { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed', fields };
  }

  if (err.name === 'CastError')            return { status: 400, code: 'VALIDATION_ERROR', message: 'Invalid ID format' };
  if (err.code === 11000)                  return { status: 409, code: 'CONFLICT',          message: 'Resource already exists' };
  if (err.name === 'JsonWebTokenError')    return { status: 401, code: 'AUTH_INVALID',      message: 'Invalid token' };
  if (err.name === 'TokenExpiredError')    return { status: 401, code: 'AUTH_INVALID',      message: 'Token expired' };
  if (err.name === 'MaxTimeMSExpired')     return { status: 503, code: 'INTERNAL_ERROR',    message: 'System busy, try again' };

  return {
    status:  500,
    code:    'INTERNAL_ERROR',
    message: isProd ? 'Internal server error' : err.message,
  };
}

function errorHandler(err, req, res, next) {
  const { status, code, message, fields } = classify(err);

  if (status >= 500) console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  const body = { success: false, error: message, code };
  if (fields) body.fields = fields;

  res.status(status).json(body);
}

module.exports = { errorHandler, AppError };
