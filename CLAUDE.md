# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WPS Office add-in (文字加载项) built with Vue 3, Vite, Naive UI, and UnoCSS. It provides AI-powered legal document processing features including contract review, risk scanning, desensitization, template management, and a customizable workflow engine.

## Development Commands

### Running the project
- `npm run dev` — Start Vite dev server on port 3889
- `wpsjs debug` — Start WPS add-in debugging (launches WPS with hot reload)
- `wpsjs debug -s` — Start debug server only (without launching WPS)
- `wpsjs stop` — Stop debugging session

### Building
- `npm run build` — Vite production build (output to `wps-addon-build/`)
- `wpsjs build` — Package as WPS add-in
- `wpsjs build --exe` — Package as Windows executable

### Code quality
- `npm run lint` — ESLint check and auto-fix for `.vue,.js,.jsx,.cjs,.mjs`
- `npm run format` — Prettier format `src/`
- `npm run create-templates` — Generate template documents from definitions

### Updating WPS toolchain
- `npm update -g wpsjs`
- `npm update --save-dev wps-jsapi`

## High-Level Architecture

### WPS Add-In Lifecycle
WPS loads the add-in through three layers:
1. `manifest.xml` — Add-in metadata (name, API version)
2. `public/ribbon.xml` — Ribbon tab/button definitions
3. `src/ribbon.js` — Must be mounted to `window.ribbon`, exports `OnAction(control)` / `GetImage(control)` / `OnAddinLoad()`. Button clicks call `Util.wpsService.createTaskPane(routeName)` to open Vue router pages as task panes.

### Vue Application Entry
- `src/main.js` — Creates the Vue app, mounts router, initializes `window.ribbon`, and sets up global `window.$message` / `$dialog` / `$notification` via Naive UI's `createDiscreteApi`
- `src/App.vue` — Mounts `router-view` inside `n-message-provider`, initializes `DocumentWatcher` and `templateManager`
- Router uses `createWebHashHistory` with routes mapped to ribbon buttons

### Workflow Engine (`src/services/workflow/`)
The workflow system is the core automation architecture:
- **ActionRegistry** (`actionRegistry.js`) — Global registry of atomic actions keyed by `type`
- **WorkflowEngine** (`workflowEngine.js`) — Validates and executes step sequences, passes a shared `WorkflowContext` between steps (`context.documentText`, `context.documentInfo`, `context.previousResult`, `context.data`)
- **BaseAction / AIBaseAction** (`actions/baseAction.js`, `actions/aiBaseAction.js`) — All actions extend these. BaseAction provides `execute()`, `validate()`, and `getSchema()`. AIBaseAction adds AI-specific helpers like `buildEnhancedPrompt()` for perspective/depth/focusAreas
- **Actions** (`actions/index.js`) — Registered in two groups: `documentActions` (read/save/export/watermark/etc.) and `aiActions` (identify/extract/review/analyze). New actions must be imported and added to `allActions`, then registered via `registerAllActions()`
- **Presets** (`presets.js`) — Predefined workflows combining actions (e.g., `partyAReview`, `desensitizeDocument`, `archiveDocument`). Reference `ActionTypes` enum from `types.js`

### WPS Service Layer (`src/services/wps/`)
Organized into three domains:
- `core.js` (`wpsCore`, exported as `Util`) — Environment checks, task pane creation, dialog boxes, `PluginStorage` access
- `document.js` (`wpsDocument`) — Content reading, comments, revisions, range manipulation
- `file.js` (`wpsFile`) — Headers/footers, page numbers, watermark, rename, PDF export
- `taskHandler.js` — Bridges ribbon button actions to Vue routes
- `watcher.js` — `DocumentWatcher` listens for active document changes

### AI Service Layer (`src/services/ai/`)
- `siliconflow.js` — Primary AI client. Supports **streaming** (`streamChatCompletions` via `fetch` + SSE) and **non-streaming** (`nonStreamChatCompletions` via axios). If `response_format` is requested, it automatically falls back to non-streaming (JSON mode does not support SSE)
- `TaskScheduler.js` — Unified AI task scheduling entry point
- `promptGenerator.js` — Dynamically builds prompts for contract extraction and review
- All AI calls read configuration via `appConfig.getAIConfig()`, which returns `{ apiKey, baseUrl, model, timeout, maxTokens, temperature }`

### Configuration Management (`src/utils/appConfig.js`)
`AppConfigManager` persists configuration through the WPS FileSystem API (not localStorage). It supports:
- Deep merge with defaults when reading
- Scheme management for keywords, contract review rules, and KDocs (`getSchemes(type)`, `saveSchemes(type, data)`)
- Migration from legacy flat config to scheme-based config
- AI config is the single source of truth for all AI services

### Global Conventions
- **Path alias**: `@/*` → `./src/*`
- **Global APIs**: `window.Application` (WPS app), `window.$message`, `window.$dialog`, `window.$notification`
- **Naive UI**: Components imported individually, not globally registered
- **UnoCSS**: Configured in `uno.config.js` with project-specific shortcuts (`wps-card`, `btn-primary`, `form-input`, etc.)
- **Code style**: No semicolons, single quotes, 2-space indent, no trailing commas (Prettier config)
- **ESLint**: Allows `_` prefix for intentionally unused variables

## Adding a New Page

Requires changes in **4 places**:
1. Create `src/views/NewPage.vue`
2. Add route in `src/router/index.js`
3. Add button in `public/ribbon.xml`
4. Add `case` in `src/ribbon.js` `OnAction` (route mapping) and `GetImage` (icon path)

## Important Constraints

- Production builds drop all `console` and `debugger` statements (`vite.config.js` `esbuild.drop`)
- The add-in only works inside WPS; `window.Application` is undefined in a regular browser
- Dev server proxies `/api/kdocs` to `https://env-00jxg9mus2ok.dev-hz.cloudbasefunction.cn` to bypass CORS for KDocs APIs
- Configuration is stored via WPS FileSystem API; it cannot be tested outside WPS
- AI model defaults are read from `appConfig.getAIConfig()`, not hardcoded (recent refactor removed hardcoded defaults)

## Communication Preferences

- Default to Chinese for all comments, commit messages, and user-facing text
- Write minimal code; avoid premature abstractions
- Do not create new files unless necessary; do not delete existing code lightly
- New docs go to `md/`, tests to `test/`, scripts to `scripts/`
- Always run `npm run lint` and fix issues before finishing
