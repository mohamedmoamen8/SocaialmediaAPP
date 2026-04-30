import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod'; 

interface ValidationSchema {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validation = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        result.error.issues.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
          });
        });
      } else {
        req.body = result.data;
      }
    }

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        result.error.issues.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
          });
        });
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        result.error.issues.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
          });
        });
      }
    }

    if (errors.length > 0) {
      res.status(422).json({
        message: 'Validation error',
        errors,
      });
      return;
    }

    next();
  };
};