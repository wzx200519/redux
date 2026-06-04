import type { Middleware, MiddlewareAPI } from './types/middleware'
import type { Dispatch, Action } from './types/store'

export function createMiddleware<
  DispatchExt = {},
  S = any,
  D extends Dispatch = Dispatch
>(
  middlewareFactory: (api: MiddlewareAPI<D, S>) => (
    next: (action: unknown) => unknown
  ) => (action: unknown) => unknown
): Middleware<DispatchExt, S, D> {
  return middlewareFactory
}

export { applyMiddleware } from './applyMiddleware'
export type { Middleware, MiddlewareAPI } from './types/middleware'

export default createMiddleware
