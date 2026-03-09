import { defineConfig } from 'vitepress'
import { resolve } from 'path'

export default defineConfig({
  title: 'AI-First',
  description: 'CLI tool that prepares any repository for AI coding agents. Generate instant context for OpenCode, Cursor, Claude Code, and more.',
  
  lastUpdated: true,
  cleanUrls: true,
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'canonical', href: 'https://julianperezpesce.github.io/ai-first/' }],
    
    // Open Graph
    ['meta', { property: 'og:title', content: 'AI-First - Prepare Your Repository for AI Coding Agents' }],
    ['meta', { property: 'og:description', content: 'CLI tool that prepares any repository to be used effectively by AI coding agents. Generate instant context for OpenCode, Cursor, Claude Code, and more.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://julianperezpesce.github.io/ai-first/' }],
    ['meta', { property: 'og:image', content: 'https://julianperezpesce.github.io/ai-first/og-image.png' }],
    
    // Twitter
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'AI-First - Prepare Your Repository for AI Coding Agents' }],
    ['meta', { name: 'twitter:description', content: 'CLI tool that prepares any repository to be used effectively by AI coding agents.' }],
    ['meta', { name: 'twitter:image', content: 'https://julianperezpesce.github.io/ai-first/og-image.png' }],
    
    // Schema.org JSON-LD
    ['script', { type: 'application/ld+json', children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'AI-First',
      description: 'CLI tool that prepares any repository for AI coding agents',
      url: 'https://julianperezpesce.github.io/ai-first/',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'macOS, Linux, Windows',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Person',
        name: 'Julian Perez Pesce',
        url: 'https://github.com/julianperezpesce'
      }
    })}]
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
            { text: 'Quick Start', link: '/guide/quick-start' }
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
