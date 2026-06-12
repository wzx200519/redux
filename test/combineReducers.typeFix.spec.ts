import { describe, it, expect, expectTypeOf } from 'vitest'
import type { Reducer, Action } from 'redux'
import { combineReducers } from 'redux'

describe('combineReducers type fix', () => {
  describe('valid reducers object', () => {
    it('returns a combined reducer with correct type inference', () => {
      const counterReducer = (state: number = 0, action: Action) => {
        if (action.type === 'increment') return state + 1
        return state
      }

      const todoReducer = (
        state: string[] = [],
        action: { type: 'ADD_TODO'; payload: string }
      ) => {
        if (action.type === 'ADD_TODO') return [...state, action.payload]
        return state
      }

      const combined = combineReducers({
        counter: counterReducer,
        todos: todoReducer
      })

      const initialState = combined(undefined, { type: '@@INIT' })
      expect(initialState).toEqual({ counter: 0, todos: [] })

      const nextState = combined(initialState, { type: 'increment' })
      expect(nextState).toEqual({ counter: 1, todos: [] })

      expectTypeOf(combined).toBeFunction()
      expectTypeOf(combined).returns.toMatchTypeOf<{ counter: number; todos: string[] }>()
    })

    it('correctly infers state type from individual reducers', () => {
      const reducer = combineReducers({
        flag: (state: boolean = false, _action: Action) => state,
        count: (state: number = 0, _action: Action) => state
      })

      const state = reducer(undefined, { type: 'test' })

      expectTypeOf(state).toMatchTypeOf<{ flag: boolean; count: number }>()
    })

    it('combined reducer return type is Reducer when all values are valid', () => {
      const reducer = combineReducers({
        a: (state: number = 0, _action: Action) => state
      })

      type ReturnType = typeof reducer
      expectTypeOf<ReturnType>().toMatchTypeOf<Reducer<{ a: number }>>()
    })
  })

  describe('reducers with non-function properties', () => {
    it('returns type `never` when a reducer value is null (without type assertion)', () => {
      const invalidReducers = {
        counter: (state: number = 0, _action: Action) => state,
        broken: null
      }

      type Result = ReturnType<typeof combineReducers<typeof invalidReducers>>
      expectTypeOf<Result>().toBeNever()
    })

    it('returns type `never` when a reducer value is a string (without type assertion)', () => {
      const invalidReducers = {
        counter: (state: number = 0, _action: Action) => state,
        broken: 'not a reducer'
      }

      type Result = ReturnType<typeof combineReducers<typeof invalidReducers>>
      expectTypeOf<Result>().toBeNever()
    })

    it('returns type `never` when a reducer value is a number (without type assertion)', () => {
      const invalidReducers = {
        counter: (state: number = 0, _action: Action) => state,
        broken: 42
      }

      type Result = ReturnType<typeof combineReducers<typeof invalidReducers>>
      expectTypeOf<Result>().toBeNever()
    })

    it('returns type `never` when a reducer value is a plain object (without type assertion)', () => {
      const invalidReducers = {
        counter: (state: number = 0, _action: Action) => state,
        broken: { nested: 'object' }
      }

      type Result = ReturnType<typeof combineReducers<typeof invalidReducers>>
      expectTypeOf<Result>().toBeNever()
    })

    it('returns type `never` when a reducer value is a boolean (without type assertion)', () => {
      const invalidReducers = {
        counter: (state: number = 0, _action: Action) => state,
        broken: true
      }

      type Result = ReturnType<typeof combineReducers<typeof invalidReducers>>
      expectTypeOf<Result>().toBeNever()
    })

    it('ignores non-function values at runtime and only includes valid reducers', () => {
      const reducer = combineReducers({
        counter: (state: number = 0, _action: Action) => state,
        broken: null as unknown as Reducer,
        alsoBroken: 'string' as unknown as Reducer
      })

      const state = reducer(undefined, { type: '@@INIT' })
      expect(state).toEqual({ counter: 0 })
      expect(Object.keys(state)).toEqual(['counter'])
    })

    it('non-function values are silently filtered out, not causing shape assertion errors', () => {
      const reducer = combineReducers({
        valid: (state: number = 0, _action: Action) => state,
        invalid: true as unknown as Reducer
      })

      expect(() => {
        reducer(undefined, { type: '@@INIT' })
      }).not.toThrow()

      const state = reducer(undefined, { type: '@@INIT' })
      expect(state).toEqual({ valid: 0 })
    })

    it('type `never` return prevents usage of the combined reducer at compile time', () => {
      const invalidReducers = {
        counter: (state: number = 0, _action: Action) => state,
        broken: null
      }

      type CombinedType = ReturnType<typeof combineReducers<typeof invalidReducers>>

      // The return type is `never`, which means the result cannot be assigned
      // to any variable or used as a Reducer - this is the key distinction
      // from the pre-fix behavior where the return type was `any`
      expectTypeOf<CombinedType>().toBeNever()
    })
  })

  describe('empty object', () => {
    it('returns a reducer that returns {} as initial state', () => {
      const reducer = combineReducers({})

      // @ts-expect-error -- action parameter type is `never` for empty reducers
      const state = reducer(undefined, { type: '@@INIT' })
      expect(state).toEqual({})
    })

    it('returns a reducer that does not change state for any action', () => {
      const reducer = combineReducers({})

      // @ts-expect-error -- action parameter type is `never` for empty reducers
      const initialState = reducer(undefined, { type: '@@INIT' })
      // @ts-expect-error -- action parameter type is `never` for empty reducers
      const nextState = reducer(initialState, { type: 'ANY_ACTION' })

      expect(nextState).toBe(initialState)
      expect(nextState).toEqual({})
    })

    it('returns a reducer with correct state type inference for empty object', () => {
      const reducer = combineReducers({})

      expectTypeOf(reducer).toBeFunction()

      // The state type should be {} for empty reducers
      type StateType = Parameters<typeof reducer>[0]
      expectTypeOf<StateType>().toMatchTypeOf<{} | undefined>()
    })

    it('returns the same reference when state is already {}', () => {
      const reducer = combineReducers({})
      const emptyState = {}

      // @ts-expect-error -- action parameter type is `never` for empty reducers
      const result = reducer(emptyState, { type: 'DISPATCH' })
      expect(result).toBe(emptyState)
    })

    it('empty object combined reducer state type is {}', () => {
      const reducer = combineReducers({})

      type ReducerReturn = ReturnType<typeof reducer>
      expectTypeOf<ReducerReturn>().toMatchTypeOf<{}>()
    })
  })
})
