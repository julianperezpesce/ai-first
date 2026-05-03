import fs from "fs";
import path from "path";

export interface DependencyInfo {
  name: string;
  version: string;
  type: "runtime" | "dev" | "peer" | "optional";
  source: string;
}

export function extractDependencyVersions(rootDir: string): DependencyInfo[] {
  const deps: DependencyInfo[] = [];

  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          deps.push({ name, version: version as string, type: "runtime", source: "package.json" });
        }
      }
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          deps.push({ name, version: version as string, type: "dev", source: "package.json" });
        }
      }
      if (pkg.peerDependencies) {
        for (const [name, version] of Object.entries(pkg.peerDependencies)) {
          deps.push({ name, version: version as string, type: "peer", source: "package.json" });
        }
      }
      if (pkg.optionalDependencies) {
        for (const [name, version] of Object.entries(pkg.optionalDependencies)) {
          deps.push({ name, version: version as string, type: "optional", source: "package.json" });
        }
      }
    } catch {}
  }

  const requirementsTxtPath = path.join(rootDir, "requirements.txt");
  if (fs.existsSync(requirementsTxtPath)) {
    try {
      const content = fs.readFileSync(requirementsTxtPath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;

        const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*([><=!~]+\s*[\d.]+)?$/);
        if (match) {
          deps.push({
            name: match[1],
            version: match[2]?.trim() || "latest",
            type: "runtime",
            source: "requirements.txt",
          });
        }
      }
    } catch {}
  }

  const pyprojectPath = path.join(rootDir, "pyproject.toml");
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, "utf-8");
      const depsMatch = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?:\[|$)/);
      if (depsMatch) {
        const depsBlock = depsMatch[1];
        const depLines = depsBlock.match(/^([a-zA-Z0-9_-]+)\s*=\s*"?([^"\n]+)"?/gm);
        if (depLines) {
          for (const line of depLines) {
            const match = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*"?([^"\n]+)"?/);
            if (match && match[1] !== "python") {
              deps.push({ name: match[1], version: match[2], type: "runtime", source: "pyproject.toml" });
            }
          }
        }
      }
    } catch {}
  }

  const gemfilePath = path.join(rootDir, "Gemfile");
  if (fs.existsSync(gemfilePath)) {
    try {
      const content = fs.readFileSync(gemfilePath, "utf-8");
      const gemLines = content.match(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g);
      if (gemLines) {
        for (const line of gemLines) {
          const match = line.match(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
          if (match) {
            deps.push({ name: match[1], version: match[2] || "latest", type: "runtime", source: "Gemfile" });
          }
        }
      }
    } catch {}
  }

  const pomPath = path.join(rootDir, "pom.xml");
  if (fs.existsSync(pomPath)) {
    try {
      const content = fs.readFileSync(pomPath, "utf-8");
      const depBlocks = content.match(/<dependency>[\s\S]*?<\/dependency>/g);
      if (depBlocks) {
        for (const block of depBlocks) {
          const groupId = block.match(/<groupId>([^<]+)<\/groupId>/)?.[1];
          const artifactId = block.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1];
          const version = block.match(/<version>([^<]+)<\/version>/)?.[1];
          const scope = block.match(/<scope>([^<]+)<\/scope>/)?.[1];

          if (groupId && artifactId) {
            deps.push({
              name: `${groupId}:${artifactId}`,
              version: version || "latest",
              type: scope === "test" ? "dev" : "runtime",
              source: "pom.xml",
            });
          }
        }
      }
    } catch {}
  }

  const cargoPath = path.join(rootDir, "Cargo.toml");
  if (fs.existsSync(cargoPath)) {
    try {
      const content = fs.readFileSync(cargoPath, "utf-8");
      const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
      if (depsMatch) {
        const depsBlock = depsMatch[1];
        const depLines = depsBlock.match(/^([a-zA-Z0-9_-]+)\s*=\s*"?([^"\n]+)"?/gm);
        if (depLines) {
          for (const line of depLines) {
            const match = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*"?([^"\n]+)"?/);
            if (match) {
              deps.push({ name: match[1], version: match[2], type: "runtime", source: "Cargo.toml" });
            }
          }
        }
      }
    } catch {}
  }

  const goModPath = path.join(rootDir, "go.mod");
  if (fs.existsSync(goModPath)) {
    try {
      const content = fs.readFileSync(goModPath, "utf-8");
      const requireMatch = content.match(/require\s*\(([\s\S]*?)\)/);
      if (requireMatch) {
        const lines = requireMatch[1].split("\n");
        for (const line of lines) {
          const match = line.trim().match(/^([^\s]+)\s+([^\s]+)/);
          if (match) {
            deps.push({ name: match[1], version: match[2], type: "runtime", source: "go.mod" });
          }
        }
      }
    } catch {}
  }

  return deps;
}
