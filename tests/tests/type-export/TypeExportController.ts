import "reflect-metadata";
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
}

interface InterfaceLocalToController {
  foo: string
  bar?: string
  baz: number
}

type TypeWithOmit = Omit<InterfaceLocalToController, "foo">
