import type { MiddlewareAPI, Middleware } from './types/middleware'
import type { Dispatch } from './types/store'

export { default as applyMiddleware } from './applyMiddleware'
export type { Middleware, MiddlewareAPI } from './types/middleware'

export interface MiddlewareLifecycle<S = any, D extends Dispatch = Dispatch> {
  onBefore?: (action: unknown, api: MiddlewareAPI<D, S>) => void
  onAfter?: (action: unknown, result: unknown, api: MiddlewareAPI<D, S>) => void
  onError?: (error: unknown, action: unknown, api: MiddlewareAPI<D, S>) => void
}

export function createMiddleware<S = any, D extends Dispatch = Dispatch>(
  config: MiddlewareLifecycle<S, D>
): Middleware<{}, S, D> {
  return (api: MiddlewareAPI<D, S>) => (next) => (action) => {
    config.onBefore?.(action, api)
    try {
      const result = next(action)
      config.onAfter?.(action, result, api)
      return result
    } catch (error) {
      config.onError?.(error, action, api)
      throw error
    }
  }
}