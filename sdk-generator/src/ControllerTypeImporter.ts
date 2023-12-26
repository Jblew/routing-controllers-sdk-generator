import * as ts from "typescript"
import * as path from "path"
import { Options } from "./options"

export interface ArgumentTypeDescriptor {
  paramName: string
  typeName: string
  decorators: ts.Decorator[]
  isOptional: boolean
}

export class ControllerTypeImporter {
  private controllerClassSymbols: { [name: string]: ts.Symbol } = {}
  private symbolsToEmit: Set<ts.Symbol> = new Set()

  constructor(
    private program: ts.Program,
    private options: Options,
  ) {
    this.extractTypes()
  }

  public getSignatureTypes(className: string, methodName: string) {
    const methodSymbol = this.mustGetMethodSymbol(className, methodName)
    const type = this.program.getTypeChecker().getTypeOfSymbolAtLocation(methodSymbol, methodSymbol.valueDeclaration!)
    const signature = type.getCallSignatures()[0]
    if (!signature) throw new Error(`Method signature for ${className}.${methodName} not found`)
    const comment = this.getMethodComment(methodSymbol)
    const returnType = this.getReturnType(signature)
    const argumentTypes = this.getArgumentTypes(signature)
    return { argumentTypes, returnType, comment }
  }

  private getArgumentTypes(signature: ts.Signature): ArgumentTypeDescriptor[] {
    const parameters = signature.getParameters()
    const args: ArgumentTypeDescriptor[] = []
    for (const parameter of parameters) {
      const paramName = parameter.name
      const type = this.program.getTypeChecker().getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!)
      const isOptional = type.isUnion() && type.types.some((t) => t.flags === ts.TypeFlags.Undefined)
      this.collectSymbolsToEmit(type)
      const typeName = this.program.getTypeChecker().typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)
      const valueDeclaration = parameter.valueDeclaration
      const modifiers = valueDeclaration && ts.isParameter(valueDeclaration) ? valueDeclaration.modifiers : undefined
      const decorators: ts.Decorator[] = modifiers ? modifiers.filter((m) => m.kind === ts.SyntaxKind.Decorator).map((d) => d as ts.Decorator) : []
      args.push({ paramName, typeName, decorators, isOptional })
    }
    return args
  }

  private getReturnType(signature: ts.Signature) {
    const returnType = this.program.getTypeChecker().getReturnTypeOfSignature(signature)
    const isVoidType = this.options.voidTypes.some((voidType) => returnType.symbol?.name === voidType)
    if (isVoidType) return "void"
    this.collectSymbolsToEmit(returnType)
    return this.program.getTypeChecker().typeToString(returnType, undefined, ts.TypeFormatFlags.NoTruncation)
  }

  private getMethodComment(methodSymbol: ts.Symbol): string | undefined {
    const declarations = methodSymbol.getDeclarations()
    if (!declarations || declarations.length === 0) return
    const methodDeclaration = declarations[0]
    const sourceFile = methodDeclaration.getSourceFile()
    const commentRanges = ts.getLeadingCommentRanges(sourceFile.getFullText(), methodDeclaration.getFullStart());
    if (!commentRanges || commentRanges.length === 0) return
    return commentRanges.map(r => sourceFile.getFullText().slice(r.pos, r.end)).join("\n")
  }

  private mustGetMethodSymbol(className: string, methodName: string) {
    const classSymbol = this.controllerClassSymbols[className]
    if (!classSymbol) throw new Error(`Class ${className} not found`)
    const classMembers = classSymbol.members
    if (!classMembers) throw new Error(`Class ${className} has no members`)
    const methodSymbol = classMembers.get(methodName as any)
    if (!methodSymbol) throw new Error(`Method ${className}.${methodName} not found`)
    return methodSymbol
  }

  public emitDeclarationsForCollectedSymbols() {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
    let out = ""

    for (const symbol of this.symbolsToEmit.values()) {
      const declarations = symbol.getDeclarations()
      if (!declarations || declarations.length === 0) {
        throw new Error(`Symbol ${symbol.name} has no declarations`)
      }
      for (const declaration of declarations) {
        const nodeKind = declaration.kind
        if (
          nodeKind === ts.SyntaxKind.ClassDeclaration ||
          nodeKind === ts.SyntaxKind.InterfaceDeclaration ||
          nodeKind === ts.SyntaxKind.EnumDeclaration ||
          nodeKind === ts.SyntaxKind.TypeAliasDeclaration
        ) {
          const sourceFile = declaration.getSourceFile()
          const code = printer.printNode(ts.EmitHint.Unspecified, declaration, sourceFile)
          out += `// Source: ${sourceFile.fileName}\n`
          out += code
          out += "\n\n"
        } else {
          const sourceFile = declaration.getSourceFile()
          const code = printer.printNode(ts.EmitHint.Unspecified, declaration, sourceFile)
        }
      }
    }
    return out
  }

  private collectSymbolsToEmit(type: ts.Type, alreadyVisited: Set<ts.Symbol> = new Set()) {
    const isPrimitive = type.isStringLiteral() || type.isNumberLiteral()
    if (isPrimitive) {
      return
    }
    const symbol =
      type.symbol && type.symbol?.name.startsWith("__") && type.aliasSymbol
        ? type.aliasSymbol
        : type.symbol ?? type.aliasSymbol

    if (symbol) {
      if (alreadyVisited.has(symbol)) {
        return
      }
      alreadyVisited.add(symbol)
    }

    const isAlreadyCollected = symbol && this.symbolsToEmit.has(symbol)
    if (isAlreadyCollected) {
      return
    }
    const sourceFile = symbol?.getDeclarations()?.[0]?.getSourceFile() || symbol?.valueDeclaration?.getSourceFile()
    const canEmitFile = sourceFile && this.canEmitFromFile(sourceFile)
    const syntaxKind = symbol?.valueDeclaration?.kind
    const allowedSyntaxKinds = [
      ts.SyntaxKind.ClassDeclaration,
      ts.SyntaxKind.InterfaceDeclaration,
      ts.SyntaxKind.EnumDeclaration,
      ts.SyntaxKind.TypeAliasDeclaration,
      ts.SyntaxKind.VariableDeclaration,
    ]
    const canEmitSyntaxKind = !syntaxKind || allowedSyntaxKinds.includes(syntaxKind)
    if (canEmitFile && canEmitSyntaxKind) {
      this.symbolsToEmit.add(symbol)
    }

    for (const typeArgument of (type as ts.TypeReference).typeArguments ?? []) {
      this.collectSymbolsToEmit(typeArgument, alreadyVisited)
    }

    for (const aliasArg of type.aliasTypeArguments ?? []) {
      this.collectSymbolsToEmit(aliasArg, alreadyVisited)
    }

    // Support conditional types
    const possiblyConditional = type as ts.ConditionalType
    const indexedType = type as ts.IndexedAccessType
    const conditionals = [
      possiblyConditional.checkType,
      possiblyConditional.extendsType,
      possiblyConditional.resolvedFalseType,
      possiblyConditional.resolvedTrueType,
      indexedType.objectType,
      indexedType.indexType,
    ]
    for (const conditionalType of conditionals) {
      if (conditionalType) {
        this.collectSymbolsToEmit(conditionalType, alreadyVisited)
      }
    }

    if (type.isUnionOrIntersection()) {
      for (const intersectionType of type.types) {
        this.collectSymbolsToEmit(intersectionType, alreadyVisited)
      }
    }

    for (const prop of symbol?.members?.values() ?? []) {
      const propTypeVD = this.program.getTypeChecker().getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!)
      this.collectSymbolsToEmit(propTypeVD, alreadyVisited)
    }
  }

  private extractTypes() {
    const typeChecker = this.program.getTypeChecker()

    const symbols: { [name: string]: ts.Symbol } = {}

    const { isController } = this.options
    this.program
      .getSourceFiles()
      .filter((s) => !this.options.skipFile(s))
      .forEach((sourceFile) => {
        function inspect(node: ts.Node, tc: ts.TypeChecker) {
          if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const symbol: ts.Symbol = (<any>node).symbol
            const fullyQualifiedName = tc.getFullyQualifiedName(symbol)
            const typeName = fullyQualifiedName.replace(/".*"\./, "")

            if (isController(typeName, symbol, sourceFile)) {
              symbols[typeName] = symbol
            }
          } else {
            ts.forEachChild(node, (n) => inspect(n, tc))
          }
        }
        inspect(sourceFile, typeChecker)
      })
    this.controllerClassSymbols = symbols
  }

  private canEmitFromFile(sourceFile: ts.SourceFile) {
    const path = sourceFile.fileName
    if (!path.includes("node_modules")) {
      return true
    }
    const isAllowedModule = this.options.allowedNodeModules.some((allowedModule) => path.includes(`node_modules/${allowedModule}`))
    if (isAllowedModule) {
      return true
    }
    return false
  }

  static withOptions(options: Options) {
    const program = programFromConfig(options.tsconfigPath)
    return new ControllerTypeImporter(program, options)
  }
}

function programFromConfig(tsconfigPath: string): ts.Program {
  const result = ts.parseConfigFileTextToJson(tsconfigPath, ts.sys.readFile(tsconfigPath)!)
  const configObject = result.config

  const configParseResult = ts.parseJsonConfigFileContent(
    configObject,
    ts.sys,
    path.dirname(tsconfigPath),
    {},
    path.basename(tsconfigPath),
  )
  const options = configParseResult.options
  options.noEmit = true
  delete options.out
  delete options.outDir
  delete options.outFile
  delete options.declaration
  delete options.declarationDir
  delete options.declarationMap

  const program = ts.createProgram({
    rootNames: configParseResult.fileNames,
    options,
    projectReferences: configParseResult.projectReferences,
  })
  return program
}
