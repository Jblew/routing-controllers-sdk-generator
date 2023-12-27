# routing-controllers-sdk-generator
SDK generator for routing-controllers

## Features
- Generates SDK from routing-controllers
- Exports all the necessary typescript types — KILLER FEATURE
- Incdludes comments in the generated code
- Request-library agnostic. Works with axios, fetch, superagent, etc.
- Extensible: you can add your own code to each request: for logging, validation, auth, etc.

## Benefits

1. Faster api tests
2. Faster frontend development
3. Much faster refactors that span api+frontend — you will know exactly what you need to change in frontend in seconds
4. Type-completion when working in frontend
5. Detect api-frontend incompatibilities in seconds
6. Generate SDK for your clients

## How to use?

1. Install `npm install --save-dev routing-controllers-sdk-generator`
2. Create `generate-sdk.ts` file with the following content:
   ```typescript
    import { generateSDK } from 'routing-controllers-sdk-generator';
    import * as fs from 'fs';
    import * as path from 'path';

    (async () => {
      const sdk = await generateSDK({
        controllers: { PostsController, UsersController, CommentsController },
      });

      fs.writeFileSync(path.join(__dirname, 'sdk.gen.ts'), sdk);
    })();
   ```
3. Run `ts-node generate-sdk.ts`
4. Configure your SDKs:
   ```typescript
  import axios from 'axios';
  import { makeSDK } from './sdk.gen';

   const authenticatedSDK = makeSDK({ client: axios.createInstance({ headers: { ... } }) })
   const { Admin, Config, BI } = makeSDK({ client: axios.createInstance({ ... }) })
   const adminSDK = { Admin, Config, BI }
   ```
