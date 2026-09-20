# Service Development Guide

Follow this guide to implement business logic in a new microservice.

## 1. Scaffolding
Run the scaffold script to generate the template:
```bash
node scripts/scaffold-services.js
```
This guarantees your service has `src/app.ts`, `src/server.ts`, and the required directory structure.

## 2. Bootstrapping
Extend `BaseApplication`:
```typescript
import { BaseApplication } from '@nm/api-base';

export class Application extends BaseApplication {
  constructor() {
    super('my-service', '1.0.0');
  }

  protected initializeRoutes(): void {
    // Add your initialized BaseRouter instances here
    this.addRouter('/my-resource', new MyRouter());
  }
}
```

## 3. Creating Routes & Controllers
Extend `BaseRouter` and `BaseController`:
```typescript
export class MyController extends BaseController {
  public getData = (req: Request, res: Response) => {
    return this.sendSuccess(res, { some: 'data' });
  }
}
```

## 4. Throwing Errors
**Never** use `res.status(400).send()`. Always throw an error via the factory:
```typescript
import { ErrorFactory } from '@nm/errors';

throw ErrorFactory.notFound('User not found');
```
The global error handler will catch this and format it perfectly.
