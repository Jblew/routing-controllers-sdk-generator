import { Action, Body, BodyParam, Get, JsonController, Param, Post, QueryParam, RoutingControllersOptions } from "routing-controllers";

@JsonController('', {})
export class SignatureTypesController {
  @Get('/returnFooInterface')
  async returnFooInterface(): Promise<FooInterface> {
    return { foo: 1 }
  }

  @Post('/bodyFooInterface')
  async bodyFooInterface(@Body() body: FooInterface): Promise<void> {
  }

  @Post('/bodyAndParam/:id/')
  async bodyAndParam(@Body() body: FooInterface, @Param('id') id: string): Promise<void> {
  }

  @Get('/queryFooInterface')
  async queryFooInterface(@QueryParam('foo') foo: FooInterface): Promise<void> {
  }

  @Post('/bodyParamFooInterface')
  async bodyParamFooInterface(@BodyParam('foo') foo: FooInterface): Promise<void> {
  }

  @Get('/queryFooInterfaceDifferentArgName')
  async queryFooInterfaceDifferentArgName(@QueryParam('baz') abc: FooInterface): Promise<void> {
  }

  @Post('/mixedArguments/:abc/')
  async mixedArguments(
    @BodyParam('foo') foo: number,
    @QueryParam('bar2') bar: FooInterface,
    @QueryParam('baz') baz: FooInterface,
    @Param('abc') abc: string,
  ): Promise<void> {
  }
}

interface FooInterface {
  foo: number
}
