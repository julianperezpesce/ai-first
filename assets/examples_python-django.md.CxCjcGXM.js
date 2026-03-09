import{_ as a,o as i,c as n,ag as t}from"./chunks/framework.BZohXCq9.js";const g=JSON.parse('{"title":"Example: Python Django","description":"","frontmatter":{},"headers":[],"relativePath":"examples/python-django.md","filePath":"examples/python-django.md","lastUpdated":1773089175000}'),p={name:"examples/python-django.md"};function l(e,s,h,k,o,r){return i(),n("div",null,[...s[0]||(s[0]=[t(`<h1 id="example-python-django" tabindex="-1">Example: Python Django <a class="header-anchor" href="#example-python-django" aria-label="Permalink to &quot;Example: Python Django&quot;">​</a></h1><p>This example demonstrates how ai-first analyzes a Django web application.</p><h2 id="input-project-structure" tabindex="-1">Input: Project Structure <a class="header-anchor" href="#input-project-structure" aria-label="Permalink to &quot;Input: Project Structure&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>my-django-app/</span></span>
<span class="line"><span>├── myproject/</span></span>
<span class="line"><span>│   ├── __init__.py</span></span>
<span class="line"><span>│   ├── settings.py</span></span>
<span class="line"><span>│   ├── urls.py</span></span>
<span class="line"><span>│   └── wsgi.py</span></span>
<span class="line"><span>├── myapp/</span></span>
<span class="line"><span>│   ├── __init__.py</span></span>
<span class="line"><span>│   ├── models.py</span></span>
<span class="line"><span>│   ├── views.py</span></span>
<span class="line"><span>│   ├── serializers.py</span></span>
<span class="line"><span>│   ├── urls.py</span></span>
<span class="line"><span>│   └── admin.py</span></span>
<span class="line"><span>├── manage.py</span></span>
<span class="line"><span>└── requirements.txt</span></span></code></pre></div><h2 id="run-ai-first" tabindex="-1">Run ai-first <a class="header-anchor" href="#run-ai-first" aria-label="Permalink to &quot;Run ai-first&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npx</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ai-first</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> init</span></span></code></pre></div><h2 id="output-generated-files" tabindex="-1">Output: Generated Files <a class="header-anchor" href="#output-generated-files" aria-label="Permalink to &quot;Output: Generated Files&quot;">​</a></h2><h3 id="ai-ai-context-md" tabindex="-1">ai/ai_context.md <a class="header-anchor" href="#ai-ai-context-md" aria-label="Permalink to &quot;ai/ai_context.md&quot;">​</a></h3><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;"># AI Context</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">&gt; Repository context for AI assistants. Generated automatically.</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Quick Overview</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Pattern**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Django MVC</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Languages**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Python</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Frameworks**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Django, Django REST Framework</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;"> **Total Files**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: 12</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Tech Stack</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Languages**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Python</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Frameworks**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: Django 4.x, Django REST Framework</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-light-font-weight:bold;--shiki-dark:#E1E4E8;--shiki-dark-font-weight:bold;">**Package Managers**</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: pip</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Architecture</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Primary: Django MVC</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Key Modules</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| Module | Responsibility |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">|--------|----------------|</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`myproject/\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Django project settings |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`myapp/models.py\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Database models |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`myapp/views.py\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | Business logic |</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">| </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\`myapp/serializers.py\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> | DRF serializers |</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Key Entrypoints</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### Server</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \`manage.py\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> - Django management command</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \`myproject/wsgi.py\`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> - WSGI entry point</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## Notes for AI Assistants</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">1.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Follow Django best practices</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">2.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Use Django ORM for database queries</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">3.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> REST APIs use Django REST Framework</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">4.</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Environment variables in settings</span></span></code></pre></div><h2 id="ai-prompt-example" tabindex="-1">AI Prompt Example <a class="header-anchor" href="#ai-prompt-example" aria-label="Permalink to &quot;AI Prompt Example&quot;">​</a></h2><p><strong>Without ai-first:</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>You: &quot;Add a user profile endpoint&quot;</span></span>
<span class="line"><span>AI: *reads 200 files, doesn&#39;t know Django patterns*</span></span></code></pre></div><p><strong>With ai-first:</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>You: &quot;Read ai/ai_context.md first. Then add a user profile endpoint following Django REST Framework patterns.&quot;</span></span>
<span class="line"><span>AI: *understands Django structure, creates proper endpoint*</span></span>
<span class="line"><span>✅ Working code, follows conventions</span></span></code></pre></div>`,14)])])}const c=a(p,[["render",l]]);export{g as __pageData,c as default};
