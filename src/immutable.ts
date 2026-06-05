import type { Action } from './types/actions'
import type {
  ActionFromReducersMapObject,
  PreloadedStateShapeFromReducersMapObject,
  Reducer,
  StateFromReducersMapObject
} from './types/reducers'

import ActionTypes from './utils/actionTypes'
import warning from './utils/warning'

function assertReducerShape(reducers: {
  [key: string]: Reducer<any, any, any>
}) {
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key]
    const initialState = reducer(undefined, { type: ActionTypes.INIT })

    if (typeof initialState === 'undefined') {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }

    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION()
      }) === 'undefined'
    ) {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle '${ActionTypes.INIT}' or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

export default function combineReducers<M>(
  reducers: M
): M[keyof M] extends Reducer<any, any, any> | undefined
  ? Reducer<
      StateFromReducersMapObject<M>,
      ActionFromReducersMapObject<M>,
      Partial<PreloadedStateShapeFromReducersMapObject<M>>
    >
  : never
export default function combineReducers(reducers: {
  [key: string]: Reducer<any, any, any>
}) {
  const reducerKeys = Object.keys(reducers)
  const finalReducers: { [key: string]: Reducer<any, any, any> } = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  const finalReducerKeys = Object.keys(finalReducers)

  let shapeAssertionError: unknown
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  return function combination(
    state: any = undefined,
    action: Action
  ) {
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    let hasChanged = false
    let nextState = state
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      const previousStateForKey = nextState ? nextState.get(key) : undefined
      const nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        const actionType = action && action.type
        throw new Error(
          `When called with an action of type ${
            actionType ? `"${String(actionType)}"` : '(unknown type)'
          }, the slice reducer for key "${key}" returned undefined. ` +
            `To ignore an action, you must explicitly return the previous state. ` +
            `If you want this reducer to hold no value, you can return null instead of undefined.`
        )
      }
      if (nextStateForKey !== previousStateForKey) {
        hasChanged = true
        if (!nextState) {
          const Immutable = require('immutable')
          nextState = Immutable.Map()
        }
        nextState = nextState.set(key, nextStateForKey)
      }
    }
    return hasChanged ? nextState : state
  }
}
