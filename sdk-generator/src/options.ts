import { ClassConstructor } from "routing-controllers";
import { SourceFile, Symbol } from "typescript";

export interface Options {
  tsconfigPath: string,
  isController: (className: string, symbol: Symbol, sourceFile: SourceFile) => boolean,
  skipFile: (sourceFile: SourceFile) => boolean,
  allowedNodeModules: string[],
  controllers: ClassConstructor<any>[],
  nameFormatter?: (className: string) => string
}

