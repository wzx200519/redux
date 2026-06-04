import type { Middleware } from './types/middleware'

/**
 * Creates a custom Redux middleware.
 */
export function createMiddleware<
  State = any,
  DispatchExt = {}
>(): Middleware<DispatchExt, State> {
  return (store) => (next) => (action) => {
    // Middleware logic goes here
    
    // Pass the action to the next middleware in line
    return next(action)
  }
}
