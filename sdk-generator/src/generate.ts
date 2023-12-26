import { ClassConstructor, getMetadataArgsStorage } from "routing-controllers";
import { ActionScaffold, ControllerScaffold, SdkScaffold } from "./types";
import { ActionMetadataArgs } from "routing-controllers/types/metadata/args/ActionMetadataArgs";
import { ParamMetadataArgs } from "routing-controllers/types/metadata/args/ParamMetadataArgs";
import { ControllerMetadataArgs } from "routing-controllers/types/metadata/args/ControllerMetadataArgs";
import { ControllerTypeImporter } from "./ControllerTypeImporter";
import { Options } from "./options";

export async function generateSDKCode(o: Options): Promise<string> {
  const typeImporter = ControllerTypeImporter.withOptions(o)
  const scaffold = generateScaffold(o)
  return generateCode(scaffold, typeImporter)
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


function generateCode(sdk: SdkScaffold, typeImporter: ControllerTypeImporter) {
  const code = `/* eslint-disable */
// Eslint is disabled for performance. This generated file may be large and change a lot.
export function makeSdk({ client }: { client: HttpClientFn }) {
  return {
${Object.entries(sdk)
      .map(([name, controller]) => `    ${name}: {\n${generateControllerCode(controller, typeImporter)}    }`)
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

${typeImporter.emitDeclarationsForCollectedSymbols()}

/* eslint-enable */\n`
  return code
}

function generateControllerCode(controller: ControllerScaffold, typeImporter: ControllerTypeImporter) {
  return Object.values(controller)
    .map((action) => generateActionEntry(action, typeImporter))
    .join('')
}

function generateActionEntry(action: ActionScaffold, typeImporter: ControllerTypeImporter) {
  const name = action.action.method;
  const indentation = ' '.repeat(6)
  const comment = typeImporter.getCommentForClassMethod(action.controller.target.name, action.action.method)
  const commentPadded = comment ? `${comment.split('\n').map((l) => `${indentation}${l.trim()}`).join('\n')}\n` : ''
  return `${commentPadded}${indentation}${name}: ${generateActionHandler(action, typeImporter)},\n`
}

function generateActionHandler({ action, params, controller }: ActionScaffold, typeImporter: ControllerTypeImporter) {
  const args = [
    ...makeBodyArgs(params),
    ...makeConfigArg(params),
  ].join(', ')
  return [
    `async (${args}): ${makeReturnType(controller, action, typeImporter)} => (await client({`,
    `method: '${action.type}',`,
    `url: ${makeUrlGenerator(controller, action, params)},`,
    `data: {${makeBodyParamsObj(params).join(', ')}},`,
    `params: {${makeQueryParamsObj(params).join(', ')}},`,
    `})).data`,
  ].join(' ')
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
  const args = params.filter((p) => ['query', 'body-param', 'param'].includes(p.type))
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
  if (param.type === 'param') return ': string'
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

function makeReturnType(controller: ControllerMetadataArgs, action: ActionMetadataArgs, typeImporter: ControllerTypeImporter) {
  const type = typeImporter.getReturnTypeForClassMethod(controller.target.name, action.method)
  if (type.startsWith('Promise<')) return type
  return `Promise<${type}>`
}
