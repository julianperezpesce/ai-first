import fs from "fs";
import path from "path";

export interface MigrationInfo {
  hasMigrations: boolean;
  framework: string | null;
  migrationDir: string | null;
  migrations: Migration[];
  tables: string[];
  summary: string;
}

export interface Migration {
  name: string;
  file: string;
  timestamp: string | null;
  operations: string[];
}

export function detectMigrations(rootDir: string): MigrationInfo {
  const result: MigrationInfo = {
    hasMigrations: false,
    framework: null,
    migrationDir: null,
    migrations: [],
    tables: [],
    summary: "",
  };

  const djangoMigrationsDir = path.join(rootDir, "migrations");
  if (fs.existsSync(djangoMigrationsDir) && fs.existsSync(path.join(djangoMigrationsDir, "__init__.py"))) {
    result.framework = "Django";
    result.migrationDir = "migrations";
    result.hasMigrations = true;
    result.migrations = parseDjangoMigrations(djangoMigrationsDir);
  }

  const knexMigrationsDir = path.join(rootDir, "db", "migrations");
  if (fs.existsSync(knexMigrationsDir)) {
    result.framework = "Knex";
    result.migrationDir = "db/migrations";
    result.hasMigrations = true;
    result.migrations = parseKnexMigrations(knexMigrationsDir);
  }

  const prismaMigrationsDir = path.join(rootDir, "prisma", "migrations");
  if (fs.existsSync(prismaMigrationsDir)) {
    result.framework = "Prisma";
    result.migrationDir = "prisma/migrations";
    result.hasMigrations = true;
    result.migrations = parsePrismaMigrations(prismaMigrationsDir);
  }

  const flywayDir = path.join(rootDir, "src", "main", "resources", "db", "migration");
  if (fs.existsSync(flywayDir)) {
    result.framework = "Flyway";
    result.migrationDir = "src/main/resources/db/migration";
    result.hasMigrations = true;
    result.migrations = parseFlywayMigrations(flywayDir);
  }

  const alembicDir = path.join(rootDir, "alembic", "versions");
  if (fs.existsSync(alembicDir)) {
    result.framework = "Alembic";
    result.migrationDir = "alembic/versions";
    result.hasMigrations = true;
    result.migrations = parseAlembicMigrations(alembicDir);
  }

  const railsMigrationsDir = path.join(rootDir, "db", "migrate");
  if (fs.existsSync(railsMigrationsDir)) {
    result.framework = "Rails";
    result.migrationDir = "db/migrate";
    result.hasMigrations = true;
    result.migrations = parseRailsMigrations(railsMigrationsDir);
  }

  for (const migration of result.migrations) {
    for (const op of migration.operations) {
      const tableMatch = op.match(/(?:create_table|CREATE TABLE|add_column|ALTER TABLE)\s+(\w+)/i);
      if (tableMatch && !result.tables.includes(tableMatch[1])) {
        result.tables.push(tableMatch[1]);
      }
    }
  }

  if (result.hasMigrations) {
    result.summary = `${result.framework}: ${result.migrations.length} migrations, ${result.tables.length} tables`;
  } else {
    result.summary = "No database migrations detected";
  }

  return result;
}

function parseDjangoMigrations(dir: string): Migration[] {
  const migrations: Migration[] = [];
  
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".py") && f !== "__init__.py").sort();
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const operations: string[] = [];
      
      const createMatches = content.matchAll(/migrations\.CreateModel\(\s*name='(\w+)'/g);
      for (const match of createMatches) {
        operations.push(`create_table ${match[1]}`);
      }
      
      const alterMatches = content.matchAll(/migrations\.AlterField\(\s*model_name='(\w+)'/g);
      for (const match of alterMatches) {
        operations.push(`alter_field ${match[1]}`);
      }
      
      const addFieldMatches = content.matchAll(/migrations\.AddField\(\s*model_name='(\w+)'/g);
      for (const match of addFieldMatches) {
        operations.push(`add_field ${match[1]}`);
      }
      
      migrations.push({
        name: file.replace(".py", ""),
        file,
        timestamp: file.split("_")[0] || null,
        operations,
      });
    }
  } catch {}
  
  return migrations;
}

