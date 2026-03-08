import { groupByDirectory, groupByExtension } from "./repoScanner.js";
/**
 * Generate a repo map from scanned files
 */
export function generateRepoMap(files, options = {}) {
    const { maxDepth = 3, includeExtensions = true, sortBy = "directory" } = options;
    const lines = [];
    lines.push("# Repository Map\n");
    // Group files
    const grouped = sortBy === "directory"
        ? groupByDirectory(files)
        : groupByExtension(files);
    if (sortBy === "directory") {
        // Sort directories alphabetically
        const sortedDirs = Array.from(grouped.keys()).sort();
        for (const dir of sortedDirs) {
            const dirFiles = grouped.get(dir)?.sort((a, b) => a.name.localeCompare(b.name)) || [];
            lines.push(`## ${dir === "root" ? "(root)" : dir}\n`);
            for (const file of dirFiles) {
                const ext = includeExtensions && file.extension ? `.${file.extension}` : "";
                const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
                const indent = dir === "root" ? "- " : "  - ";
                lines.push(`${indent}${nameWithoutExt}${ext}\n`);
            }
            lines.push("\n");
        }
    }
    else {
        // Sort by extension
        const sortedExts = Array.from(grouped.keys()).sort();
        for (const ext of sortedExts) {
            const extFiles = grouped.get(ext)?.sort((a, b) => a.name.localeCompare(b.name)) || [];
            lines.push(`## ${ext === "no-extension" ? "(no extension)" : `.${ext}`}\n`);
            for (const file of extFiles) {
                lines.push(`- ${file.relativePath}\n`);
            }
            lines.push("\n");
        }
    }
    return lines.join("");
}
/**
 * Generate a compact repo map (tree view)
 */
export function generateCompactRepoMap(files) {
    const lines = [];
    lines.push("# Repository Structure (Tree View)\n");
    // Build tree structure
    const tree = buildTree(files);
    // Render tree
    renderTree(tree, "", lines);
    return lines.join("");
}
function buildTree(files) {
    const root = {};
    for (const file of files) {
        const parts = file.relativePath.split("/");
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            if (!current[part]) {
                current[part] = isFile ? null : {};
            }
            if (!isFile && current[part]) {
                current = current[part];
            }
        }
    }
    return root;
}
/**
 * Render tree to lines
 */
function renderTree(node, prefix, lines) {
    const entries = Object.entries(node).sort(([a], [b]) => a.localeCompare(b));
    const dirs = [];
    const files = [];
    for (const [key, value] of entries) {
        if (value === null) {
            files.push(key);
        }
        else {
            dirs.push(key);
        }
    }
    // Render directories first, then files
    const allEntries = [...dirs.sort(), ...files.sort()];
    for (let i = 0; i < allEntries.length; i++) {
        const key = allEntries[i];
        const isLast = i === allEntries.length - 1;
        const isDir = dirs.includes(key);
        const connector = isLast ? "└── " : "├── ";
        lines.push(`${prefix}${connector}${key}${isDir ? "/" : ""}\n`);
        if (isDir) {
            const newPrefix = prefix + (isLast ? "    " : "│   ");
            renderTree(node[key], newPrefix, lines);
        }
    }
}
/**
 * Generate summary statistics
 */
export function generateSummary(files) {
    const lines = [];
    lines.push("# Repository Summary\n");
    const total = files.length;
    lines.push(`- **Total files**: ${total}\n`);
    // Count by extension
    const byExt = groupByExtension(files);
    const extCounts = Array.from(byExt.entries())
        .map(([ext, f]) => `  - .${ext}: ${f.length}`)
        .sort()
        .join("\n");
    lines.push(`\n## Files by Extension\n${extCounts}\n`);
    // Count by directory
    const byDir = groupByDirectory(files);
    const dirCounts = Array.from(byDir.entries())
        .map(([dir, f]) => `  - ${dir === "root" ? "(root)" : dir}: ${f.length}`)
        .sort()
        .join("\n");
    lines.push(`\n## Files by Directory\n${dirCounts}\n`);
    return lines.join("");
}
//# sourceMappingURL=repoMapper.js.map