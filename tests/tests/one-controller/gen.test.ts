import { it } from "node:test";
import { generateSDKCode } from "routing-controllers-sdk-generator"
import { BlogController } from "./BlogController"
import fs from "fs"
import path from "path"

it("Generates SDK", async () => {
  const code = await generateSDKCode({
    controllers: [BlogController],
    nameFormatter: (name) => name.replace(/Controller$/, ""),
  })
  fs.writeFileSync(path.join(__dirname, "sdk.gen.ts"), code)
})
