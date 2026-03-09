import{_ as a,o as i,c as n,ag as t}from"./chunks/framework.BZohXCq9.js";const c=JSON.parse('{"title":"Example: React Application","description":"","frontmatter":{},"headers":[],"relativePath":"examples/react-app.md","filePath":"examples/react-app.md","lastUpdated":null}'),p={name:"examples/react-app.md"};function l(e,s,h,k,o,r){return i(),n("div",null,[...s[0]||(s[0]=[t(`<h1 id="example-react-application" tabindex="-1">Example: React Application <a class="header-anchor" href="#example-react-application" aria-label="Permalink to &quot;Example: React Application&quot;">​</a></h1><p>This example demonstrates how ai-first analyzes a React single-page application.</p><h2 id="input-project-structure" tabindex="-1">Input: Project Structure <a class="header-anchor" href="#input-project-structure" aria-label="Permalink to &quot;Input: Project Structure&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>my-react-app/</span></span>
<span class="line"><span>├── src/</span></span>
<span class="line"><span>│   ├── App.tsx              # Main app component</span></span>
<span class="line"><span>│   ├── main.tsx             # Entry point</span></span>
<span class="line"><span>│   ├── index.css            # Global styles</span></span>
<span class="line"><span>│   ├── components/</span></span>
<span class="line"><span>│   │   ├── Header.tsx</span></span>
<span class="line"><span>│   │   ├── Footer.tsx</span></span>
<span class="line"><span>│   │   ├── Button.tsx</span></span>
<span class="line"><span>│   │   └── Card.tsx</span></span>
<span class="line"><span>│   ├── pages/</span></span>
<span class="line"><span>│   │   ├── Home.tsx</span></span>
<span class="line"><span>│   │   ├── About.tsx</span></span>
<span class="line"><span>│   │   └── Contact.tsx</span></span>
<span class="line"><span>│   ├── hooks/</span></span>
<span class="line"><span>│   │   ├── useAuth.ts</span></span>
<span class="line"><span>│   │   └── useFetch.ts</span></span>
<span class="line"><span>│   ├── services/</span></span>
<span class="line"><span>│   │   └── api.ts</span></span>
<span class="line"><span>│   └── types/</span></span>
<span class="line"><span>│       └── index.ts</span></span>
<span class="line"><span>├── public/</span></span>
<span class="line"><span>│   └── index.html</span></span>
<span class="line"><span>├── package.json</span></span>
<span class="line"><span>├── tsconfig.json</span></span>
<span class="line"><span>└── vite.config.ts</span></span></code></pre></div><h2 id="run-ai-first" tabindex="-1">Run ai-first <a class="header-anchor" href="#run-ai-first" aria-label="Permalink to &quot;Run ai-first&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npx</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ai-first</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> init</span></span></code></pre></div><h2 id="output-generated-files" tabindex="-1">Output: Generated Files <a class="header-anchor" href="#output-generated-files" aria-label="Permalink to &quot;Output: Generated Files&quot;">​</a></h2><h3 id="ai-ai-context-md" tabindex="-1">ai/ai_context.md <a class="header-anchor" href="#ai-ai-context-md" aria-label="Permalink to &quot;ai/ai_context.md&quot;">​</a></h3><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;"># AI Context</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">&gt; Repository context for AI assistants. Generated automatically.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Quick Overview</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Pattern**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Single Page Application (SPA)</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Languages**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: TypeScript</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Frameworks**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: React + Vite</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Total Files**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: 18</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Tech Stack</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Languages**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: TypeScript, CSS</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Frameworks**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: React 18, Vite</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Package Managers**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: npm</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Architecture</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Primary: Component-Based SPA</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Key Modules</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| Module | Responsibility |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">|--------|----------------|</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/components\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Reusable UI components |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/pages\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Route pages |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/hooks\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Custom React hooks |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`src/services\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | API integration |</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Key Entrypoints</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Application</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \`src/main.tsx\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> - React DOM render</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \`src/App.tsx\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> - Root component</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Notes for AI Assistants</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">1.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Use functional components with hooks</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">2.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Follow React 18 patterns</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">3.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> CSS modules or Tailwind for styling</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">4.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> TypeScript strict mode</span></span></code></pre></div><h2 id="ai-prompt-example" tabindex="-1">AI Prompt Example <a class="header-anchor" href="#ai-prompt-example" aria-label="Permalink to &quot;AI Prompt Example&quot;">​</a></h2><p><strong>Without ai-first:</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>You: &quot;Add a login form&quot;</span></span>
<span class="line"><span>AI: *reads 200 files, doesn&#39;t know component patterns*</span></span></code></pre></div><p><strong>With ai-first:</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>You: &quot;Read ai/ai_context.md first. Then add a login form following the existing component patterns.&quot;</span></span>
<span class="line"><span>AI: *understands component structure, creates consistent form*</span></span>
<span class="line"><span>✅ Working code, follows patterns</span></span></code></pre></div>`,14)])])}const g=a(p,[["render",l]]);export{c as __pageData,g as default};
