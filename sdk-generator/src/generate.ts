import { ClassConstructor, getMetadataArgsStorage } from "routing-controllers";
import { ActionScaffold, ControllerScaffold, SdkScaffold } from "./types";
import { ActionMetadataArgs } from "routing-controllers/types/metadata/args/ActionMetadataArgs";
import { ParamMetadataArgs } from "routing-controllers/types/metadata/args/ParamMetadataArgs";
import { ControllerMetadataArgs } from "routing-controllers/types/metadata/args/ControllerMetadataArgs";

interface Options {
  controllers: ClassConstructor<any>[],
  nameFormatter?: (className: string) => string
}

export async function generateSDKCode(o: Options): Promise<string> {
  const scaffold = generateScaffold(o)
  return generateCode(scaffold)
}

function generateScaffold(o: Options): SdkScaffold {
  const sdk = o.controllers.reduce((sdk, controller) => {
    const name = o.nameFormatter ? o.nameFormatter(controller.name) : controller.name
    sdk[name] = makeControllerSdk(controller)
    return sdk
  }, {} as SdkScaffold)
  return sdk
}

function makeControllerSdk(controller: ClassConstructor<any>): ControllerScaffold {
  const actions = getMetadataArgsStorage()
    .filterActionsWithTarget(controller)
    .reduce((actions, action) => {
      const method = action.method
      actions[method] = makeActionSdk(controller, action)
      return actions
    }, {} as ControllerScaffold)
  return actions
}

function makeActionSdk(controllerClass: ClassConstructor<any>, action: ActionMetadataArgs): ActionScaffold {
  const params = getMetadataArgsStorage().filterParamsWithTargetAndMethod(controllerClass, action.method)
  const [controller] = getMetadataArgsStorage().filterControllerMetadatasForClasses([controllerClass])
  return { controller, action, params }
}


function generateCode(sdk: SdkScaffold) {
  const code = `/* eslint-disable */
// Eslint is disabled for performance. This generated file may be large and change a lot.
export function makeSdk({ client }: { client: HttpClientFn }) {
  return {
${Object.entries(sdk)
      .map(([name, controller]) => `    ${name}: {\n${generateControllerCode(controller)}    }`)
      .join(',\n')}
  } as const
}

interface HttpCallOptions {
  url: string,
  method: string,
  /* params = query vars */
  params: Record<string, unknown>,
  data: Record<string, unknown>,
}
type HttpClientFn = (o: HttpCallOptions) => Promise<{ data: any }>

/* eslint-enable */\n`
  return code
}

function generateControllerCode(controller: ControllerScaffold) {
  return Object.entries(controller)
    .filter(([name]) => name !== 'controller')
    .map(([name, action]) => `      ${name}: ${generateActionHandler(action)},\n`)
    .join('')
}

function generateActionHandler({ action, params, controller }: ActionScaffold) {
  const args = [...makeRouteParamsArgs(params), ...makeBodyArgs(params), ...makeConfigArg(params)].join(', ')
  return [
    `async (${args}): ${makeReturnType(controller, action)} => (await client({`,
    `method: '${action.type}',`,
    `url: ${makeUrlGenerator(controller, action, params)},`,
    `data: {${makeBodyParamsObj(params).join(', ')}},`,
    `params: {${makeQueryParamsObj(params).join(', ')}},`,
    `})).data`,
  ].join(' ')
}

function makeRouteParamsArgs(params: ParamMetadataArgs[]) {
  return params.filter((p) => p.type === 'param').map((p) => `${p.name}: string`)
}

function makeUrlGenerator(controller: ControllerMetadataArgs, action: ActionMetadataArgs, params: ParamMetadataArgs[]) {
  const fullRoute = `${controller.route ?? ''}${action.route}`
  const routeParams = params.filter((p) => p.type === 'param')
  return `'${fullRoute}'${routeParams.map((p) => `.replace(':${p.name}', ${p.name})`).join('')}`
}

function makeBodyArgs(params: ParamMetadataArgs[]) {
  const args = params.filter((p) => p.type === 'body')
  if (args.length === 0) {
    return []
  } else if (args.length > 1) {
    throw new Error('Only one @Body decorator is supported')
  }
  return ['body: any']
}

function makeConfigArg(params: ParamMetadataArgs[]) {
  const args = params.filter((p) => p.type === 'body-param' || p.type === 'query')
  if (args.length === 0) return []
  const names = args.map((p) => p.name!)
  assertNoDuplicates(names)
  const types = args.map((p) => `${p.name}${paramToType(p)}`)
  return [`{ ${names.join(', ')} }: { ${types.join(', ')} }`]
}

function makeQueryParamsObj(params: ParamMetadataArgs[]): string[] {
  return params.filter((p) => p.type === 'query').map((p) => p.name!)
}

function makeBodyParamsObj(params: ParamMetadataArgs[]): string[] {
  const hasBody = params.filter((p) => p.type === 'body').length > 0
  const bodyParams = params.filter((p) => p.type === 'body-param')
  const usedParams = bodyParams.map((p) => p.name!)
  if (hasBody) {
    usedParams.push('...body')
  }
  return usedParams
}

function assertNoDuplicates(names: string[]) {
  const duplicates = names.filter((name, i) => names.indexOf(name) !== i)
  if (duplicates.length > 0) {
    throw new Error(`Duplicate params: ${duplicates.join(', ')}`)
  }
}

function paramToType(param: ParamMetadataArgs) {
  let typeDirective = ''
  if (!param.required) typeDirective += '?'
  typeDirective += ': '
  typeDirective += paramExplicitType(param.explicitType)
  if (param.isArray) typeDirective += '[]'
  return typeDirective
}

function paramExplicitType(t: any): string {
  switch (t) {
    case String:
      return 'string'
    case Number:
      return 'number'
    case Boolean:
      return 'boolean'
    case Object:
      return 'object'
    case Date:
      return 'Date'
    default:
      return 'any'
  }
}

function makeReturnType(controller: ControllerMetadataArgs, action: ActionMetadataArgs) {
  return 'Promise<any>'
}
