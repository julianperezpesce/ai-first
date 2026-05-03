import fs from "fs";
import path from "path";

export interface ReadmeInfo {
  title: string;
  description: string;
  hasInstallation: boolean;
  hasUsage: boolean;
  hasExamples: boolean;
}

export function parseReadme(rootDir: string): ReadmeInfo {
  const result: ReadmeInfo = {
    title: '',
    description: '',
    hasInstallation: false,
    hasUsage: false,
    hasExamples: false,
  };

  const readmePaths = ['README.md', 'readme.md', 'README.MD', 'docs/README.md'];
  
  for (const readmePath of readmePaths) {
    const fullPath = path.join(rootDir, readmePath);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      let inDescription = false;
      const descLines: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!result.title && line.startsWith('# ')) {
          result.title = line.slice(2).trim();
          continue;
        }
        
        if (line.startsWith('##')) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('install')) result.hasInstallation = true;
          if (lowerLine.includes('usage') || lowerLine.includes('quick start')) result.hasUsage = true;
          if (lowerLine.includes('example')) result.hasExamples = true;
          inDescription = false;
        }
        
        if (inDescription && line && !line.startsWith('#') && !line.startsWith('```')) {
          descLines.push(line);
        }
        
        if (line.startsWith('## Description') || line.startsWith('## Overview')) {
          inDescription = true;
        }
      }
      
      if (descLines.length > 0) {
        result.description = descLines.slice(0, 5).join(' ').trim();
        if (result.description.length > 300) {
          result.description = result.description.slice(0, 300) + '...';
        }
      }
      
      break;
    } catch {
      continue;
    }
  }

  return result;
}