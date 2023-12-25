import { generateSDKCode } from "routing-controllers-sdk-generator"
import { BlogController } from "./BlogController"
import fs from "fs"
import path from "path"

run().catch(console.error)

async function run() {
  const code = await generateSDKCode({
    controllers: [BlogController]
  })
  fs.writeFileSync(path.join(__dirname, "sdk.gen.ts"), code)
}
