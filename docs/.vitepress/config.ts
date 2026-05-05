import { defineConfig } from 'vitepress'
import { resolve } from 'path'

export default defineConfig({
  title: 'AI-First',
  description: 'CLI tool that prepares any repository for AI coding agents.',
  
  locales: {
    '/': {
      label: 'English',
      lang: 'en',
      title: 'AI-First',
      description: 'CLI tool that prepares any repository for AI coding agents'
    },
    '/es/': {
      label: 'Español',
      lang: 'es',
      title: 'AI-First',
      description: 'CLI que prepara cualquier repositorio para agentes de IA'
    }
  },

  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'canonical', href: 'https://ai-first-cli.netlify.app/' }],
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Reference', link: '/reference/commands' },
      { 
        text: 'GitHub', 
        link: 'https://github.com/julianperezpesce/ai-first',
        target: '_blank',
        rel: 'noopener'
      },
      {
        text: 'NPM',
        link: 'https://www.npmjs.com/package/ai-first',
        target: '_blank',
        rel: 'noopener'
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'AI Agent Playbook', link: '/guide/ai-agent-playbook' }
          ]
        },
        {
          text: 'v1.3.8 Features',
          items: [
            { text: 'MCP Server', link: '/guide/mcp' },
            { text: 'Configuration Presets', link: '/guide/config' },
            { text: 'RAG Vector Search', link: '/guide/rag' },
            { text: 'Git Blame', link: '/guide/git-blame' }
          ]
        },
        {
          text: 'Concepts',
          items: [
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'How It Works', link: '/guide/how-it-works' },
            { text: 'Generated Files', link: '/guide/generated-files' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Express API', link: '/examples/express-api' },
            { text: 'React App', link: '/examples/react-app' },
            { text: 'Python Django', link: '/examples/python-django' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Commands', link: '/reference/commands' },
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'API', link: '/reference/api' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/julianperezpesce/ai-first' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/ai-first' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Julian Perez Pesce'
    },
    
    search: {
      provider: 'local'
    },
    
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    
    editLink: {
      pattern: 'https://github.com/julianperezpesce/ai-first/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },
  
  vite: {
    resolve: {
      alias: {
        '@': resolve(__dirname, '..')
      }
    }
  }
})
