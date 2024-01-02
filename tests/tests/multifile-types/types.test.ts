import { makeSdk } from "./sdk.gen";
import { beforeEach, it } from "node:test";
import { Equal, Expect } from "../utils";
import { AAliasOfBFooInterface } from "./other-file-a";

let calls: any[][] = []
const lastCall = () => calls[calls.length - 1]
const emptyClient = async (...args: any[]) => {
  calls.push(args)
  return { data: {} }
}
const sdk = makeSdk({ client: emptyClient });
beforeEach(() => calls = [])

it('Preserves types two files away', () => {
  async function typeTest() {
    const ret = await sdk.MultifileTypes.returnAliasOfTwoFileProxy()
    type Test = Expect<Equal<typeof ret, { a: AAliasOfBFooInterface }>>;
  }
})

