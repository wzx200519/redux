import { describe, it, expect } from 'vitest'
import { expectTypeOf } from 'expect-type'
import type { Reducer, UnknownAction } from 'redux'
import { combineReducers, createStore } from 'redux'

/**
 * Tests for the `combineReducers` type-level fix.
 *
 * Before the fix, the return type of `combineReducers` degraded to an
 * unconstrained reducer whenever the `reducers` map contained values that
 * were not actually reducer functions — allowing callers to silently misuse
 * the API without any type error.
 *
 * After the fix, the conditional type in `src/combineReducers.ts`:
 *     M[keyof M] extends Reducer<any, any, any> | undefined
 *       ? Reducer<StateFromReducersMapObject<M>, ...>
 *       : never
 * returns `never` when any property is not a reducer, which makes the
 * resulting call site produce an explicit TypeScript error rather than a
 * misleading `any`.
 */
describe('combineReducers type error fix', () => {
  // ------------------------------------------------------------------
  // Case 1: valid reducers object -> returns typed Reducer
  // ------------------------------------------------------------------
  describe('with a valid reducers map', () => {
    const counter: Reducer<number, UnknownAction> = (
      state = 0,
      action
    ) => (action.type === 'INCREMENT' ? state + 1 : state)

    const stack: Reducer<string[], UnknownAction> = (state = [], action) =>
      action.type === 'PUSH'
        ? [...state, String((action as any).value)]
        : state

    it('returns a callable reducer function', () => {
      const reducer = combineReducers({ counter, stack })
      expect(typeof reducer).toBe('function')
    })

    it('produces the correct combined initial state', () => {
      const reducer = combineReducers({ counter, stack })
      const initialState = reducer(undefined, { type: '@@INIT' })
      expect(initialState).toEqual({ counter: 0, stack: [] })
    })

    it('updates each slice when the corresponding action is dispatched', () => {
      const reducer = combineReducers({ counter, stack })
      const s1 = reducer(undefined, { type: 'INCREMENT' })
      expect(s1).toEqual({ counter: 1, stack: [] })
      const s2 = reducer(s1, { type: 'PUSH', value: 'first' })
      expect(s2).toEqual({ counter: 1, stack: ['first'] })
    })

    it('infers the correct state shape', () => {
      const reducer = combineReducers({ counter, stack })

      expectTypeOf(reducer).toBeFunction()

      // State is correctly inferred as { counter: number; stack: string[] }
      expectTypeOf(
        reducer(undefined, { type: 'INCREMENT' })
      ).toEqualTypeOf<{ counter: number; stack: string[] }>()

      // Action parameter accepts arbitrary UnknownActions
      expectTypeOf(reducer).toBeCallableWith(
        { counter: 0, stack: [] },
        { type: 'INCREMENT' }
      )
      expectTypeOf(reducer).toBeCallableWith(
        { counter: 0, stack: [] },
        { type: 'PUSH', value: 'hi' }
      )

      // The resulting reducer is assignable to Reducer<S, UnknownAction>.
      const typedReducer: Reducer<
        { counter: number; stack: string[] },
        UnknownAction,
        Partial<{ counter: number; stack: string[] }>
      > = reducer
      expect(typeof typedReducer).toBe('function')

      // Its return value has the expected shape
      expectTypeOf(reducer(undefined, { type: 'anything' })).toEqualTypeOf<{
        counter: number
        stack: string[]
      }>()
    })

    it('works with createStore and produces a typed store', () => {
      const reducer = combineReducers({ counter, stack })
      const store = createStore(reducer)
      expectTypeOf(store.getState()).toEqualTypeOf<{
        counter: number
        stack: string[]
      }>()
      expect(store.getState()).toEqual({ counter: 0, stack: [] })
    })
  })

  // ------------------------------------------------------------------
  // Case 2: invalid values in the reducers map (null, string, object).
  //         The conditional type collapses to `never` at compile time,
  //         producing a clear, localized type error at the call site.
  //         At runtime, non-function values are simply filtered out.
  // ------------------------------------------------------------------
  describe('with invalid (non-function) entries in the reducers map', () => {
    it('results in a `never` return type when any entry has a primitive/narrow non-function type', () => {
      // With `as const`, the non-function entries keep their narrow,
      // non-function types. `M[keyof M]` then contains
      // `null | "not-a-reducer" | { readonly some: "thing" } | 42`,
      // which does *not* extend `Reducer<any, any, any> | undefined`,
      // so the conditional type yields `never`.
      const invalidReducers = {
        valid: (state = 0, _action: UnknownAction) => state,
        nullValue: null,
        stringValue: 'not-a-reducer',
        objectValue: { some: 'thing' },
        numberValue: 42
      } as const

      const result = combineReducers(invalidReducers)

      // After the fix, result is typed as `never`, not as a permissive
      // reducer. `never` is not assignable to `Reducer`, which is the
      // compile-time signal that something is wrong.
      expectTypeOf(result).toEqualTypeOf<never>()
    })

    it('compile-time: a single non-function reducer entry also produces `never`', () => {
      const reducersWithString = {
        counter: (state = 0, _action: UnknownAction) => state,
        something: 'definitely-not-a-reducer'
      } as const

      const result = combineReducers(reducersWithString)
      expectTypeOf(result).toEqualTypeOf<never>()
    })

    it('compile-time: a valid reducer map is *not* typed as `never` (control group)', () => {
      const validReducers = {
        counter: (state = 0, _action: UnknownAction) => state
      }
      const result = combineReducers(validReducers)
      // The valid case must NOT degrade to `never` — this protects against
      // a regressed conditional type that always returns `never`.
      expectTypeOf(result).not.toEqualTypeOf<never>()
      expectTypeOf(result).toBeFunction()
    })

    it('runtime: non-function properties (cast as any) are skipped and a reducer is returned', () => {
      const reducer = combineReducers({
        counter: (state = 0, _action: UnknownAction) => state,
        fake: true as unknown as Reducer,
        broken: 'string' as unknown as Reducer,
        another: { nested: 'object' } as unknown as Reducer
      })

      expect(typeof reducer).toBe('function')
      const state = reducer(undefined, { type: 'SOMETHING' })
      expect(state).toEqual({ counter: 0 })
    })

    it('runtime: `null` / `undefined` entries do not crash the combination', () => {
      const reducer = combineReducers({
        counter: (state = 0, _action: UnknownAction) => state + 1,
        nothing: null as unknown as Reducer,
        missing: undefined as unknown as Reducer
      })

      expect(() => reducer(undefined, { type: 'ANY' })).not.toThrow()
      const state = reducer(undefined, { type: 'ANY' })
      expect(state).toEqual({ counter: 1 })
    })
  })

  // ------------------------------------------------------------------
  // Case 3: empty object {} -> returns a reducer yielding `{}` as state,
  //         which is invariant under any action.
  //         Note: `combineReducers({})` returns `Reducer<{}, never>`, as
  //         the type system cannot derive any action type from an empty
  //         map. We cast it to `Reducer<{}, UnknownAction>` for runtime
  //         testing, and assert the *state* type is still `{}`.
  // ------------------------------------------------------------------
  describe('with an empty reducers map {}', () => {
    function makeEmptyCombined() {
      const reducer = combineReducers({})
      return reducer as Reducer<{}, UnknownAction>
    }

    it('returns a callable reducer function', () => {
      const reducer = combineReducers({})
      expect(typeof reducer).toBe('function')
    })

    it('initial state is an empty plain object', () => {
      const reducer = makeEmptyCombined()
      const initial = reducer(undefined, { type: '@@INIT' })
      expect(initial).toEqual({})
      expect(Object.prototype.toString.call(initial)).toBe('[object Object]')
    })

    it('does not change state for arbitrary actions', () => {
      const reducer = makeEmptyCombined()
      const initial = reducer(undefined, { type: '@@INIT' })
      const afterFoo = reducer(initial, { type: 'FOO' })
      const afterBar = reducer(afterFoo, { type: 'BAR', extra: true })
      expect(afterFoo).toEqual({})
      expect(afterBar).toEqual({})
      expect(Object.keys(afterBar)).toHaveLength(0)
    })

    it('maintains referential equality across dispatches', () => {
      const reducer = makeEmptyCombined()
      const initial = reducer(undefined, { type: '@@INIT' })
      const next = reducer(initial, { type: 'SOMETHING' })
      expect(next).toBe(initial)
    })

    it('infers state type as `{}`', () => {
      const reducer = makeEmptyCombined()
      expectTypeOf(
        reducer(undefined, { type: 'ANY' })
      ).toEqualTypeOf<{}>()
    })

    it('works with createStore', () => {
      const reducer = makeEmptyCombined()
      const store = createStore(reducer)
      expect(store.getState()).toEqual({})
      store.dispatch({ type: 'ARBITRARY' })
      expect(store.getState()).toEqual({})
    })
  })
})
