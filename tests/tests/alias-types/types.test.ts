import { makeSdk } from "./sdk.gen";
import { beforeEach, it } from "node:test";
import { Equal, Expect } from "../utils";
import { AliasTypeWithParam, FooInterface, ParamInAlias } from "./AliasTypesController";

let calls: any[][] = []
const lastCall = () => calls[calls.length - 1]
const emptyClient = async (...args: any[]) => {
  calls.push(args)
  return { data: {} }
}
const sdk = makeSdk({ client: emptyClient });
beforeEach(() => calls = [])

it('Preserves parametrized type aliases', () => {
  async function typeTest() {
    const ret = await sdk.AliasTypes.returnParametrizedAliasType()
    type Test = Expect<Equal<typeof ret, { a: AliasTypeWithParam<FooInterface> }>>;
  }
})

it('Preserves direct type aliases', () => {
  async function typeTest() {
    const ret = await sdk.AliasTypes.returnDirectAlias()
    type Test = Expect<Equal<typeof ret, { a: ParamInAlias }>>;
  }
})
