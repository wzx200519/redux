import type { Middleware, MiddlewareAPI } from './types/middleware'
import type { Dispatch } from './types/store'

export type { Middleware, MiddlewareAPI } from './types/middleware'

export interface CreateMiddlewareOptions {
  name?: string
  onAction?: (action: unknown, api: MiddlewareAPI) => void
  onError?: (error: Error, action: unknown) => void
}

export function createMiddleware(
  options?: CreateMiddlewareOptions
): Middleware {
  const { name = 'anonymous', onAction, onError } = options || {}

  const middleware: Middleware = (api: MiddlewareAPI) => {
    return (next: (action: unknown) => unknown) => {
      return (action: unknown) => {
        try {
          if (onAction) {
            onAction(action, api)
          }
          return next(action)
        } catch (error) {
          if (onError && error instanceof Error) {
            onError(error, action)
          }
          throw error
        }
      }
    }
  }
  return middleware
}

export function composeMiddleware(
  ...middlewares: Middleware[]
): Middleware {
  const middleware: Middleware = (api: MiddlewareAPI) => {
    const chain = middlewares.map(middleware => middleware(api))
    return (next: (action: unknown) => unknown) => {
      return chain.reduceRight(
        (composed: (action: unknown) => unknown, middleware) => middleware(composed),
        next as (action: unknown) => unknown
      )
    }
  }
  return middleware
}

export function isMiddleware(value: unknown): value is Middleware {
  return typeof value === 'function'
}