import "reflect-metadata"
import { it } from "node:test";
import { generateSDKCode } from "routing-controllers-sdk-generator"
import fs from "fs"
import path from "path"
import { SourceFile, Symbol } from "typescript";
import { BodyParam, Get, JsonController, Param, Post, QueryParam } from "routing-controllers";
import assert from "assert";

@JsonController('', {})
export class CommentedController {
  /**
   * This function does something important. It returns an array of strings.
   * @returns An array of strings
   */
  @Get('/importantRoute')
  async getSomethingImportant(): Promise<string[]> {
    return []
  }
}


it("Includes comments in the generated code", async () => {
  const code = await generateSDKCode({
    tsconfigPath: `${__dirname}/../../tsconfig.json`,
    isController: (typeName: string, symbol: Symbol, sourceFile: SourceFile) => typeName.endsWith("Controller"),
    voidTypes: [],
    allowedNodeModules: [],
    skipFile: (sourceFile: SourceFile) => sourceFile.fileName.endsWith(".gen.ts"),
    controllers: [CommentedController],
    nameFormatter: (name) => name,
  })
  fs.writeFileSync(path.join(__dirname, "sdk.gen.ts"), code)
  assert.ok(code.includes(" * This function does something important. It returns an array of strings."))
  assert.ok(code.includes(" * @returns An array of strings"))
  const lines = code.split("\n")
  const importantRouteLineIndex = lines.findIndex((line) => line.includes("getSomethingImportant"))
  assert.ok(lines[importantRouteLineIndex - 1].includes(" */"))
  assert.ok(lines[importantRouteLineIndex - 2].includes("@returns An array of strings"))
})
