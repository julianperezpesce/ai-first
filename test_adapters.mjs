import { extractSymbols } from "./dist/analyzers/symbols.js";
import fs from "fs";
import path from "path";

const projects = [
  { name: "Django", path: "test-projects/django-app", ext: ".py", sampleFile: "blog/models.py" },
  { name: "Laravel", path: "test-projects/laravel-app", ext: ".php", sampleFile: "app/Http/Controllers/Controller.php" },
  { name: "FastAPI", path: "test-projects/fastapi-app", ext: ".py", sampleFile: "app/main.py" },
  { name: "Flask", path: "test-projects/flask-app", ext: ".py", sampleFile: "app/models.py" },
  { name: "Rails", path: "test-projects/rails-app", ext: ".rb", sampleFile: "app/models/user.rb" },
  { name: "Spring Boot", path: "test-projects/spring-boot-app", ext: ".java", sampleFile: "src/main/java/com/example/demo/DemoApplication.java" },
  { name: "NestJS", path: "test-projects/nestjs-backend", ext: ".ts", sampleFile: "src/main.ts" },
  { name: "Express", path: "test-projects/express-api", ext: ".js", sampleFile: "index.js" },
  { name: "React", path: "test-projects/react-app", ext: ".tsx", sampleFile: "src/App.tsx" },
  { name: "Salesforce", path: "test-projects/salesforce-cli", ext: ".cls", sampleFile: "force-app/main/default/classes/AccountController.cls" },
  { name: "Python CLI", path: "test-projects/python-cli", ext: ".py", sampleFile: "main.py" },
];

console.log("=== ADAPTER SYMBOL EXTRACTION TESTS ===\n");

const results = [];

for (const project of projects) {
  const fullPath = path.join(process.cwd(), project.path, project.sampleFile);
  const fileExists = fs.existsSync(fullPath);
  
  if (fileExists) {
    const content = fs.readFileSync(fullPath, "utf8");
    const fileInfo = {
      path: fullPath,
      relativePath: project.sampleFile,
      extension: project.ext,
      name: path.basename(project.sampleFile, path.extname(project.sampleFile))
    };
    
    const symbols = extractSymbols([fileInfo]);
    const symbolCount = symbols.symbols.length;
    const symbolNames = symbols.symbols.map(s => s.name).slice(0, 5).join(", ");
    
    results.push({
      adapter: project.name,
      extension: project.ext,
      file: project.sampleFile,
      symbolsExtracted: symbolCount,
      sampleSymbols: symbolNames,
      status: symbolCount > 0 ? "PASS" : "FAIL"
    });
    
    console.log(`[${symbolCount > 0 ? "PASS" : "FAIL"}] ${project.name} (${project.ext})`);
    console.log(`  File: ${project.sampleFile}`);
    console.log(`  Symbols: ${symbolCount}`);
    if (symbolCount > 0) {
      console.log(`  Sample: ${symbolNames}`);
    }
    console.log("");
  } else {
    results.push({
      adapter: project.name,
      extension: project.ext,
      file: project.sampleFile,
      symbolsExtracted: -1,
      sampleSymbols: "FILE NOT FOUND",
      status: "ERROR"
    });
    
    console.log(`[ERROR] ${project.name}`);
    console.log(`  File not found: ${project.sampleFile}`);
    console.log("");
  }
}

console.log("\n=== SUMMARY ===");
const passed = results.filter(r => r.status === "PASS").length;
const failed = results.filter(r => r.status === "FAIL").length;
const errors = results.filter(r => r.status === "ERROR").length;

console.log(`Total: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Errors: ${errors}`);

if (failed > 0 || errors > 0) {
  console.log("\n=== FAILED ADAPTERS ===");
  results.filter(r => r.status !== "PASS").forEach(r => {
    console.log(`- ${r.adapter} (${r.extension}): ${r.status} - ${r.sampleSymbols}`);
  });
}
