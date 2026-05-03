import fs from "fs";
import path from "path";

export interface DataModel {
  name: string;
  file: string;
  fields: ModelField[];
  relationships: ModelRelationship[];
  framework: string;
}

export interface ModelField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  defaultValue: string | null;
}

export interface ModelRelationship {
  type: "hasOne" | "hasMany" | "belongsTo" | "manyToMany";
  target: string;
  foreignKey: string | null;
}

export function extractDataModels(rootDir: string): DataModel[] {
  const models: DataModel[] = [];

  const pyModels = extractPythonModels(rootDir);
  models.push(...pyModels);

  const tsModels = extractTypeScriptModels(rootDir);
  models.push(...tsModels);

  const prismaModels = extractPrismaModels(rootDir);
  models.push(...prismaModels);

  const goModels = extractGoModels(rootDir);
  models.push(...goModels);

  return models;
}

function extractPythonModels(rootDir: string): DataModel[] {
  const models: DataModel[] = [];
  const modelFiles = findFiles(rootDir, ["models.py", "model.py", "schemas.py"]);

  for (const file of modelFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      const classMatches = content.match(/class\s+(\w+)\s*\([^)]*(?:Model|Base|Schema)[^)]*\):/g);
      if (classMatches) {
        for (const classMatch of classMatches) {
          const className = classMatch.match(/class\s+(\w+)/)?.[1];
          if (!className) continue;

          const fields: ModelField[] = [];
          const relationships: ModelRelationship[] = [];

          const classBody = extractClassBody(content, className);
          if (classBody) {
            const fieldLines = classBody.match(/(\w+)\s*=\s*models?\.\w+\([^)]*\)/g);
            if (fieldLines) {
              for (const fieldLine of fieldLines) {
                const fieldName = fieldLine.match(/(\w+)\s*=/)?.[1];
                if (fieldName && fieldName !== "class" && fieldName !== "Meta") {
                  const fieldType = fieldLine.match(/models?\.(\w+)/)?.[1] || "unknown";
                  const required = !fieldLine.includes("null=True") && !fieldLine.includes("blank=True");
                  const unique = fieldLine.includes("unique=True");

                  fields.push({
                    name: fieldName,
                    type: fieldType,
                    required,
                    unique,
                    defaultValue: extractDefault(fieldLine),
                  });
                }
              }
            }

            const fkMatches = classBody.match(/(\w+)\s*=\s*models\.ForeignKey\(['"]?(\w+)['"]?/g);
            if (fkMatches) {
              for (const fkMatch of fkMatches) {
                const match = fkMatch.match(/(\w+)\s*=\s*models\.ForeignKey\(['"]?(\w+)['"]?/);
                if (match) {
                  relationships.push({
                    type: "belongsTo",
                    target: match[2],
                    foreignKey: match[1],
                  });
                }
              }
            }

            const m2mMatches = classBody.match(/(\w+)\s*=\s*models\.ManyToManyField\(['"]?(\w+)['"]?/g);
            if (m2mMatches) {
              for (const m2mMatch of m2mMatches) {
                const match = m2mMatch.match(/(\w+)\s*=\s*models\.ManyToManyField\(['"]?(\w+)['"]?/);
                if (match) {
                  relationships.push({
                    type: "manyToMany",
                    target: match[2],
                    foreignKey: match[1],
                  });
                }
              }
            }
          }

          const isDjango = content.includes("from django.db import models");
          const isSQLAlchemy = content.includes("from sqlalchemy");

          models.push({
            name: className,
            file: relativePath,
            fields,
            relationships,
            framework: isDjango ? "Django" : isSQLAlchemy ? "SQLAlchemy" : "Python",
          });
        }
      }
    } catch {}
  }

  return models;
}

function extractTypeScriptModels(rootDir: string): DataModel[] {
  const models: DataModel[] = [];
  const modelFiles = findFiles(rootDir, [".entity.ts", ".model.ts", ".schema.ts"]);

  for (const file of modelFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      const classMatches = content.match(/export\s+class\s+(\w+)/g);
      if (classMatches) {
        for (const classMatch of classMatches) {
          const className = classMatch.match(/export\s+class\s+(\w+)/)?.[1];
          if (!className) continue;

          const fields: ModelField[] = [];
          const relationships: ModelRelationship[] = [];

          const propMatches = content.match(/(?:@Column|@Field|@Prop)\s*\([^)]*\)\s*(\w+)\s*:\s*(\w+)/g);
          if (propMatches) {
            for (const propMatch of propMatches) {
              const match = propMatch.match(/(\w+)\s*:\s*(\w+)/);
              if (match) {
                fields.push({
                  name: match[1],
                  type: match[2],
                  required: !propMatch.includes("nullable: true"),
                  unique: propMatch.includes("unique: true"),
                  defaultValue: null,
                });
              }
            }
          }

          const relMatches = content.match(/@(?:OneToMany|ManyToOne|ManyToMany|OneToOne)\s*\([^)]*\)/g);
          if (relMatches) {
            for (const relMatch of relMatches) {
              const relType = relMatch.match(/@(OneToMany|ManyToOne|ManyToMany|OneToOne)/)?.[1];
              const target = relMatch.match(/type\s*=>\s*(\w+)/)?.[1] || relMatch.match(/\(\s*\(\)\s*=>\s*(\w+)/)?.[1];
              if (relType && target) {
                relationships.push({
                  type: relType === "OneToMany" ? "hasMany" : relType === "ManyToOne" ? "belongsTo" : relType === "OneToOne" ? "hasOne" : "manyToMany",
                  target,
                  foreignKey: null,
                });
              }
            }
          }

          const isTypeORM = content.includes("@Entity") || content.includes("@Column");
          const isMongoose = content.includes("@Schema") || content.includes("@Prop");

          models.push({
            name: className,
            file: relativePath,
            fields,
            relationships,
            framework: isTypeORM ? "TypeORM" : isMongoose ? "Mongoose" : "TypeScript",
          });
        }
      }
    } catch {}
  }

  return models;
}

function extractPrismaModels(rootDir: string): DataModel[] {
  const models: DataModel[] = [];
  const schemaPath = path.join(rootDir, "prisma", "schema.prisma");

  if (fs.existsSync(schemaPath)) {
    try {
      const content = fs.readFileSync(schemaPath, "utf-8");
      const modelBlocks = content.match(/model\s+\w+\s*\{[^}]*\}/g);

      if (modelBlocks) {
        for (const block of modelBlocks) {
          const name = block.match(/model\s+(\w+)/)?.[1];
          if (!name) continue;

          const fields: ModelField[] = [];
          const relationships: ModelRelationship[] = [];

          const fieldLines = block.match(/^\s+(\w+)\s+(\w+)[^\n]*/gm);
          if (fieldLines) {
            for (const line of fieldLines) {
              const match = line.trim().match(/^(\w+)\s+(\w+)/);
              if (match && match[1] !== "id" && match[1] !== "@@") {
                const isRelation = match[2].charAt(0) === match[2].charAt(0).toUpperCase() && match[2] !== "Int" && match[2] !== "String" && match[2] !== "Boolean" && match[2] !== "DateTime" && match[2] !== "Float" && match[2] !== "Decimal";

                if (isRelation) {
                  relationships.push({
                    type: line.includes("[]") ? "hasMany" : "belongsTo",
                    target: match[2],
                    foreignKey: null,
                  });
                } else {
                  fields.push({
                    name: match[1],
                    type: match[2],
                    required: !line.includes("?"),
                    unique: line.includes("@unique"),
                    defaultValue: line.includes("@default") ? line.match(/@default\(([^)]+)\)/)?.[1] || null : null,
                  });
                }
              }
            }
          }

          models.push({
            name,
            file: "prisma/schema.prisma",
            fields,
            relationships,
            framework: "Prisma",
          });
        }
      }
    } catch {}
  }

  return models;
}

function extractGoModels(rootDir: string): DataModel[] {
  const models: DataModel[] = [];
  const goFiles = findFiles(rootDir, [".go"]);

  for (const file of goFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relativePath = path.relative(rootDir, file);

      const structMatches = content.match(/type\s+(\w+)\s+struct\s*\{[^}]*\}/g);
      if (structMatches) {
        for (const structMatch of structMatches) {
          const structName = structMatch.match(/type\s+(\w+)/)?.[1];
          if (!structName) continue;

          const fields: ModelField[] = [];
          const relationships: ModelRelationship[] = [];

          const fieldLines = structMatch.match(/(\w+)\s+(\w+(?:\.\w+)?)\s+`[^`]*`/g);
          if (fieldLines) {
            for (const fieldLine of fieldLines) {
              const match = fieldLine.match(/(\w+)\s+(\w+(?:\.\w+)?)/);
              if (match) {
                const tag = fieldLine.match(/`([^`]*)`/)?.[1] || "";
                const gormTag = tag.match(/gorm:"([^"]*)"/)?.[1] || "";

                fields.push({
                  name: match[1],
                  type: match[2],
                  required: !gormTag.includes("null"),
                  unique: gormTag.includes("unique"),
                  defaultValue: gormTag.includes("default:") ? gormTag.match(/default:([^;]*)/)?.[1] || null : null,
                });

                if (gormTag.includes("foreignKey:") || gormTag.includes("many2many:")) {
                  relationships.push({
                    type: gormTag.includes("many2many:") ? "manyToMany" : "belongsTo",
                    target: match[2].replace("*", ""),
                    foreignKey: gormTag.match(/foreignKey:([^;]*)/)?.[1] || null,
                  });
                }
              }
            }
          }

          const isGORM = content.includes("gorm.io/gorm");
          models.push({
            name: structName,
            file: relativePath,
            fields,
            relationships,
            framework: isGORM ? "GORM" : "Go",
          });
        }
      }
    } catch {}
  }

  return models;
}

