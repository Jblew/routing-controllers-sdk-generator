import { ActionMetadataArgs } from 'routing-controllers/types/metadata/args/ActionMetadataArgs'
import { ParamMetadataArgs } from 'routing-controllers/types/metadata/args/ParamMetadataArgs'

export type SdkScaffold = Record<string, ControllerScaffold>
export type ControllerScaffold = Record<string, ActionScaffold>
export type ActionScaffold = {
  controller: string
  action: ActionMetadataArgs
  params: ParamMetadataArgs[]
}
