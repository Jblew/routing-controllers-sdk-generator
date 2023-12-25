import { ActionMetadataArgs } from 'routing-controllers/types/metadata/args/ActionMetadataArgs'
import { ParamMetadataArgs } from 'routing-controllers/types/metadata/args/ParamMetadataArgs'

interface HttpCallOptions {
  url: string,
  method: string,
  query: Record<string, unknown>,
  data: Record<string, unknown>,
}

export type HttpCallFn = (o: HttpCallOptions) => Promise<{ data: any }>

export type SdkScaffold = Record<string, ControllerScaffold>
export type ControllerScaffold = Record<string, ActionScaffold>
export type ActionScaffold = {
  controller: string
  action: ActionMetadataArgs
  params: ParamMetadataArgs[]
}
