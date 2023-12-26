import { ActionMetadataArgs } from 'routing-controllers/types/metadata/args/ActionMetadataArgs'
import { ControllerMetadataArgs } from 'routing-controllers/types/metadata/args/ControllerMetadataArgs'
import { ParamMetadataArgs } from 'routing-controllers/types/metadata/args/ParamMetadataArgs'

export type SdkScaffold = Record<string, ControllerScaffold>
export type ControllerScaffold = Record<string, ActionScaffold>
export type ActionScaffold = {
  controller: ControllerMetadataArgs
  action: ActionMetadataArgs
  params: ParamMetadataArgs[]
}
