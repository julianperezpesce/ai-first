---
layout: home

hero:
  name: AI-First
  tagline: CLI tool that generates instant context for OpenCode, Cursor, Claude Code, and more. Save 50-90% in tokens.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/julianperezpesce/ai-first
      target: _blank
  image:
    src: /hero.png
    alt: AI-First CLI

features:
  - title: ⚡ Instant Context
    details: Generate comprehensive context files in seconds. AI understands your project in ~500 tokens instead of 50,000.
  - title: 🔌 MCP Server
    details: Native Model Context Protocol integration. Use AI-First as a tool in Cursor, Claude Code, and other AI agents.
  - title: ⚙️ Config Presets
    details: 4 built-in presets (full, quick, api, docs) to customize context generation for your use case.
  - title: 🗄️ SQLite Index
    details: Fast symbol queries with indexed database. Search functions, classes, and imports instantly.
  - title: 🧠 Semantic Search
    details: RAG vector embeddings for intelligent code search. Find relevant code by meaning, not just keywords.
  - title: 📊 Module Graph
    details: Visualize your codebase architecture. Understand dependencies and module relationships.
  - title: 🔍 Git Blame
    details: Track code authorship directly in your AI context. Know who wrote what and when.
  - title: 🌐 Multi-Language
    details: Supports TypeScript, Python, Go, Rust, Java, C#, Ruby, PHP, and more.
  - title: 📦 Multi-Repo
    details: Handle monorepos and microservices. Scan multiple repositories in one command.
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Add hero animation
  const hero = document.querySelector('.hero')
  if (hero) {
    hero.classList.add('animate-in')
  }
})
</script>

<style>
.hero {
  text-align: center;
  padding: 48px 24px;
}

.hero .name {
  font-size: 4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero .text {
  font-size: 1.5rem;
  color: var(--vp-c-text-2);
  max-width: 640px;
  margin: 0 auto;
  line-height: 1.6;
}

.hero .tagline {
  font-size: 1.125rem;
  color: var(--vp-c-text-3);
  margin-top: 8px;
}

.VPButton.brand {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.VPButton.brand:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.feature-card {
  padding: 28px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-alt);
  transition: all 0.2s ease;
}

.feature-card:hover {
  border-color: #10b981;
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.12);
}

.feature-card h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--vp-c-text-1);
}

.feature-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero .name {
    font-size: 2.5rem;
  }
  
  .hero .text {
    font-size: 1.125rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
