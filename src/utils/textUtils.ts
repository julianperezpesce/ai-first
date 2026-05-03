export function deduplicateDescription(description: string, moduleName: string): string {
  let result = description.trim();
  
  const lowerResult = result.toLowerCase();
  const lowerName = moduleName.toLowerCase();
  
  if (lowerResult.includes(lowerName) && lowerResult !== lowerName) {
    const regex = new RegExp(`\\b${escapeRegex(moduleName)}\\b`, 'gi');
    result = result.replace(regex, '').replace(/\s+/g, ' ').trim();
  }
  
  result = result.replace(/\bAPI\b/gi, '').replace(/\bimplementation\b/gi, '').replace(/\bmodule\b/gi, '');
  result = result.replace(/file/gi, '');
  
  result = result.replace(/^[\s\-:]+/, '').replace(/[\s\-:]+$/, '').replace(/\s+/g, ' ').trim();
  
  return result || moduleName;
}

export function deduplicatePhrases(text: string): string {
  const phrases = text.split(/\s+/);
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(phrase);
    }
  }
  
  return result.join(' ');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatModuleDescription(
  moduleName: string,
  baseDescription: string,
  fileCount: number
): string {
  if (!baseDescription || baseDescription.trim() === '') {
    return `${moduleName} module`;
  }
  
  let desc = deduplicateDescription(baseDescription, moduleName);
  
  if (desc.toLowerCase() === 'api api' || desc.toLowerCase() === 'implementation') {
    desc = moduleName;
  }
  
  return desc;
}