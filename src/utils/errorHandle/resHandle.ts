import { IAppError } from "../types/error";

export class AppError extends Error implements IAppError {
  constructor(
    message:string,
    public statusCode?: number | undefined,
    options?:ErrorOptions
  ) 
    {
      super(message,options);
  } 
} 
export class NotFoundError extends AppError {
  constructor(message?:string) {
    super(message || "not found", 404);
  } 
}
export class ConflictError extends AppError {
  constructor(message?:string) {
    super(message || "conflict", 409);
  } 
}export class BadRequestError extends AppError {
  constructor(message?:string) {
    super(message || "bad request", 400);
  } 
}
