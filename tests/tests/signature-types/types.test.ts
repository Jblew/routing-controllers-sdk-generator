import { makeSdk } from "./sdk.gen";
import { beforeEach, it } from "node:test";
import assert from "node:assert"
import { Equal, Expect } from "../utils";
import { AuthorizationChecker } from "routing-controllers/types/AuthorizationChecker";
import { Action } from "routing-controllers";

let calls: any[][] = []
const lastCall = () => calls[calls.length - 1]
const emptyClient = async (...args: any[]) => {
  calls.push(args)
  return { data: {} }
}
const sdk = makeSdk({ client: emptyClient });
beforeEach(() => calls = [])

it('Preserves interface return type', () => {
  async function typeTest() {
    const ret = await sdk.SignatureTypes.returnFooInterface()
    type Test = Expect<Equal<typeof ret, { foo: number }>>;
  }
})

it('Preserves body argument', () => {
  async function typeTest() {
    type Args = Parameters<typeof sdk.SignatureTypes.bodyFooInterface>
    type Test = Expect<Equal<Args[0], { foo: number }>>;
  }

  sdk.SignatureTypes.bodyFooInterface({ foo: 3 })
  const req = lastCall()[0]
  assert.deepStrictEqual(req.data, { foo: 3 })
})

it('Preserves body and params arg types', () => {
  async function typeTest() {
    type Args = Parameters<typeof sdk.SignatureTypes.bodyAndParam>
    type Test = Expect<Equal<Args[0], { foo: number }>>;
    type Test2 = Expect<Equal<Args[1], { id: string }>>;
  }

  sdk.SignatureTypes.bodyAndParam({ foo: 3 }, { id: 'a345' })
  const req = lastCall()[0]
  assert.deepStrictEqual(req.data, { foo: 3 })
  assert.deepStrictEqual(req.url, '/bodyAndParam/a345/')
})

it('Preserves query argument', () => {
  async function typeTest() {
    type Args = Parameters<typeof sdk.SignatureTypes.queryFooInterface>
    type Test = Expect<Equal<Args[0], { foo: { foo: number } }>>;
  }

  sdk.SignatureTypes.queryFooInterface({ foo: { foo: 3 } })
  const req = lastCall()[0]
  assert.deepStrictEqual(req.params, { foo: { foo: 3 } })
})

it('Preserves body param', () => {
  async function typeTest() {
    type Args = Parameters<typeof sdk.SignatureTypes.bodyParamFooInterface>
    type Test = Expect<Equal<Args[0], { foo: { foo: number } }>>;
  }

  sdk.SignatureTypes.bodyParamFooInterface({ foo: { foo: 3 } })
  const req = lastCall()[0]
  assert.deepStrictEqual(req.data, { foo: { foo: 3 } })
})

it('Preserves query argument with different arg name', () => {
  async function typeTest() {
    type Args = Parameters<typeof sdk.SignatureTypes.queryFooInterfaceDifferentArgName>
    type Test = Expect<Equal<Args[0], { baz: { foo: number } }>>;
  }

  sdk.SignatureTypes.queryFooInterfaceDifferentArgName({ baz: { foo: 3 } })
  const req = lastCall()[0]
  assert.deepStrictEqual(req.params, { baz: { foo: 3 } })
})

it('Doesnt mix types and order', () => {
  async function typeTest() {
    type Args = Parameters<typeof sdk.SignatureTypes.mixedArguments>
    type Arg = Args[0]
    type Test = Expect<Equal<Arg['foo'], number>>;
    type Test2 = Expect<Equal<Arg['bar2'], { foo: number }>>;
    type Test3 = Expect<Equal<Arg['baz'], { foo: number }>>;
    type Test4 = Expect<Equal<Arg["abc"], string>>;
  }

  sdk.SignatureTypes.mixedArguments({ foo: 1, bar2: { foo: 2 }, baz: { foo: 3 }, abc: 'xyz4' })
  const req = lastCall()[0]
  assert.deepStrictEqual(req.data, { foo: 1 })
  assert.deepStrictEqual(req.params, { bar2: { foo: 2 }, baz: { foo: 3 } })
  assert.deepStrictEqual(req.url, '/mixedArguments/xyz4/')
})