function extractClassBody(content: string, className: string): string | null {
  const classStart = content.indexOf(`class ${className}`);
  if (classStart === -1) return null;

  const bodyStart = content.indexOf(":", classStart) + 1;
  const lines = content.substring(bodyStart).split("\n");
  const bodyLines: string[] = [];
  let foundFirstLine = false;
  let baseIndent = -1;

  for (const line of lines) {
    if (line.trim() === "") {
      if (foundFirstLine) bodyLines.push(line);
      continue;
    }

    const currentIndent = line.search(/\S/);
    
    if (!foundFirstLine) {
      baseIndent = currentIndent;
      foundFirstLine = true;
    }

    if (currentIndent < baseIndent) break;
    
    bodyLines.push(line);
  }

  return bodyLines.join("\n");
}

function extractDefault(fieldLine: string): string | null {
  const defaultMatch = fieldLine.match(/default[=:]\s*([^,)]+)/);
  return defaultMatch ? defaultMatch[1].trim() : null;
}

function findFiles(rootDir: string, patterns: string[]): string[] {
  const files: string[] = [];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "__pycache__", "vendor", ".venv", "venv", "fixtures"];

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          walk(fullPath);
        } else if (entry.isFile()) {
          if (patterns.some(pattern => entry.name.includes(pattern) || entry.name.endsWith(pattern))) {
            files.push(fullPath);
          }
        }
      }
    } catch {}
  }

  walk(rootDir);
  return files;
}
