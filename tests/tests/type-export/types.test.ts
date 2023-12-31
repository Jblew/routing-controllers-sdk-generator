import { StringEnum, StringEnum2, makeSdk } from "./sdk.gen";
import { beforeEach, it } from "node:test";
import { Equal, Expect } from "../utils";
import { Action } from "routing-controllers";

let calls: any[][] = []
const lastCall = () => calls[calls.length - 1]
const emptyClient = async (...args: any[]) => {
  calls.push(args)
  return { data: {} }
}
const sdk = makeSdk({ client: emptyClient });
beforeEach(() => calls = [])

it("Preserves primitive return type", () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnString()
    type Test = Expect<Equal<typeof ret, string>>;
  }
})

it("Preserves array return type", () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnStringArray()
    type Test = Expect<Equal<typeof ret, string[]>>;
  }
})

it("Preserves array return type no promise", () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnStringArrayNoPromise()
    type Test = Expect<Equal<typeof ret, string[]>>;
  }
})

it("Preserves void return type", () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnVoid()
    type Test = Expect<Equal<typeof ret, void>>;
  }
})

it("Preserves void return type if no promise", () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnVoidNoPromise()
    type Test = Expect<Equal<typeof ret, void>>;
  }
})

it('Preserves interface local to controller', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnInterfaceLocalToController()
    type Test = Expect<Equal<typeof ret, { foo: string, bar?: string, baz: number }>>;
  }
})

it('Preserves type with omit local to controller', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnTypeWithOmit()
    type Test = Expect<Equal<typeof ret, { bar?: string, baz: number }>>;
  }
})

it('Preserves inline interface', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnInlineInterface()
    type Test = Expect<Equal<typeof ret, { la: "la" }>>;
  }
})

it('Exports listed node_modules types', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnNodeModulesType()
    type Test = Expect<Equal<typeof ret, { a: Action }>>;
  }
})

it('Preserves enums', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnStringEnum()
    type Test = Expect<Equal<typeof ret, { a: StringEnum }>>;
  }
})

it('Preserves enums inline union', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnStringEnumWithInlineUnion()
    type Test = Expect<Equal<typeof ret, { a: StringEnum | 'parrots' }>>;
  }
})

it('Preserves enums union', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnStringEnumUnion()
    type Test = Expect<Equal<typeof ret, { a: StringEnum | StringEnum2 }>>;
  }
})


it('Preserves string union alias', () => {
  async function typeTest() {
    const ret = await sdk.TypeExport.returnStringUnionAlias()
    type Test = Expect<Equal<typeof ret, { a: 'cats' | 'parrots' | 'cows' }>>;
  }
})
