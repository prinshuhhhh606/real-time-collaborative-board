const { z } = require('zod');

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    });
  }

  req.body = result.data;
  return next();
};

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Query validation failed',
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'query',
        message: issue.message,
      })),
    });
  }

  req.query = result.data;
  return next();
};

const validateObjectId = (value) => {
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    throw new Error('Invalid object id');
  }
  return value;
};

module.exports = { validateBody, validateQuery, validateObjectId, z };
