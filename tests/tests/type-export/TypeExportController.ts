import { Action, Get, JsonController } from "routing-controllers";

@JsonController('', {})
export class TypeExportController {
  @Get('/returnVoid')
  async returnVoid(): Promise<void> { }

  @Get('/returnVoidNoPromise')
  returnVoidNoPromise(): void { }

  @Get('/returnString')
  async returnString(): Promise<string> {
    return ""
  }

  @Get('/returnStringArray')
  async returnStringArray(): Promise<string[]> {
    return [""]
  }

  @Get('/returnStringArrayNoPromise')
  returnStringArrayNoPromise(): string[] {
    return [""]
  }

  @Get('/returnInterfaceLocalToController')
  async returnInterfaceLocalToController(): Promise<InterfaceLocalToController> {
    return { foo: "", baz: 1 }
  }

  @Get('/returnTypeWithOmit')
  async returnTypeWithOmit(): Promise<TypeWithOmit> {
    return { bar: "", baz: 1 }
  }

  @Get('/returnInlineInterface')
  async returnInlineInterface(): Promise<{ la: "la" }> {
    return { la: "la" }
  }

  @Get('/returnNodeModulesType')
  async returnNodeModulesType(): Promise<{ a: Action }> {
    return { a: {} as any }
  }

  @Get('/returnStringEnum')
  async returnStringEnum(): Promise<{ a: StringEnum }> {
    return { a: StringEnum.Cats }
  }

  @Get('/returnStringEnumUnion')
  async returnStringEnumUnion(): Promise<{ a: StringEnum | StringEnum2 }> {
    return { a: StringEnum2.Horses }
  }

  @Get('/returnStringEnumWithInlineUnion')
  async returnStringEnumWithInlineUnion(): Promise<{ a: StringEnum | 'parrots' }> {
    return { a: 'parrots' }
  }

  @Get('/returnStringUnionAlias')
  async returnStringUnionAlias(): Promise<{ a: StringUnionAlias }> {
    return { a: 'parrots' }
  }

  @Get('/returnInterfaceWithStringUnion')
  async returnInterfaceWithStringUnion(): Promise<{ a: InterfaceWithStringUnion }> {
    return { a: { part: 'engine' } }
  }

  @Get('/returnInferredType')
  async returnInferredType(): Promise<{ a: Promise<ReturnType<typeof toInferReturnType>> }> {
    return { a: {} as any }
  }
}

interface InterfaceLocalToController {
  foo: string
  bar?: string
  baz: number
}

type TypeWithOmit = Omit<InterfaceLocalToController, "foo">

export enum StringEnum {
  Cats = 'cats',
  Dogs = 'dogs'
}

export enum StringEnum2 {
  Horses = 'horses',
  Cows = 'cows'
}

export interface FooInterface {
  foo: number
}

export interface BarInterface {
  bar: boolean
}

type StringUnionAlias = 'cows' | 'cats' | 'parrots'

type CarPart = 'engine' | 'wheel' | 'door'
interface InterfaceWithStringUnion {
  part: CarPart
}

async function toInferReturnType() {
  return {
    a: null as any as InferredInterface
  }
}

interface InferredInterface {
  partOfInferredInterface: TypeOfPartOfInferredInterface
}

type TypeOfPartOfInferredInterface = 'a' | 'b' | 'c'
