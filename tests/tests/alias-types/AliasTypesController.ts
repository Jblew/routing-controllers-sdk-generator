import { Action, BodyParam, Get, JsonController, Param, Post, QueryParam, RoutingControllersOptions } from "routing-controllers";

@JsonController('', {})
export class AliasTypesController {
  @Get('/returnParametrizedAliasType')
  async returnParametrizedAliasType(): Promise<{ a: AliasTypeWithParam<FooInterface> }> {
    return { a: {} as any }
  }

  @Get('/returnDirectAlias')
  async returnDirectAlias(): Promise<{ a: ParamInAlias }> {
    return { a: {} as any }
  }
}

export type ParamInAlias = ShouldSeeAliasIdentifier<BarInterface>
export type AliasTypeWithParam<T> = ParametrizedClass<T> & T & Required<T>
export type ShouldSeeAliasIdentifier<T> = ParametrizedClass<T> & T & { a: string } & FarInterface


class ParametrizedClass<T> {
  lala?: T
}

export interface FooInterface {
  foo: number
}

interface BarInterface {
  bar: boolean
}

interface FarInterface {
  far: string
}
