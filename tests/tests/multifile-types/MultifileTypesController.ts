import { Get, JsonController } from "routing-controllers";
import { AAliasOfBFooInterface, ABazInterface } from "./other-file-a";
import { BFooInterface3, BFooInterface4 } from "./other-file-b";

@JsonController('', {})
export class MultifileTypesController {
  @Get('/returnAliasOfTwoFileProxy')
  async returnAliasOfTwoFileProxy(): Promise<{ a: AAliasOfBFooInterface }> {
    return { a: {} as any }
  }

  @Get('/returnTypesFromTwoFiles')
  async returnTypesFromTwoFiles(): Promise<{ a: ABazInterface<BFooInterface3> }> {
    return { a: {} as any }
  }

  @Get('/returnParametrizedAliasType')
  async returnParametrizedAliasType(): Promise<{ a: LocalAliasOfBFooInterface }> {
    return { a: {} as any }
  }
}

export type LocalAliasOfBFooInterface = ABazInterface<BFooInterface4>
