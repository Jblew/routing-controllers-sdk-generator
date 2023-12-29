import { Action, BodyParam, Get, JsonController, Param, Post, QueryParam, RoutingControllersOptions } from "routing-controllers";

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
