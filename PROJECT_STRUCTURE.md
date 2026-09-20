# Project Structure

```text
MINI_PROJECT/
├── apps/
│   ├── backend/
│   │   ├── gateway/
│   │   │   ├── src/
│   │   │   │   ├── config/
│   │   │   │   │   └── registry.ts
│   │   │   │   ├── controllers/
│   │   │   │   │   └── GatewayController.ts
│   │   │   │   ├── dto/
│   │   │   │   ├── events/
│   │   │   │   ├── interfaces/
│   │   │   │   ├── manifest/
│   │   │   │   │   └── GatewayManifest.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   └── auth.ts
│   │   │   │   ├── models/
│   │   │   │   ├── repositories/
│   │   │   │   ├── routes/
│   │   │   │   │   └── GatewayRoutes.ts
│   │   │   │   ├── services/
│   │   │   │   ├── swagger/
│   │   │   │   │   └── OpenAPISpec.ts
│   │   │   │   ├── types/
│   │   │   │   ├── utils/
│   │   │   │   ├── validators/
│   │   │   │   ├── app.ts
│   │   │   │   └── server.ts
│   │   │   ├── package.json
│   │   │   ├── README.md
│   │   │   ├── tsconfig.json
│   │   │   └── tsconfig.tsbuildinfo
│   │   └── services/
│   │       ├── admin-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── ai-interview-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── analytics-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── auth-service/
│   │       │   ├── .agents/
│   │       │   │   └── skills/
│   │       │   │       ├── prisma-cli/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── db-execute.md
│   │       │   │       │   │   ├── db-pull.md
│   │       │   │       │   │   ├── db-push.md
│   │       │   │       │   │   ├── db-seed.md
│   │       │   │       │   │   ├── debug.md
│   │       │   │       │   │   ├── dev.md
│   │       │   │       │   │   ├── format.md
│   │       │   │       │   │   ├── generate.md
│   │       │   │       │   │   ├── init.md
│   │       │   │       │   │   ├── mcp.md
│   │       │   │       │   │   ├── migrate-deploy.md
│   │       │   │       │   │   ├── migrate-dev.md
│   │       │   │       │   │   ├── migrate-diff.md
│   │       │   │       │   │   ├── migrate-reset.md
│   │       │   │       │   │   ├── migrate-resolve.md
│   │       │   │       │   │   ├── migrate-status.md
│   │       │   │       │   │   ├── studio.md
│   │       │   │       │   │   └── validate.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-client-api/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── client-methods.md
│   │       │   │       │   │   ├── constructor.md
│   │       │   │       │   │   ├── filters.md
│   │       │   │       │   │   ├── model-queries.md
│   │       │   │       │   │   ├── query-options.md
│   │       │   │       │   │   ├── raw-queries.md
│   │       │   │       │   │   ├── relations.md
│   │       │   │       │   │   └── transactions.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-compute/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── app-deploy-cli.md
│   │       │   │       │   │   ├── compute-config.md
│   │       │   │       │   │   ├── create-prisma.md
│   │       │   │       │   │   ├── frameworks.md
│   │       │   │       │   │   ├── sdk-api.md
│   │       │   │       │   │   └── troubleshooting.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-database-setup/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── cockroachdb.md
│   │       │   │       │   │   ├── mongodb.md
│   │       │   │       │   │   ├── mysql.md
│   │       │   │       │   │   ├── postgresql.md
│   │       │   │       │   │   ├── prisma-client-setup.md
│   │       │   │       │   │   ├── prisma-postgres.md
│   │       │   │       │   │   ├── sqlite.md
│   │       │   │       │   │   └── sqlserver.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-driver-adapter-implementation/
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-mongodb-upgrade/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── client-api-mapping.md
│   │       │   │       │   │   ├── decision-stay-or-migrate.md
│   │       │   │       │   │   ├── migrations-mapping.md
│   │       │   │       │   │   ├── schema-contract-mapping.md
│   │       │   │       │   │   └── verify-cutover-checklist.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-postgres/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── console-and-connections.md
│   │       │   │       │   │   ├── create-db-cli.md
│   │       │   │       │   │   ├── management-api-sdk.md
│   │       │   │       │   │   └── management-api.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-postgres-setup/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── api-basics.md
│   │       │   │       │   │   ├── auth.md
│   │       │   │       │   │   ├── endpoints.md
│   │       │   │       │   │   └── prisma7-client.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       └── prisma-upgrade-v7/
│   │       │   │           ├── references/
│   │       │   │           │   ├── accelerate-users.md
│   │       │   │           │   ├── driver-adapters.md
│   │       │   │           │   ├── env-variables.md
│   │       │   │           │   ├── esm-support.md
│   │       │   │           │   ├── prisma-config.md
│   │       │   │           │   ├── removed-features.md
│   │       │   │           │   └── schema-changes.md
│   │       │   │           └── SKILL.md
│   │       │   ├── .claude/
│   │       │   │   └── skills/
│   │       │   │       ├── prisma-cli
│   │       │   │       ├── prisma-client-api
│   │       │   │       ├── prisma-compute
│   │       │   │       ├── prisma-database-setup
│   │       │   │       ├── prisma-driver-adapter-implementation
│   │       │   │       ├── prisma-mongodb-upgrade
│   │       │   │       ├── prisma-postgres
│   │       │   │       ├── prisma-postgres-setup
│   │       │   │       └── prisma-upgrade-v7
│   │       │   ├── .windsurf/
│   │       │   │   └── skills/
│   │       │   │       ├── prisma-cli
│   │       │   │       ├── prisma-client-api
│   │       │   │       ├── prisma-compute
│   │       │   │       ├── prisma-database-setup
│   │       │   │       ├── prisma-driver-adapter-implementation
│   │       │   │       ├── prisma-mongodb-upgrade
│   │       │   │       ├── prisma-postgres
│   │       │   │       ├── prisma-postgres-setup
│   │       │   │       └── prisma-upgrade-v7
│   │       │   ├── prisma/
│   │       │   │   └── schema.prisma
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   │   ├── AuthenticationController.ts
│   │       │   │   │   └── RegistrationController.ts
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── generated/
│   │       │   │   │   └── client/
│   │       │   │   │       ├── runtime/
│   │       │   │   │       │   ├── client.d.ts
│   │       │   │   │       │   ├── client.js
│   │       │   │   │       │   ├── edge-esm.js
│   │       │   │   │       │   ├── edge.js
│   │       │   │   │       │   ├── index-browser.d.ts
│   │       │   │   │       │   ├── index-browser.js
│   │       │   │   │       │   ├── library.d.ts
│   │       │   │   │       │   ├── library.js
│   │       │   │   │       │   ├── react-native.js
│   │       │   │   │       │   ├── wasm-compiler-edge.js
│   │       │   │   │       │   └── wasm.js
│   │       │   │   │       ├── client.d.ts
│   │       │   │   │       ├── client.js
│   │       │   │   │       ├── default.d.ts
│   │       │   │   │       ├── default.js
│   │       │   │   │       ├── edge.d.ts
│   │       │   │   │       ├── edge.js
│   │       │   │   │       ├── index-browser.js
│   │       │   │   │       ├── index.d.ts
│   │       │   │   │       ├── index.js
│   │       │   │   │       ├── package.json
│   │       │   │   │       ├── query_compiler_fast_bg.js
│   │       │   │   │       ├── query_compiler_fast_bg.wasm
│   │       │   │   │       ├── query_compiler_fast_bg.wasm-base64.js
│   │       │   │   │       ├── query_engine-windows.dll.node
│   │       │   │   │       ├── schema.prisma
│   │       │   │   │       ├── wasm-edge-light-loader.mjs
│   │       │   │   │       ├── wasm-worker-loader.mjs
│   │       │   │   │       ├── wasm.d.ts
│   │       │   │   │       └── wasm.js
│   │       │   │   ├── interfaces/
│   │       │   │   │   └── IEmailProvider.ts
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   │   ├── IdentityRepository.ts
│   │       │   │   │   ├── RoleRepository.ts
│   │       │   │   │   ├── SessionRepository.ts
│   │       │   │   │   └── TokenRepository.ts
│   │       │   │   ├── routes/
│   │       │   │   │   └── AuthRouter.ts
│   │       │   │   ├── services/
│   │       │   │   │   ├── __tests__/
│   │       │   │   │   │   └── TokenService.test.ts
│   │       │   │   │   ├── AuthenticationService.ts
│   │       │   │   │   ├── EmailVerificationService.ts
│   │       │   │   │   ├── RegistrationService.ts
│   │       │   │   │   ├── SessionService.ts
│   │       │   │   │   └── TokenService.ts
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   │   └── AuthValidators.ts
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── .env
│   │       │   ├── .gitignore
│   │       │   ├── package.json
│   │       │   ├── prisma.config.ts
│   │       │   ├── README.md
│   │       │   ├── seed.ts
│   │       │   ├── skills-lock.json
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── faculty-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── interview-service/
│   │       │   ├── prisma/
│   │       │   │   ├── schema.prisma
│   │       │   │   └── seed.ts
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── generated/
│   │       │   │   │   └── client/
│   │       │   │   │       ├── runtime/
│   │       │   │   │       │   ├── edge-esm.js
│   │       │   │   │       │   ├── edge.js
│   │       │   │   │       │   ├── index-browser.d.ts
│   │       │   │   │       │   ├── index-browser.js
│   │       │   │   │       │   ├── library.d.ts
│   │       │   │   │       │   ├── library.js
│   │       │   │   │       │   ├── react-native.js
│   │       │   │   │       │   ├── wasm-compiler-edge.js
│   │       │   │   │       │   ├── wasm-engine-edge.js
│   │       │   │   │       │   └── wasm.js
│   │       │   │   │       ├── client.d.ts
│   │       │   │   │       ├── client.js
│   │       │   │   │       ├── default.d.ts
│   │       │   │   │       ├── default.js
│   │       │   │   │       ├── edge.d.ts
│   │       │   │   │       ├── edge.js
│   │       │   │   │       ├── index-browser.js
│   │       │   │   │       ├── index.d.ts
│   │       │   │   │       ├── index.js
│   │       │   │   │       ├── package.json
│   │       │   │   │       ├── query_engine_bg.js
│   │       │   │   │       ├── query_engine_bg.wasm
│   │       │   │   │       ├── query_engine-windows.dll.node
│   │       │   │   │       ├── query_engine-windows.dll.node.tmp28604
│   │       │   │   │       ├── query_engine-windows.dll.node.tmp32868
│   │       │   │   │       ├── schema.prisma
│   │       │   │   │       ├── wasm-edge-light-loader.mjs
│   │       │   │   │       ├── wasm-worker-loader.mjs
│   │       │   │   │       ├── wasm.d.ts
│   │       │   │   │       └── wasm.js
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   │   └── interviewSessionRoutes.ts
│   │       │   │   ├── services/
│   │       │   │   │   ├── AdminService.ts
│   │       │   │   │   ├── AptitudeService.ts
│   │       │   │   │   ├── CodingDiagnosticEngine.ts
│   │       │   │   │   ├── CodingEvidenceService.ts
│   │       │   │   │   ├── FacultyInterviewService.ts
│   │       │   │   │   ├── HeartbeatService.ts
│   │       │   │   │   ├── HRInterviewService.ts
│   │       │   │   │   ├── InterviewAIService.ts
│   │       │   │   │   ├── InterviewSessionService.ts
│   │       │   │   │   ├── ReportAnalysisService.ts
│   │       │   │   │   ├── ReportChatService.ts
│   │       │   │   │   ├── ReportEvidenceService.ts
│   │       │   │   │   ├── ReportService.ts
│   │       │   │   │   ├── SessionService.ts
│   │       │   │   │   ├── StateMachineService.ts
│   │       │   │   │   ├── TemplateService.ts
│   │       │   │   │   └── TimerEngineService.ts
│   │       │   │   ├── types/
│   │       │   │   │   └── interviewTypes.ts
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   ├── ExecutionTracker.ts
│   │       │   │   ├── ReportEngine.ts
│   │       │   │   └── server.ts
│   │       │   ├── .env
│   │       │   ├── find_session.js
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── test_exec_tmp.js
│   │       │   ├── test_scenarios_tmp.js
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── judge-service/
│   │       │   ├── prisma/
│   │       │   │   └── schema.prisma
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   │   └── ExecutionController.ts
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── generated/
│   │       │   │   │   └── client/
│   │       │   │   │       ├── runtime/
│   │       │   │   │       │   ├── edge-esm.js
│   │       │   │   │       │   ├── edge.js
│   │       │   │   │       │   ├── index-browser.d.ts
│   │       │   │   │       │   ├── index-browser.js
│   │       │   │   │       │   ├── library.d.ts
│   │       │   │   │       │   ├── library.js
│   │       │   │   │       │   ├── react-native.js
│   │       │   │   │       │   └── wasm.js
│   │       │   │   │       ├── default.d.ts
│   │       │   │   │       ├── default.js
│   │       │   │   │       ├── edge.d.ts
│   │       │   │   │       ├── edge.js
│   │       │   │   │       ├── index-browser.js
│   │       │   │   │       ├── index.d.ts
│   │       │   │   │       ├── index.js
│   │       │   │   │       ├── package.json
│   │       │   │   │       ├── query_engine-windows.dll.node
│   │       │   │   │       ├── schema.prisma
│   │       │   │   │       ├── wasm.d.ts
│   │       │   │   │       └── wasm.js
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   │   ├── execution/
│   │       │   │   │   │   ├── adapters/
│   │       │   │   │   │   │   ├── CAdapter.ts
│   │       │   │   │   │   │   ├── CppAdapter.ts
│   │       │   │   │   │   │   ├── JavaAdapter.ts
│   │       │   │   │   │   │   ├── JavaScriptAdapter.ts
│   │       │   │   │   │   │   └── PythonAdapter.ts
│   │       │   │   │   │   ├── AdapterRegistry.ts
│   │       │   │   │   │   ├── ExecutionContract.ts
│   │       │   │   │   │   ├── ExecutionEngine.ts
│   │       │   │   │   │   ├── ExecutionQueue.ts
│   │       │   │   │   │   ├── ExecutionTypes.ts
│   │       │   │   │   │   ├── ExecutionValidator.ts
│   │       │   │   │   │   ├── LanguageAdapter.ts
│   │       │   │   │   │   ├── LanguageInputAdapter.ts
│   │       │   │   │   │   └── TestCaseRunner.ts
│   │       │   │   │   └── Judge0Client.ts
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   ├── server.ts
│   │       │   │   ├── test-full-program-suite.ts
│   │       │   │   └── test-judge.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── test-engine-unit.js
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── notification-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── question-bank-service/
│   │       │   ├── prisma/
│   │       │   │   └── schema.prisma
│   │       │   ├── scripts/
│   │       │   │   ├── import-datasets.ts
│   │       │   │   ├── import-only-curated.ts
│   │       │   │   ├── migrate-to-full-program.ts
│   │       │   │   └── run-curated.ts
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── generated/
│   │       │   │   │   └── client/
│   │       │   │   │       ├── runtime/
│   │       │   │   │       │   ├── edge-esm.js
│   │       │   │   │       │   ├── edge.js
│   │       │   │   │       │   ├── index-browser.d.ts
│   │       │   │   │       │   ├── index-browser.js
│   │       │   │   │       │   ├── library.d.ts
│   │       │   │   │       │   ├── library.js
│   │       │   │   │       │   ├── react-native.js
│   │       │   │   │       │   ├── wasm-compiler-edge.js
│   │       │   │   │       │   └── wasm-engine-edge.js
│   │       │   │   │       ├── client.d.ts
│   │       │   │   │       ├── client.js
│   │       │   │   │       ├── default.d.ts
│   │       │   │   │       ├── default.js
│   │       │   │   │       ├── edge.d.ts
│   │       │   │   │       ├── edge.js
│   │       │   │   │       ├── index-browser.js
│   │       │   │   │       ├── index.d.ts
│   │       │   │   │       ├── index.js
│   │       │   │   │       ├── package.json
│   │       │   │   │       ├── query_engine_bg.js
│   │       │   │   │       ├── query_engine_bg.wasm
│   │       │   │   │       ├── query_engine-windows.dll.node
│   │       │   │   │       ├── schema.prisma
│   │       │   │   │       ├── wasm-edge-light-loader.mjs
│   │       │   │   │       ├── wasm-worker-loader.mjs
│   │       │   │   │       ├── wasm.d.ts
│   │       │   │   │       └── wasm.js
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   │   ├── mappers/
│   │       │   │   │   │   ├── AptitudeDatasetMapper.ts
│   │       │   │   │   │   ├── CuratedAptitudeMapper.ts
│   │       │   │   │   │   ├── CuratedCodingMapper.ts
│   │       │   │   │   │   ├── CuratedHRMapper.ts
│   │       │   │   │   │   ├── DatasetMapper.ts
│   │       │   │   │   │   ├── HRDatasetMapper.ts
│   │       │   │   │   │   ├── MapperRegistry.ts
│   │       │   │   │   │   ├── NormalizedQuestion.ts
│   │       │   │   │   │   ├── PythonDatasetMapper.ts
│   │       │   │   │   │   ├── SQLDatasetMapper.ts
│   │       │   │   │   │   ├── TechnicalDatasetMapper.ts
│   │       │   │   │   │   └── utils.ts
│   │       │   │   │   ├── ImportService.ts
│   │       │   │   │   ├── QuestionManagementService.ts
│   │       │   │   │   └── SearchService.ts
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── .env
│   │       │   ├── audit-db.ts
│   │       │   ├── audit.ts
│   │       │   ├── find-trap.ts
│   │       │   ├── inspect-coding.ts
│   │       │   ├── kill-db.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   ├── tsconfig.tsbuildinfo
│   │       │   ├── update_curated.js
│   │       │   └── wipe.ts
│   │       ├── recommendation-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── replay-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── report-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── scoring-service/
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── interfaces/
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── repositories/
│   │       │   │   ├── routes/
│   │       │   │   ├── services/
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── package.json
│   │       │   ├── README.md
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       ├── user-service/
│   │       │   ├── .agents/
│   │       │   │   └── skills/
│   │       │   │       ├── prisma-cli/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── db-execute.md
│   │       │   │       │   │   ├── db-pull.md
│   │       │   │       │   │   ├── db-push.md
│   │       │   │       │   │   ├── db-seed.md
│   │       │   │       │   │   ├── debug.md
│   │       │   │       │   │   ├── dev.md
│   │       │   │       │   │   ├── format.md
│   │       │   │       │   │   ├── generate.md
│   │       │   │       │   │   ├── init.md
│   │       │   │       │   │   ├── mcp.md
│   │       │   │       │   │   ├── migrate-deploy.md
│   │       │   │       │   │   ├── migrate-dev.md
│   │       │   │       │   │   ├── migrate-diff.md
│   │       │   │       │   │   ├── migrate-reset.md
│   │       │   │       │   │   ├── migrate-resolve.md
│   │       │   │       │   │   ├── migrate-status.md
│   │       │   │       │   │   ├── studio.md
│   │       │   │       │   │   └── validate.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-client-api/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── client-methods.md
│   │       │   │       │   │   ├── constructor.md
│   │       │   │       │   │   ├── filters.md
│   │       │   │       │   │   ├── model-queries.md
│   │       │   │       │   │   ├── query-options.md
│   │       │   │       │   │   ├── raw-queries.md
│   │       │   │       │   │   ├── relations.md
│   │       │   │       │   │   └── transactions.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-compute/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── app-deploy-cli.md
│   │       │   │       │   │   ├── compute-config.md
│   │       │   │       │   │   ├── create-prisma.md
│   │       │   │       │   │   ├── frameworks.md
│   │       │   │       │   │   ├── sdk-api.md
│   │       │   │       │   │   └── troubleshooting.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-database-setup/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── cockroachdb.md
│   │       │   │       │   │   ├── mongodb.md
│   │       │   │       │   │   ├── mysql.md
│   │       │   │       │   │   ├── postgresql.md
│   │       │   │       │   │   ├── prisma-client-setup.md
│   │       │   │       │   │   ├── prisma-postgres.md
│   │       │   │       │   │   ├── sqlite.md
│   │       │   │       │   │   └── sqlserver.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-driver-adapter-implementation/
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-mongodb-upgrade/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── client-api-mapping.md
│   │       │   │       │   │   ├── decision-stay-or-migrate.md
│   │       │   │       │   │   ├── migrations-mapping.md
│   │       │   │       │   │   ├── schema-contract-mapping.md
│   │       │   │       │   │   └── verify-cutover-checklist.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-postgres/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── console-and-connections.md
│   │       │   │       │   │   ├── create-db-cli.md
│   │       │   │       │   │   ├── management-api-sdk.md
│   │       │   │       │   │   └── management-api.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       ├── prisma-postgres-setup/
│   │       │   │       │   ├── references/
│   │       │   │       │   │   ├── api-basics.md
│   │       │   │       │   │   ├── auth.md
│   │       │   │       │   │   ├── endpoints.md
│   │       │   │       │   │   └── prisma7-client.md
│   │       │   │       │   └── SKILL.md
│   │       │   │       └── prisma-upgrade-v7/
│   │       │   │           ├── references/
│   │       │   │           │   ├── accelerate-users.md
│   │       │   │           │   ├── driver-adapters.md
│   │       │   │           │   ├── env-variables.md
│   │       │   │           │   ├── esm-support.md
│   │       │   │           │   ├── prisma-config.md
│   │       │   │           │   ├── removed-features.md
│   │       │   │           │   └── schema-changes.md
│   │       │   │           └── SKILL.md
│   │       │   ├── .claude/
│   │       │   │   └── skills/
│   │       │   │       ├── prisma-cli
│   │       │   │       ├── prisma-client-api
│   │       │   │       ├── prisma-compute
│   │       │   │       ├── prisma-database-setup
│   │       │   │       ├── prisma-driver-adapter-implementation
│   │       │   │       ├── prisma-mongodb-upgrade
│   │       │   │       ├── prisma-postgres
│   │       │   │       ├── prisma-postgres-setup
│   │       │   │       └── prisma-upgrade-v7
│   │       │   ├── .windsurf/
│   │       │   │   └── skills/
│   │       │   │       ├── prisma-cli
│   │       │   │       ├── prisma-client-api
│   │       │   │       ├── prisma-compute
│   │       │   │       ├── prisma-database-setup
│   │       │   │       ├── prisma-driver-adapter-implementation
│   │       │   │       ├── prisma-mongodb-upgrade
│   │       │   │       ├── prisma-postgres
│   │       │   │       ├── prisma-postgres-setup
│   │       │   │       └── prisma-upgrade-v7
│   │       │   ├── prisma/
│   │       │   │   └── schema.prisma
│   │       │   ├── src/
│   │       │   │   ├── config/
│   │       │   │   ├── controllers/
│   │       │   │   │   ├── AdminUserController.ts
│   │       │   │   │   ├── FacultyController.ts
│   │       │   │   │   ├── ProfileController.ts
│   │       │   │   │   └── ResumeController.ts
│   │       │   │   ├── dto/
│   │       │   │   ├── events/
│   │       │   │   ├── generated/
│   │       │   │   │   └── client/
│   │       │   │   │       ├── runtime/
│   │       │   │   │       │   ├── client.d.ts
│   │       │   │   │       │   ├── client.js
│   │       │   │   │       │   ├── edge-esm.js
│   │       │   │   │       │   ├── edge.js
│   │       │   │   │       │   ├── index-browser.d.ts
│   │       │   │   │       │   ├── index-browser.js
│   │       │   │   │       │   ├── library.d.ts
│   │       │   │   │       │   ├── library.js
│   │       │   │   │       │   ├── react-native.js
│   │       │   │   │       │   ├── wasm-compiler-edge.js
│   │       │   │   │       │   └── wasm.js
│   │       │   │   │       ├── client.d.ts
│   │       │   │   │       ├── client.js
│   │       │   │   │       ├── default.d.ts
│   │       │   │   │       ├── default.js
│   │       │   │   │       ├── edge.d.ts
│   │       │   │   │       ├── edge.js
│   │       │   │   │       ├── index-browser.js
│   │       │   │   │       ├── index.d.ts
│   │       │   │   │       ├── index.js
│   │       │   │   │       ├── package.json
│   │       │   │   │       ├── query_compiler_fast_bg.js
│   │       │   │   │       ├── query_compiler_fast_bg.wasm
│   │       │   │   │       ├── query_compiler_fast_bg.wasm-base64.js
│   │       │   │   │       ├── query_engine-windows.dll.node
│   │       │   │   │       ├── schema.prisma
│   │       │   │   │       ├── wasm-edge-light-loader.mjs
│   │       │   │   │       ├── wasm-worker-loader.mjs
│   │       │   │   │       ├── wasm.d.ts
│   │       │   │   │       └── wasm.js
│   │       │   │   ├── interfaces/
│   │       │   │   │   └── IProfileCache.ts
│   │       │   │   ├── middleware/
│   │       │   │   ├── models/
│   │       │   │   ├── providers/
│   │       │   │   │   ├── LocalStorageProvider.ts
│   │       │   │   │   ├── S3StorageProvider.ts
│   │       │   │   │   ├── StorageFactory.ts
│   │       │   │   │   └── StorageProvider.ts
│   │       │   │   ├── repositories/
│   │       │   │   │   ├── EducationRepository.ts
│   │       │   │   │   ├── ProfileRepository.ts
│   │       │   │   │   ├── ResumeRepository.ts
│   │       │   │   │   └── SkillRepository.ts
│   │       │   │   ├── routes/
│   │       │   │   │   ├── AdminUserRouter.ts
│   │       │   │   │   ├── FacultyRouter.ts
│   │       │   │   │   └── ProfileRouter.ts
│   │       │   │   ├── services/
│   │       │   │   │   ├── __tests__/
│   │       │   │   │   │   └── CompletionEngine.test.ts
│   │       │   │   │   ├── AdminUserService.ts
│   │       │   │   │   ├── CompletionEngine.ts
│   │       │   │   │   ├── FacultyService.ts
│   │       │   │   │   └── ProfileService.ts
│   │       │   │   ├── types/
│   │       │   │   ├── utils/
│   │       │   │   ├── validators/
│   │       │   │   │   └── ProfileValidators.ts
│   │       │   │   ├── app.ts
│   │       │   │   └── server.ts
│   │       │   ├── uploads/
│   │       │   ├── .env
│   │       │   ├── .gitignore
│   │       │   ├── inspect_roles.js
│   │       │   ├── package.json
│   │       │   ├── prisma.config.ts
│   │       │   ├── README.md
│   │       │   ├── seed_super_admin.js
│   │       │   ├── skills-lock.json
│   │       │   ├── tsconfig.json
│   │       │   └── tsconfig.tsbuildinfo
│   │       └── tsconfig.json
│   └── frontend/
│       ├── public/
│       │   ├── favicon.svg
│       │   └── icons.svg
│       ├── src/
│       │   ├── api/
│       │   │   ├── axios/
│       │   │   │   └── instance.ts
│       │   │   ├── interceptors/
│       │   │   │   ├── request.ts
│       │   │   │   └── response.ts
│       │   │   ├── admin.ts
│       │   │   ├── auth.ts
│       │   │   ├── faculty.ts
│       │   │   ├── judge.ts
│       │   │   ├── profile.ts
│       │   │   ├── questions.ts
│       │   │   └── templates.ts
│       │   ├── assets/
│       │   │   ├── hero.png
│       │   │   ├── react.svg
│       │   │   └── vite.svg
│       │   ├── components/
│       │   │   ├── charts/
│       │   │   ├── common/
│       │   │   ├── dashboard/
│       │   │   │   └── widgets/
│       │   │   │       ├── EmptyStates/
│       │   │   │       │   └── EmptyProfile.tsx
│       │   │   │       ├── NMProgressWidget.tsx
│       │   │   │       ├── ProfileCompletionWidget.tsx
│       │   │   │       ├── ProfileSummaryWidget.tsx
│       │   │   │       ├── QuickActionsWidget.tsx
│       │   │   │       └── WelcomeWidget.tsx
│       │   │   ├── interview/
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx
│       │   │   │   └── Sidebar.tsx
│       │   │   ├── shared/
│       │   │   │   ├── ComingSoon.tsx
│       │   │   │   ├── EmptyState.tsx
│       │   │   │   ├── ErrorBoundary.tsx
│       │   │   │   ├── ErrorState.tsx
│       │   │   │   ├── PageHeader.tsx
│       │   │   │   ├── PremiumEmptyPage.tsx
│       │   │   │   └── StatCard.tsx
│       │   │   └── ui/
│       │   │       ├── badge.tsx
│       │   │       ├── button.tsx
│       │   │       ├── card.tsx
│       │   │       ├── dialog.tsx
│       │   │       ├── empty-state.tsx
│       │   │       ├── input.tsx
│       │   │       ├── progress.tsx
│       │   │       ├── select.tsx
│       │   │       ├── skeleton.tsx
│       │   │       ├── tabs.tsx
│       │   │       ├── textarea.tsx
│       │   │       ├── theme-toggle.tsx
│       │   │       └── tooltip.tsx
│       │   ├── contexts/
│       │   ├── features/
│       │   │   ├── dashboard/
│       │   │   │   ├── dto/
│       │   │   │   │   └── dashboard.dto.ts
│       │   │   │   ├── hooks/
│       │   │   │   │   └── useDashboard.ts
│       │   │   │   └── services/
│       │   │   │       └── dashboard.service.ts
│       │   │   ├── interview/
│       │   │   │   ├── components/
│       │   │   │   │   ├── hr/
│       │   │   │   │   │   ├── HRAvatar.tsx
│       │   │   │   │   │   ├── HRCompletionScreen.tsx
│       │   │   │   │   │   ├── HREntryCard.tsx
│       │   │   │   │   │   ├── HREvaluationCriteriaModal.tsx
│       │   │   │   │   │   ├── HRInterviewRoom.tsx
│       │   │   │   │   │   ├── HRMediaDeviceModal.tsx
│       │   │   │   │   │   ├── HRPreInterviewModal.tsx
│       │   │   │   │   │   └── HRReportTab.tsx
│       │   │   │   │   ├── AnswerRenderer.tsx
│       │   │   │   │   ├── CodingRound.tsx
│       │   │   │   │   ├── InterviewHeader.tsx
│       │   │   │   │   ├── QuestionPalette.tsx
│       │   │   │   │   ├── QuestionViewer.tsx
│       │   │   │   │   └── ReportWorkspace.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   ├── useAutoSave.ts
│       │   │   │   │   ├── useHeartbeat.ts
│       │   │   │   │   └── useInterviewFocusGuard.ts
│       │   │   │   ├── pages/
│       │   │   │   │   ├── InterviewConfiguration.tsx
│       │   │   │   │   ├── InterviewDashboard.tsx
│       │   │   │   │   ├── InterviewInstructions.tsx
│       │   │   │   │   ├── InterviewLobby.tsx
│       │   │   │   │   ├── InterviewSession.tsx
│       │   │   │   │   └── InterviewSummary.tsx
│       │   │   │   ├── services/
│       │   │   │   │   ├── hrInterview.service.ts
│       │   │   │   │   ├── hrSpeechService.ts
│       │   │   │   │   └── interview.service.ts
│       │   │   │   ├── store/
│       │   │   │   │   └── useInterviewSessionStore.ts
│       │   │   │   └── types/
│       │   │   │       └── interview.types.ts
│       │   │   ├── practice/
│       │   │   │   ├── components/
│       │   │   │   │   ├── CodeEditor.tsx
│       │   │   │   │   └── ExecutionConsole.tsx
│       │   │   │   └── pages/
│       │   │   │       ├── CategoriesList.tsx
│       │   │   │       ├── CodingWorkspace.tsx
│       │   │   │       ├── HRWorkspace.tsx
│       │   │   │       ├── MCQWorkspace.tsx
│       │   │   │       ├── PracticeHome.tsx
│       │   │   │       ├── QuestionList.tsx
│       │   │   │       ├── QuestionWorkspace.tsx
│       │   │   │       ├── SQLWorkspace.tsx
│       │   │   │       ├── TopicsList.tsx
│       │   │   │       └── WorkspaceRouter.tsx
│       │   │   └── progress/
│       │   │       ├── api/
│       │   │       │   └── progressApi.ts
│       │   │       ├── components/
│       │   │       │   ├── EmptyAnalyticsCard.tsx
│       │   │       │   └── ProgressCharts.tsx
│       │   │       └── pages/
│       │   │           └── ProgressDashboard.tsx
│       │   ├── hooks/
│       │   │   └── useProfile.ts
│       │   ├── layouts/
│       │   │   └── PortalLayout.tsx
│       │   ├── pages/
│       │   │   ├── admin/
│       │   │   │   └── AdminUsers.tsx
│       │   │   ├── auth/
│       │   │   │   ├── Login.tsx
│       │   │   │   └── Register.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── AdminDashboard.tsx
│       │   │   │   ├── FacultyDashboard.tsx
│       │   │   │   └── StudentDashboard.tsx
│       │   │   ├── faculty/
│       │   │   │   ├── components/
│       │   │   │   │   ├── FacultySessionDetailModal.tsx
│       │   │   │   │   ├── QuestionDetailModal.tsx
│       │   │   │   │   ├── QuestionModal.tsx
│       │   │   │   │   ├── StudentInterviewHistoryView.tsx
│       │   │   │   │   ├── SubmissionDetailModal.tsx
│       │   │   │   │   ├── TemplateDetailModal.tsx
│       │   │   │   │   └── TemplateModal.tsx
│       │   │   │   ├── FacultyAnalytics.tsx
│       │   │   │   ├── FacultyInterviews.tsx
│       │   │   │   ├── FacultyProfile.tsx
│       │   │   │   ├── FacultyQuestionBank.tsx
│       │   │   │   ├── FacultyReports.tsx
│       │   │   │   ├── FacultyStudentDetail.tsx
│       │   │   │   ├── FacultyStudents.tsx
│       │   │   │   └── FacultyTemplates.tsx
│       │   │   ├── public/
│       │   │   │   ├── components/
│       │   │   │   │   ├── HeroProductPreview.tsx
│       │   │   │   │   ├── LandingCategoryShowcase.tsx
│       │   │   │   │   ├── LandingCTA.tsx
│       │   │   │   │   ├── LandingExperiencePreview.tsx
│       │   │   │   │   ├── LandingFeatureGrid.tsx
│       │   │   │   │   ├── LandingFooter.tsx
│       │   │   │   │   ├── LandingHero.tsx
│       │   │   │   │   ├── LandingHowItWorks.tsx
│       │   │   │   │   ├── LandingNavbar.tsx
│       │   │   │   │   └── LandingPlatformStats.tsx
│       │   │   │   └── LandingPage.tsx
│       │   │   └── student/
│       │   │       ├── StudentPlaceholders.tsx
│       │   │       ├── StudentProfile.tsx
│       │   │       ├── StudentReports.tsx
│       │   │       └── StudentSettings.tsx
│       │   ├── providers/
│       │   │   ├── QueryProvider.tsx
│       │   │   └── ThemeProvider.tsx
│       │   ├── routes/
│       │   │   ├── AppRouter.tsx
│       │   │   ├── AuthGuard.tsx
│       │   │   └── RoleGuard.tsx
│       │   ├── services/
│       │   ├── store/
│       │   │   ├── AuthStore.ts
│       │   │   └── useWorkspaceStore.ts
│       │   ├── styles/
│       │   │   ├── hr-interview.css
│       │   │   ├── index.css
│       │   │   └── tokens.css
│       │   ├── types/
│       │   ├── utils/
│       │   │   ├── categoryMapping.tsx
│       │   │   ├── chartUtils.ts
│       │   │   ├── display.ts
│       │   │   ├── index.ts
│       │   │   └── normalizeQuestion.ts
│       │   ├── App.css
│       │   ├── App.tsx
│       │   ├── index.css
│       │   └── main.tsx
│       ├── .gitignore
│       ├── .oxlintrc.json
│       ├── components.json
│       ├── index.html
│       ├── package.json
│       ├── postcss.config.js
│       ├── README.md
│       ├── tailwind.config.js
│       ├── tsconfig.app.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       └── vite.config.ts
├── data/
│   └── curated/
│       ├── aptitude.json
│       ├── full_program_coding_interview_dataset_40(3).json
│       ├── hr.json
│       ├── manifest.json
│       └── README.md
├── data-engineering/
│   └── dataset/
│       ├── aptitude_dataset.json
│       ├── hr_interview_dataset.json
│       ├── python_interview_dataset.json
│       └── sql_interview_dataset.json
├── docker/
│   ├── development/
│   │   └── .gitkeep
│   ├── nginx/
│   └── production/
├── docs/
│   ├── API/
│   ├── Architecture/
│   ├── auth/
│   │   └── Authentication_Architecture.md
│   ├── backend/
│   │   ├── Interview_Architecture.md
│   │   └── QuestionBank_Architecture.md
│   ├── Database/
│   ├── Deployment/
│   ├── frontend/
│   │   ├── Frontend_Architecture.md
│   │   └── Student_Dashboard_Architecture.md
│   ├── SRS/
│   │   └── Software_Requirements_Specification.md
│   ├── UML/
│   ├── user/
│   │   └── User_Service_Architecture.md
│   ├── Admin_Portal_Guide.md
│   ├── API_Response_Standards.md
│   ├── Architecture.md
│   ├── Backend_Platform_README.md
│   ├── Coding_Standards.md
│   ├── Faculty_Portal_Guide.md
│   ├── Microservice_Guidelines.md
│   ├── Navigation_Guide.md
│   ├── RBAC_Guide.md
│   ├── Routing_Guide.md
│   ├── Service_Development_Guide.md
│   ├── SRS.md
│   └── Student_Portal_Guide.md
├── keys/
│   ├── private.pem
│   └── public.pem
├── packages/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── embeddings/
│   │   │   │   ├── src/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── package.json
│   │   │   │   ├── tsconfig.json
│   │   │   │   └── tsconfig.tsbuildinfo
│   │   │   ├── gemini/
│   │   │   │   ├── src/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── package.json
│   │   │   │   ├── tsconfig.json
│   │   │   │   └── tsconfig.tsbuildinfo
│   │   │   ├── groq/
│   │   │   │   ├── src/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── package.json
│   │   │   │   ├── tsconfig.json
│   │   │   │   └── tsconfig.tsbuildinfo
│   │   │   ├── openai/
│   │   │   │   ├── src/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── package.json
│   │   │   │   ├── tsconfig.json
│   │   │   │   └── tsconfig.tsbuildinfo
│   │   │   ├── stt/
│   │   │   │   ├── src/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── package.json
│   │   │   │   ├── tsconfig.json
│   │   │   │   └── tsconfig.tsbuildinfo
│   │   │   └── tts/
│   │   │       ├── src/
│   │   │       │   └── index.ts
│   │   │       ├── package.json
│   │   │       ├── tsconfig.json
│   │   │       └── tsconfig.tsbuildinfo
│   │   ├── src/
│   │   │   ├── factory.ts
│   │   │   ├── index.ts
│   │   │   └── interfaces.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── api-base/
│   │   ├── src/
│   │   │   ├── BaseApplication.ts
│   │   │   ├── BaseController.ts
│   │   │   ├── BaseEvent.ts
│   │   │   ├── BaseException.ts
│   │   │   ├── BaseHealthController.ts
│   │   │   ├── BaseRepository.ts
│   │   │   ├── BaseResponse.ts
│   │   │   ├── BaseRouter.ts
│   │   │   ├── BaseService.ts
│   │   │   ├── BaseValidator.ts
│   │   │   ├── index.ts
│   │   │   └── interfaces.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── config/
│   │   ├── src/
│   │   │   ├── env-loader.ts
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── constants/
│   │   ├── src/
│   │   │   ├── config.ts
│   │   │   ├── http-status.ts
│   │   │   ├── index.ts
│   │   │   └── messages.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── errors/
│   │   ├── src/
│   │   │   ├── base-error.ts
│   │   │   ├── error-factory.ts
│   │   │   ├── http-errors.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── feature-flags/
│   │   ├── src/
│   │   │   ├── feature-toggle.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── hooks/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── logger/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── logger-factory.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── middleware/
│   │   ├── src/
│   │   │   ├── error-handler.ts
│   │   │   ├── index.ts
│   │   │   ├── request-logger.ts
│   │   │   └── security.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── monitoring/
│   │   ├── src/
│   │   │   ├── health.ts
│   │   │   ├── index.ts
│   │   │   └── metrics.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── prompts/
│   │   ├── evaluator/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── tsconfig.tsbuildinfo
│   │   ├── explainability/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── tsconfig.tsbuildinfo
│   │   ├── interviewer/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── tsconfig.tsbuildinfo
│   │   ├── recommendation/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── tsconfig.tsbuildinfo
│   │   ├── system/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── tsconfig.tsbuildinfo
│   │   └── tsconfig.json
│   ├── shared/
│   │   ├── src/
│   │   │   ├── date.ts
│   │   │   ├── index.ts
│   │   │   ├── pagination.ts
│   │   │   ├── response.ts
│   │   │   ├── string.ts
│   │   │   └── uuid.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── types/
│   │   ├── src/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── enums.ts
│   │   │   ├── events.ts
│   │   │   ├── index.ts
│   │   │   ├── pagination.ts
│   │   │   └── user.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── utils/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   └── validation/
│       ├── src/
│       │   ├── index.ts
│       │   ├── schemas.ts
│       │   └── validator.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── tsconfig.tsbuildinfo
├── scripts/
│   ├── audit-db-curated.js
│   ├── clean-tsc.js
│   ├── generate-rsa-keys.js
│   ├── import-curated.ts
│   ├── scaffold-docker.js
│   ├── scaffold-docs.js
│   ├── scaffold-frontend.js
│   ├── scaffold-packages.js
│   ├── scaffold-services.js
│   ├── setup-tsconfigs.js
│   ├── test-e2e.js
│   ├── test-health.js
│   ├── test-interview.js
│   ├── test-pg.js
│   ├── test-search.ts
│   └── validate-curated-datasets.js
├── .env
├── .env.example
├── .eslintignore
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── add-dev-script.js
├── Aptitude_MCQ_Workspace_Report.md
├── aptitude.json
├── audit-db.js
├── check-db.js
├── coding.json
├── Curated_Workspace_Integration_Report.md
├── delete-curated.js
├── dev.js
├── docker-compose.yml
├── faculty.md
├── final-fix.js
├── fix-imports.js
├── fix-prisma.js
├── fix.js
├── get_counts.js
├── get-langs.js
├── HR_Workspace_Report.md
├── hr.json
├── Interview_Session_Workspace_Report.md
├── Interview_Three_Round_Flow_Report.md
├── lazy-prisma.js
├── package-lock.json
├── package.json
├── project_report.md
├── README_ADMIN.md
├── README_FACULTY.md
├── README.md
├── refactor_coding.js
├── run-curated-import.js
├── seed-curated.ts
├── stitch_interview_intelligence_workspace.zip
├── test-assessment-template-stages.js
├── test-cpp.cpp
├── test-dynamic-question-editor.js
├── test-e2e-exec.ts
├── test-execution.ts
├── test-faculty-code-execution-details.js
├── test-faculty-dashboard-e2e.js
├── test-faculty-interviews-e2e.js
├── test-faculty-question-bank-e2e.js
├── test-faculty-students-e2e.js
├── test-faculty-templates-e2e.js
├── test-frontend-exec.ts
├── test-interview-complete-lifecycle.js
├── test-java-gen.ts
├── test-json.js
├── test-judge.js
├── test-login.js
├── test-multi-lang.js
├── test-parser.js
├── test-practice-question-data-flow.js
├── test-question-edit-fix.js
├── test-report-evidence-and-chat.js
├── test-save-sync-e2e.js
├── test-stdin-stdout.ts
├── test-student-hierarchical-interviews.js
├── test-template-modes-and-student-execution.js
├── test-universal-languages-coding.js
├── Test.class
├── Test.java
├── TestEscape.java
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── unlock.js
└── verify_pipeline.js
```