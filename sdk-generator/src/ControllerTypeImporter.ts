import * as ts from "typescript"
import * as fs from "fs"
import * as path from "path"
import { Options } from "./options"

export interface ArgumentTypeDescriptor {
  paramName: string
  typeName: string
  decorators: ts.Decorator[]
  isOptional: boolean
}

const allowedSyntaxKinds = [
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.VariableDeclaration,
]

export class ControllerTypeImporter {
  private controllerClassSymbols: { [name: string]: ts.Symbol } = {}
  private symbolsToEmit: Set<ts.Symbol> = new Set()
  private typeChecker: ts.TypeChecker

  constructor(
    private program: ts.Program,
    private options: Options,
  ) {
    this.typeChecker = program.getTypeChecker()
    this.loadControllerSymbols()
  }

  public getSignatureTypes(className: string, methodName: string) {
    const methodSymbol = this.mustGetMethodSymbol(className, methodName)
    const type = this.typeChecker.getTypeOfSymbolAtLocation(methodSymbol, methodSymbol.valueDeclaration!)
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
      const type = this.typeChecker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!)
      const isOptional = type.isUnion() && type.types.some((t) => t.flags === ts.TypeFlags.Undefined)
      this.collectTypeSymbols(type, new Set<ts.Symbol>())
      const typeName = this.typeChecker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)
      const valueDeclaration = parameter.valueDeclaration
      const modifiers = valueDeclaration && ts.isParameter(valueDeclaration) ? valueDeclaration.modifiers : undefined
      const decorators: ts.Decorator[] = modifiers ? modifiers.filter((m) => m.kind === ts.SyntaxKind.Decorator).map((d) => d as ts.Decorator) : []
      args.push({ paramName, typeName, decorators, isOptional })
    }
    return args
  }

  private getReturnType(signature: ts.Signature) {
    const returnType = this.typeChecker.getReturnTypeOfSignature(signature)
    this.collectTypeSymbols(returnType, new Set<ts.Symbol>())
    return this.typeChecker.typeToString(returnType, undefined, ts.TypeFormatFlags.NoTruncation)
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
        if (allowedSyntaxKinds.includes(nodeKind)) {
          const sourceFile = declaration.getSourceFile()
          const code = printer.printNode(ts.EmitHint.Unspecified, declaration, sourceFile)
          out += `// Source: ${sourceFile.fileName}\n`
          out += code
          out += "\n\n"
        }
      }
    }
    return out
  }

  private collectTypeSymbols(type: ts.Type, alreadyVisited: Set<ts.Symbol>) {
    const isPrimitive = type.isStringLiteral() || type.isNumberLiteral()
    if (isPrimitive) {
      return
    }
    this.collectSymbol(type.symbol, alreadyVisited)
    this.collectSymbol(type.aliasSymbol, alreadyVisited)

    for (const typeArgument of (type as ts.TypeReference).typeArguments ?? []) {
      this.collectTypeSymbols(typeArgument, alreadyVisited)
    }

    for (const aliasArg of type.aliasTypeArguments ?? []) {
      this.collectTypeSymbols(aliasArg, alreadyVisited)
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
        this.collectTypeSymbols(conditionalType, alreadyVisited)
      }
    }

    if (type.isUnionOrIntersection()) {
      for (const intersectionType of type.types) {
        const isEnumMember = intersectionType.symbol?.flags === ts.SymbolFlags.EnumMember
        if (isEnumMember) {
          const enumDeclarationNode = intersectionType.symbol?.valueDeclaration?.parent
          if (enumDeclarationNode) {
            const enumDeclarationType = this.typeChecker.getTypeAtLocation(enumDeclarationNode)
            if (enumDeclarationType.symbol) {
              this.collectSymbol(enumDeclarationType.symbol, alreadyVisited)
            }
          }
        }
        else {
          this.collectTypeSymbols(intersectionType, alreadyVisited)
        }
      }
    }
  }

  private collectSymbol(symbol: ts.Symbol | undefined, alreadyVisited: Set<ts.Symbol>) {
    if (!symbol) return
    const isAlreadyCollected = this.symbolsToEmit.has(symbol)
    const isAlreadyVisited = alreadyVisited.has(symbol)
    if (isAlreadyCollected || isAlreadyVisited) return
    alreadyVisited.add(symbol)
    this.collectSymbolDeclarations(symbol, alreadyVisited)
    this.collectSymbolMembers(symbol, alreadyVisited)
  }

  private collectSymbolMembers(symbol: ts.Symbol, alreadyVisited: Set<ts.Symbol>) {
    for (const prop of symbol.members?.values() ?? []) {
      const propTypeVD = this.typeChecker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!)
      this.collectTypeSymbols(propTypeVD, alreadyVisited)
    }
  }

  private collectSymbolDeclarations(symbol: ts.Symbol, alreadyVisited: Set<ts.Symbol>) {
    for (const declaration of symbol.declarations ?? []) {
      if (declaration.kind === ts.SyntaxKind.TypeAliasDeclaration) {
        this.collectAliasDeclaration(declaration as ts.TypeAliasDeclaration, alreadyVisited)
      }
      const sourceFile = declaration.getSourceFile()
      const canEmitFile = sourceFile && this.canEmitFromFile(sourceFile)
      const syntaxKind = declaration.kind
      const canEmitSyntaxKind = !syntaxKind || allowedSyntaxKinds.includes(syntaxKind)
      if (canEmitFile && canEmitSyntaxKind) {
        this.symbolsToEmit.add(symbol)
      }
    }
  }

  private collectAliasDeclaration(declaration: ts.TypeAliasDeclaration, alreadyVisited: Set<ts.Symbol>) {
    const declarationTypeReference = declaration.type as ts.TypeReferenceNode | undefined
    const typeNameSymbol = declarationTypeReference && this.typeChecker.getSymbolAtLocation(declarationTypeReference.typeName)
    if (typeNameSymbol) {
      this.collectSymbol(typeNameSymbol, alreadyVisited)
    }
  }

  private loadControllerSymbols() {
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
        inspect(sourceFile, this.typeChecker)
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
