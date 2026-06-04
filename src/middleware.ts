import type { Middleware, MiddlewareAPI } from './types/middleware'
import type { Dispatch } from './types/store'

export type MiddlewareHandler<S = any, D extends Dispatch = Dispatch> = (
  api: MiddlewareAPI<D, S>
) => (next: D) => (action: unknown) => unknown

export function createMiddleware<S = any, D extends Dispatch = Dispatch>(
  handler: MiddlewareHandler<S, D>
): Middleware<{}, S, D> {
  return api => next => action => handler(api)(next as D)(action)
}

export type { Middleware, MiddlewareAPI } from './types/middleware'

export default createMiddleware
