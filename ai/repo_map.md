# Repository Map
## .netlify
  - state.json

## CHANGELOG.md
  - CHANGELOG.md

## CONTRIBUTING.md
  - CONTRIBUTING.md

## FLOW.md
  - FLOW.md

## README.es.md
  - README.es.md

## README.md
  - README.md

## ai
  - ai_context.md
  - ai_rules.md
  - architecture.md
  - cache.json
  - context.json
  - conventions.md
  - dependencies.json
  - embeddings.json
  - entrypoints.md
  - files.json
  - hierarchy.json
  - index-state.json
  - module-graph.json
  - modules.json
  - repo_map.json
  - repo_map.md
  - repo.json
  - summary.md
  - symbol-graph.json
  - symbol-references.json
  - symbols.json
  - tech_stack.md
  - utils.json

## docs
  - architecture.md
  - commands.md
  - config.ts
  - custom.css
  - express-api.md
  - getting-started.md
  - getting-started.md
  - index.md
  - index.md
  - index.md
  - index.ts
  - installation.md
  - python-django.md
  - quick-start.md
  - react-app.md

## examples
  - 01-express-api.md
  - 02-react-app.md
  - 03-python-django.md
  - README.md

## package-lock.json
  - package-lock.json

## package.json
  - package.json

## src
  - ai-first.ts
  - aiContextGenerator.ts
  - aiRules.ts
  - androidResources.ts
  - architecture.ts
  - ccp.ts
  - chunker.ts
  - contextGenerator.ts
  - contextPacket.ts
  - conventions.ts
  - dependencies.ts
  - doctor.ts
  - embeddings.ts
  - entrypoints.ts
  - explore.ts
  - fileUtils.ts
  - gradleModules.ts
  - hierarchyGenerator.ts
  - index.ts
  - indexer.ts
  - indexState.ts
  - moduleGraph.ts
  - repoMapper.ts
  - repoScanner.ts
  - semanticContexts.ts
  - sql.js.d.ts
  - symbolGraph.ts
  - symbols.ts
  - techStack.ts

## tsconfig.json
  - tsconfig.json



# Repository Structure (Tree View)
├── .netlify/
│   └── state.json
├── ai/
│   ├── ccp/
│   │   └── jira-123/
│   │       └── context.json
│   ├── context/
│   │   ├── repo.json
│   │   └── utils.json
│   ├── graph/
│   │   ├── module-graph.json
│   │   ├── symbol-graph.json
│   │   └── symbol-references.json
│   ├── ai_context.md
│   ├── ai_rules.md
│   ├── architecture.md
│   ├── cache.json
│   ├── conventions.md
│   ├── dependencies.json
│   ├── embeddings.json
│   ├── entrypoints.md
│   ├── files.json
│   ├── hierarchy.json
│   ├── index-state.json
│   ├── modules.json
│   ├── repo_map.json
│   ├── repo_map.md
│   ├── summary.md
│   ├── symbols.json
│   └── tech_stack.md
├── docs/
│   ├── .vitepress/
│   │   ├── theme/
│   │   │   ├── custom.css
│   │   │   └── index.ts
│   │   └── config.ts
│   ├── es/
│   │   ├── guide/
│   │   │   └── getting-started.md
│   │   └── index.md
│   ├── examples/
│   │   ├── express-api.md
│   │   ├── index.md
│   │   ├── python-django.md
│   │   └── react-app.md
│   ├── guide/
│   │   ├── architecture.md
│   │   ├── getting-started.md
│   │   ├── installation.md
│   │   └── quick-start.md
│   ├── reference/
│   │   └── commands.md
│   └── index.md
├── examples/
│   ├── 01-express-api.md
│   ├── 02-react-app.md
│   ├── 03-python-django.md
│   └── README.md
├── src/
│   ├── analyzers/
│   │   ├── aiRules.ts
│   │   ├── androidResources.ts
│   │   ├── architecture.ts
│   │   ├── conventions.ts
│   │   ├── dependencies.ts
│   │   ├── entrypoints.ts
│   │   ├── gradleModules.ts
│   │   ├── symbols.ts
│   │   └── techStack.ts
│   ├── commands/
│   │   ├── ai-first.ts
│   │   ├── doctor.ts
│   │   └── explore.ts
│   ├── core/
│   │   ├── aiContextGenerator.ts
│   │   ├── ccp.ts
│   │   ├── chunker.ts
│   │   ├── contextGenerator.ts
│   │   ├── contextPacket.ts
│   │   ├── embeddings.ts
│   │   ├── hierarchyGenerator.ts
│   │   ├── indexState.ts
│   │   ├── indexer.ts
│   │   ├── moduleGraph.ts
│   │   ├── repoMapper.ts
│   │   ├── repoScanner.ts
│   │   ├── semanticContexts.ts
│   │   └── symbolGraph.ts
│   ├── types/
│   │   └── sql.js.d.ts
│   ├── utils/
│   │   └── fileUtils.ts
│   └── index.ts
├── CHANGELOG.md
├── CONTRIBUTING.md
├── FLOW.md
├── README.es.md
├── README.md
├── package-lock.json
├── package.json
└── tsconfig.json
