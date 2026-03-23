# AI-Context Evaluation Report

Generated: 2026-03-22T23:44:19.504Z

## Summary

| Project | Type | Index DB | Avg Score | Key Issue |
|---------|------|----------|-----------|-----------|
| salesforce-cli | priority | ✅ | 2.0 | Fix tech_stack.md to recognize Apex/Sale... |
| ai-first-cli | supported | ❌ | 2.9 | Refactor architecture.md to group src/ i... |
| express-api | supported | ✅ | 2.9 | Fix critical inaccuracies: remove 'Conta... |
| nestjs-backend | supported | ✅ | 2.8 | Correct framework detection to NestJS wi... |
| python-cli | supported | ✅ | 2.3 | Fix critical architecture classification... |
| spring-boot-app | supported | ✅ | 2.6 | Fix Spring Boot framework detection and ... |
| android-kotlin-app | unsupported | ❌ | 2.3 | Detect and index standard Android projec... |
| ios-swift-app | unsupported | ❌ | 2.7 | Validate dependencies against actual rep... |
| go-microservice | unsupported | ❌ | 2.0 | Extract and document actual code content... |
| rust-cli | unsupported | ❌ | 2.1 | Parse and include main.rs content (funct... |
| php-vanilla | unsupported | ❌ | 2.5 | Include actual source code content or de... |

## Detailed Findings

### salesforce-cli

- **Type:** priority
- **Index DB:** Yes
- **Model Scores:**
  - Kimi K2.5: 1.75/5
  - GLM 5: 2.25/5
  - MiniMax 2.7: 2/5
- **Top Improvements:**
  - Fix tech_stack.md to recognize Apex/Salesforce platform and add Salesforce-specific patterns (Trigger framework, SOQL, Governor Limits)
  - Populate entrypoints.md with actual class methods, trigger events, and API endpoints
  - Add business logic context describing what AccountController and OpportunityController do functionally (CRUD operations, integrations, validation logic)
  - Detect and list Apex as the primary language in tech_stack.md
  - Identify Apex classes and triggers as entrypoints in entrypoints.md

### ai-first-cli

- **Type:** supported
- **Index DB:** No
- **Model Scores:**
  - Kimi K2.5: 2.25/5
  - GLM 5: 3.25/5
  - MiniMax 2.7: 3.25/5
- **Top Improvements:**
  - Refactor architecture.md to group src/ into functional modules (Commands, Adapters, Parsers, Indexer) instead of listing every file as a module
  - Add explicit 'What This Project Does' overview explaining the AI context generation pipeline
  - Separate test-projects fixtures from source analysis to prevent 684 fixture files from obscuring 63 actual source files
  - Fix architecture detection to ignore root-level documentation files and focus on actual source directories.
  - Implement dependency parsing to correctly identify and list key libraries and testing frameworks.

### express-api

- **Type:** supported
- **Index DB:** Yes
- **Model Scores:**
  - Kimi K2.5: 2.8/5
  - GLM 5: 3.5/5
  - MiniMax 2.7: 2.5/5
- **Top Improvements:**
  - Fix critical inaccuracies: remove 'Contains 0 files' entries and correct architecture pattern (remove Microservices)
  - Add API contract specifications including endpoints, methods, and data models/schemas
  - Include actual code interfaces or summaries for key files (controllers/services) rather than just directory listings
  - Fix 'Contains 0 files' entries to describe actual file responsibilities (index.js is main entry point, package.json defines dependencies and scripts)
  - Add missing conventions.md and ai_rules.md files that are referenced in ai_context.md

### nestjs-backend

- **Type:** supported
- **Index DB:** Yes
- **Model Scores:**
  - Kimi K2.5: 2.8/5
  - GLM 5: 2.75/5
  - MiniMax 2.7: 2.7/5
- **Top Improvements:**
  - Correct framework detection to NestJS with Modular architecture pattern
  - Document API endpoints and authentication flows from the indexed controller files
  - Add separation between AI metadata (ai/) and source code analysis in architectural descriptions
  - Fix framework detection to properly identify NestJS and include its patterns/decorators in documentation
  - Replace vague 'Contains X files' module descriptions with actual responsibilities and key exports

### python-cli

- **Type:** supported
- **Index DB:** Yes
- **Model Scores:**
  - Kimi K2.5: 2.25/5
  - GLM 5: 2.75/5
  - MiniMax 2.7: 2/5
- **Top Improvements:**
  - Fix critical architecture classification: distinguish files from directories and map MVC pattern to actual codebase components (cli commands as controllers)
  - Populate entrypoints.md with actual function signatures, CLI command names, and registration patterns from main.py
  - Add project-specific AI instructions: exact steps to add commands, extend Task model, and use the repository pattern
  - Populate entrypoints.md with the main execution path and CLI usage examples.
  - Enhance tech_stack.md to detect imported libraries (e.g., argparse, json) instead of reporting 'None detected'.

### spring-boot-app

- **Type:** supported
- **Index DB:** Yes
- **Model Scores:**
  - Kimi K2.5: 2.25/5
  - GLM 5: 3/5
  - MiniMax 2.7: 2.5/5
- **Top Improvements:**
  - Fix Spring Boot framework detection and correct architecture to Layered pattern
  - Populate entrypoints.md with DemoApplication main class and all REST controller endpoints
  - Analyze and document JPA entities (Post, User, Comment) and their relationships in features/
  - Detect Spring Boot framework to ensure correct code generation
  - Populate entrypoints.md with the main application class and controllers

### android-kotlin-app

- **Type:** unsupported
- **Index DB:** No
- **Model Scores:**
  - Kimi K2.5: 2.5/5
  - GLM 5: 3/5
  - MiniMax 2.7: 1.5/5
- **Top Improvements:**
  - Detect and index standard Android project files (manifest, build configs, resources) that appear to be missing
  - Populate entrypoints with actual Android components and their intents/lifecycles
  - Consolidate redundant descriptions and remove empty sections to optimize token usage for actionable technical details
  - Detect Android framework and Gradle build system to populate tech_stack.md.
  - Populate entrypoints.md with the main Activity and Application class.

### ios-swift-app

- **Type:** unsupported
- **Index DB:** No
- **Model Scores:**
  - Kimi K2.5: 2.3/5
  - GLM 5: 3/5
  - MiniMax 2.7: 2.75/5
- **Top Improvements:**
  - Validate dependencies against actual repo contents (remove phantom service/model/util layers)
  - Include actual source code snippets or struct definitions from ContentView.swift
  - Consolidate 6 fragmented files into 2-3 focused documents (overview, architecture, conventions)
  - Remove hallucinated dependencies (service, model, util) from architecture.md as they do not exist in the repo map
  - Detect and list SwiftUI as the framework (inferred from ContentView.swift) instead of 'None detected'

### go-microservice

- **Type:** unsupported
- **Index DB:** No
- **Model Scores:**
  - Kimi K2.5: 1.75/5
  - GLM 5: 2.75/5
  - MiniMax 2.7: 1.5/5
- **Top Improvements:**
  - Extract and document actual code content (functions, types, imports) from main.go instead of just counting it
  - Fix factual errors: correct Go naming conventions (snake_case), remove semicolon requirement, fix 'contains 0 files' logic
  - Populate entrypoints.md with service endpoints, ports, and request handlers, or analyze go.mod to detect actual frameworks used
  - Populate entrypoints.md with specific run/build commands for the Go application.
  - Fix architecture.md to correctly identify main.go as a file, not a container, and remove confusing '0 files' descriptions.

### rust-cli

- **Type:** unsupported
- **Index DB:** No
- **Model Scores:**
  - Kimi K2.5: 1.8/5
  - GLM 5: 3/5
  - MiniMax 2.7: 1.5/5
- **Top Improvements:**
  - Parse and include main.rs content (functions, structs, CLI args) to enable code generation
  - Add Cargo.toml analysis with dependencies and feature flags critical for Rust development
  - Consolidate fragmented files and remove empty placeholders to reduce context window waste
  - Fix incorrect file naming convention (camelCase -> snake_case)
  - Detect and include Cargo.toml and cargo package manager

### php-vanilla

- **Type:** unsupported
- **Index DB:** No
- **Model Scores:**
  - Kimi K2.5: 2.2/5
  - GLM 5: 3.75/5
  - MiniMax 2.7: 1.5/5
- **Top Improvements:**
  - Include actual source code content or detailed API summary of index.php
  - Remove incorrect statements about file contents and empty generic sections
  - Add functional description of application purpose and behavior
  - Populate entrypoints.md to identify index.php as the primary entry point.
  - Refine architecture.md to describe file responsibilities rather than stating 'Contains 0 files'.

## Cross-Project Analysis

### 🎯 Priority Projects (Salesforce)
- Average score: 2.0
- Key findings: See detailed section above
- Salesforce-specific insights: Apex classes, triggers, and SObject metadata handling

### Supported Projects
- Average score: 2.7
- Common issues: None

### Unsupported Projects
- Average score: 2.3
- Common issues: None

### Key Insights
1. **Salesforce Priority**: Detailed analysis of Apex, triggers, and metadata
2. Index DB impact on quality: Projects with Index DB show...
3. Unsupported projects: Generic analysis provides value but lacks framework-specific insights
