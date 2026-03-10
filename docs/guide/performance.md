# Performance Optimization

AI-First is optimized to handle large repositories efficiently through incremental analysis and smart caching.

## Incremental Indexing

AI-First tracks file changes to avoid reprocessing the entire repository on each run.

### How It Works

1. **File Hash Tracking**: Each file's content is hashed (MD5)
2. **State Storage**: Hashes stored in `ai/index-state.json`
3. **Change Detection**: On each run, only modified files are re-indexed

### State File Format

```json
{
  "version": "1.0.0",
  "lastIndexed": "2026-03-10T12:00:00.000Z",
  "totalFiles": 150,
  "files": {
    "src/auth/AuthService.ts": {
      "path": "src/auth/AuthService.ts",
      "hash": "abc123...",
      "mtime": 1699531200000,
      "size": 1024,
      "indexedAt": "2026-03-10T12:00:00.000Z"
    }
  }
}
```

### CLI Output Example

```
🗄️  Generating index for: /project

   Total files: 150
   To index: 5
   Unchanged: 145
   New: 2
   Deleted: 0
```

## Semantic Contexts

Semantic contexts (features and flows) are regenerated based on the current module structure:

- **Features**: Derived from `modules.json` - regenerated when module structure changes
- **Flows**: Derived from `symbol-graph.json` - regenerated when symbol relationships change

These are lightweight computations compared to full symbol extraction.

## Performance Tips

### 1. Use Incremental Mode

The default behavior is incremental. Don't use `--force` unless necessary.

```bash
# Incremental (default)
ai-first map

# Force full rebuild
ai-first map --force
```

### 2. Exclude Unnecessary Files

Use `.aiignore` to exclude large or irrelevant directories:

```
# .aiignore
node_modules/
dist/
build/
coverage/
*.log
```

### 3. Large Repositories

For repositories with >2000 files, semantic indexing is automatically enabled:

```bash
ai-first map
# Automatically uses semantic mode for large repos
```

### 4. Git Integration

AI-First can use Git to detect changed files:

```bash
# Only analyze changed files
git commit -am "update" && ai-first map
```

## Benchmarks

| Repository Size | Files | Time (First) | Time (Incremental) |
|----------------|-------|--------------|---------------------|
| Small          | 50    | 0.3s        | 0.1s                |
| Medium         | 200   | 1.2s        | 0.3s                |
| Large          | 1000  | 5.5s        | 1.2s                |
| Huge           | 5000  | 28s         | 5s                  |

## Troubleshooting

### Slow Performance

1. **Check file count**: `ai-first doctor`
2. **Exclude directories**: Add to `.aiignore`
3. **Clear cache**: Delete `ai/index-state.json`

### Memory Issues

For very large repositories (>10k files):

```bash
ai-first map --semantic
```

This uses streaming analysis to reduce memory usage.
