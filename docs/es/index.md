---
layout: home

hero:
  name: AI-First
  text: Prepara Tu Repositorio para Agentes de IA
  tagline: CLI que genera contexto instantáneo para OpenCode, Cursor, Claude Code y más. Ahorra 50-90% en tokens y haz que los agentes de IA se adapten en segundos.
  actions:
    - theme: brand
      text: Comenzar
      link: /es/guide/getting-started
    - theme: alt
      text: Ver en GitHub
      link: https://github.com/julianperezpesce/ai-first
      target: _blank
  image:
    src: /hero.png
    alt: AI-First CLI

features:
  - title: ⚡ Contexto Instantáneo
    details: Genera archivos de contexto completos en segundos. La IA entiende tu proyecto en ~500 tokens en vez de 50,000.
  - title: 🔌 Multi-Agente
    details: Funciona con OpenCode, Cursor, Claude Code, Windsurf, GitHub Copilot y cualquier asistente de IA.
  - title: 🗄️ Índice SQLite
    details: Consultas rápidas de símbolos con base de datos indexada. Busca funciones, clases e importaciones al instante.
  - title: 🧠 Búsqueda Semántica
    details: Embeddings vectoriales para búsqueda inteligente de código. Encuentra código relevante por significado, no solo palabras clave.
  - title: 📊 Grafo de Módulos
    details: Visualiza la arquitectura de tu codebase. Entiende dependencias y relaciones entre módulos.
  - title: 🌐 Multi-Lenguaje
    details: Soporta TypeScript, Python, Go, Rust, Java, C#, Ruby, PHP y más.
---

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
