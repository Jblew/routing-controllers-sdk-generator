import "reflect-metadata"
import { it } from "node:test";
import { generateSDKCode } from "routing-controllers-sdk-generator"
import fs from "fs"
import path from "path"
import { SourceFile, Symbol } from "typescript";
import { SignatureTypesController } from "./SignatureTypesController";

it("Generates SDK", async () => {
  const code = await generateSDKCode({
    tsconfigPath: `${__dirname}/../../tsconfig.json`,
    isController: (typeName: string, symbol: Symbol, sourceFile: SourceFile) => typeName.endsWith("Controller"),
    voidTypes: [],
    allowedNodeModules: ["routing-controllers"],
    skipFile: (sourceFile: SourceFile) => sourceFile.fileName.endsWith(".gen.ts"),
    controllers: [SignatureTypesController],
    nameFormatter: (name) => name.replace(/Controller$/, ""),
  })
  fs.writeFileSync(path.join(__dirname, "sdk.gen.ts"), code)
})
