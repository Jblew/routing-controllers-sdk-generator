import "reflect-metadata"
import { it } from "node:test";
import { generateSDKCode } from "routing-controllers-sdk-generator"
import { BlogController } from "./BlogController"
import fs from "fs"
import path from "path"
import ts from "typescript"

it("Generates SDK", async () => {
  const code = await generateSDKCode({
    tsconfigPath: `${__dirname}/../../tsconfig.json`,
    isController: (typeName: string, symbol: ts.Symbol, sourceFile: ts.SourceFile) => typeName.endsWith("Controller"),
    voidTypes: [],
    allowedNodeModules: [],
    skipFile: (sourceFile: ts.SourceFile) => sourceFile.fileName.endsWith(".gen.ts"),
    controllers: [BlogController],
    nameFormatter: (name) => name.replace(/Controller$/, ""),
  })
  fs.writeFileSync(path.join(__dirname, "sdk.gen.ts"), code)
})
