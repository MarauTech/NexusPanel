import { body, validationResult } from 'express-validator';

export const validateService = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('url').notEmpty().withMessage('URL is required').trim(),
  body('category_id').optional({ nullable: true }).isInt()
];

export const validateCategory = [
  body('name').notEmpty().withMessage('Name is required').trim()
];

export const validateTag = [
  body('name').notEmpty().withMessage('Name is required').trim()
];

export const validateLogin = [
  body('username').notEmpty().withMessage('Username is required').trim(),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateSetup = [
  body('username').notEmpty().withMessage('Username is required').trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('dashboard_name').optional().trim()
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