function parseKnexMigrations(dir: string): Migration[] {
  const migrations: Migration[] = [];
  
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js") || f.endsWith(".ts")).sort();
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const operations: string[] = [];
      
      const createMatches = content.matchAll(/\.createTable\(\s*['"](\w+)['"]/g);
      for (const match of createMatches) {
        operations.push(`create_table ${match[1]}`);
      }
      
      const alterMatches = content.matchAll(/\.table\(\s*['"](\w+)['"]/g);
      for (const match of alterMatches) {
        operations.push(`alter_table ${match[1]}`);
      }
      
      migrations.push({
        name: file.replace(/\.(js|ts)$/, ""),
        file,
        timestamp: file.split("_")[0] || null,
        operations,
      });
    }
  } catch {}
  
  return migrations;
}

function parsePrismaMigrations(dir: string): Migration[] {
  const migrations: Migration[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).sort();
    
    for (const entry of entries) {
      const migrationDir = path.join(dir, entry.name);
      const sqlPath = path.join(migrationDir, "migration.sql");
      
      if (fs.existsSync(sqlPath)) {
        const content = fs.readFileSync(sqlPath, "utf-8");
        const operations: string[] = [];
        
        const createMatches = content.matchAll(/CREATE\s+TABLE\s+(\w+)/gi);
        for (const match of createMatches) {
          operations.push(`create_table ${match[1]}`);
        }
        
        const alterMatches = content.matchAll(/ALTER\s+TABLE\s+(\w+)/gi);
        for (const match of alterMatches) {
          operations.push(`alter_table ${match[1]}`);
        }
        
        migrations.push({
          name: entry.name,
          file: entry.name,
          timestamp: entry.name.split("_")[0] || null,
          operations,
        });
      }
    }
  } catch {}
  
  return migrations;
}

function parseFlywayMigrations(dir: string): Migration[] {
  const migrations: Migration[] = [];
  
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const operations: string[] = [];
      
      const createMatches = content.matchAll(/CREATE\s+TABLE\s+(\w+)/gi);
      for (const match of createMatches) {
        operations.push(`create_table ${match[1]}`);
      }
      
      migrations.push({
        name: file.replace(".sql", ""),
        file,
        timestamp: file.split("_")[0] || null,
        operations,
      });
    }
  } catch {}
  
  return migrations;
}

function parseAlembicMigrations(dir: string): Migration[] {
  const migrations: Migration[] = [];
  
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".py")).sort();
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const operations: string[] = [];
      
      const createMatches = content.matchAll(/op\.create_table\(\s*['"](\w+)['"]/g);
      for (const match of createMatches) {
        operations.push(`create_table ${match[1]}`);
      }
      
      migrations.push({
        name: file.replace(".py", ""),
        file,
        timestamp: file.split("_")[0] || null,
        operations,
      });
    }
  } catch {}
  
  return migrations;
}

function parseRailsMigrations(dir: string): Migration[] {
  const migrations: Migration[] = [];
  
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".rb")).sort();
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const operations: string[] = [];
      
      const createMatches = content.matchAll(/create_table\s+:(\w+)/g);
      for (const match of createMatches) {
        operations.push(`create_table ${match[1]}`);
      }
      
      const addColMatches = content.matchAll(/add_column\s+:(\w+)/g);
      for (const match of addColMatches) {
        operations.push(`add_column ${match[1]}`);
      }
      
      migrations.push({
        name: file.replace(".rb", ""),
        file,
        timestamp: file.split("_")[0] || null,
        operations,
      });
    }
  } catch {}
  
  return migrations;
}
