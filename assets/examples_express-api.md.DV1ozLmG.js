import{_ as i,o as a,c as n,ag as t}from"./chunks/framework.BZohXCq9.js";const E=JSON.parse('{"title":"Example: Express.js REST API","description":"","frontmatter":{},"headers":[],"relativePath":"examples/express-api.md","filePath":"examples/express-api.md"}'),l={name:"examples/express-api.md"};function p(e,s,h,k,r,o){return a(),n("div",null,[...s[0]||(s[0]=[t(`<h1 id="example-express-js-rest-api" tabindex="-1">Example: Express.js REST API <a class="header-anchor" href="#example-express-js-rest-api" aria-label="Permalink to &quot;Example: Express.js REST API&quot;">​</a></h1><p>This example demonstrates how ai-first analyzes an Express.js API project.</p><h2 id="input-project-structure" tabindex="-1">Input: Project Structure <a class="header-anchor" href="#input-project-structure" aria-label="Permalink to &quot;Input: Project Structure&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>my-express-api/</span></span>
<span class="line"><span>├── src/</span></span>
<span class="line"><span>│   ├── index.ts          # Main entry point</span></span>
<span class="line"><span>│   ├── app.ts            # Express app setup</span></span>
<span class="line"><span>│   ├── config/</span></span>
<span class="line"><span>│   │   └── database.ts   # Database configuration</span></span>
<span class="line"><span>│   ├── controllers/</span></span>
<span class="line"><span>│   │   ├── userController.ts</span></span>
<span class="line"><span>│   │   └── orderController.ts</span></span>
<span class="line"><span>│   ├── models/</span></span>
<span class="line"><span>│   │   ├── User.ts</span></span>
<span class="line"><span>│   │   └── Order.ts</span></span>
<span class="line"><span>│   ├── middleware/</span></span>
<span class="line"><span>│   │   ├── auth.ts       # JWT authentication</span></span>
<span class="line"><span>│   │   └── validate.ts   # Request validation</span></span>
<span class="line"><span>│   └── routes/</span></span>
<span class="line"><span>│       ├── userRoutes.ts</span></span>
<span class="line"><span>│       └── orderRoutes.ts</span></span>
<span class="line"><span>├── package.json</span></span>
<span class="line"><span>└── tsconfig.json</span></span></code></pre></div><h2 id="run-ai-first" tabindex="-1">Run ai-first <a class="header-anchor" href="#run-ai-first" aria-label="Permalink to &quot;Run ai-first&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npx</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ai-first</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> init</span></span></code></pre></div><h2 id="output-generated-files" tabindex="-1">Output: Generated Files <a class="header-anchor" href="#output-generated-files" aria-label="Permalink to &quot;Output: Generated Files&quot;">​</a></h2><h3 id="ai-ai-context-md" tabindex="-1">ai/ai_context.md <a class="header-anchor" href="#ai-ai-context-md" aria-label="Permalink to &quot;ai/ai_context.md&quot;">​</a></h3><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;"># AI Context</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">&gt; Repository context for AI assistants. Generated automatically.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Quick Overview</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Pattern**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: MVC (Model-View-Controller)</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Languages**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: TypeScript</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Frameworks**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Express.js</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Total Files**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: 15</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Tech Stack</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Languages**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: TypeScript</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Frameworks**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Express.js</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Package Managers**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: npm</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Architecture</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Primary: MVC (Model-View-Controller)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Key Modules</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| Module | Responsibility |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">|--------|----------------|</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/controllers\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Request handling |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/models\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Data models |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/middleware\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Auth &amp; validation |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/routes\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | API routes |</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Key Entrypoints</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Server</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \`src/index.ts\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> - Main entry point</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \`src/app.ts\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> - Express app setup</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Notes for AI Assistants</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">1.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Follow TypeScript strict mode</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">2.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Use async/await for async operations</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">3.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> JWT auth in src/middleware/auth.ts</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">4.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Request validation in src/middleware/validate.ts</span></span></code></pre></div><h3 id="ai-symbols-json-excerpt" tabindex="-1">ai/symbols.json (excerpt) <a class="header-anchor" href="#ai-symbols-json-excerpt" aria-label="Permalink to &quot;ai/symbols.json (excerpt)&quot;">​</a></h3><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;symbols&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: [</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;name&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;createUser&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;type&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;function&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;file&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;src/controllers/userController.ts&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;line&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;exportType&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;export&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;name&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;authenticate&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;type&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;function&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;file&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;src/middleware/auth.ts&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;line&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">5</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;exportType&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;export&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  ]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><h2 id="ai-prompt-example" tabindex="-1">AI Prompt Example <a class="header-anchor" href="#ai-prompt-example" aria-label="Permalink to &quot;AI Prompt Example&quot;">​</a></h2><p><strong>Without ai-first:</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>You: &quot;Add a password reset endpoint&quot;</span></span>
<span class="line"><span>AI: *reads 200 files, guesses wrong, breaks auth flow*</span></span></code></pre></div><p><strong>With ai-first:</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>You: &quot;Read ai/ai_context.md first. Then add a password reset endpoint to the Express API following the existing patterns.&quot;</span></span>
<span class="line"><span>AI: *reads 1 file, understands auth middleware, adds correct endpoint*</span></span>
<span class="line"><span>✅ Working code, follows conventions</span></span></code></pre></div>`,16)])])}const g=i(l,[["render",p]]);export{E as __pageData,g as default};
