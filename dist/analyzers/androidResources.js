/**
 * Analyze Android resources in res/ directory
 */
export function analyzeAndroidResources(files) {
    const resFiles = files.filter(f => f.relativePath.startsWith("res/"));
    if (resFiles.length === 0) {
        return {
            isAndroid: false,
            resources: [],
            layouts: [],
            drawables: [],
            values: [],
            totalResources: 0,
        };
    }
    const resources = [];
    const layouts = [];
    const drawables = [];
    const values = [];
    for (const file of resFiles) {
        const relativePath = file.relativePath;
        const parts = relativePath.split("/");
        // res/layout/*.xml -> layout
        // res/drawable-*/*.{png,xml} -> drawable
        // res/values/*.xml -> values
        // res/menu/*.xml -> menu
        // res/mipmap-*/*.png -> mipmap
        // res/anim/*.xml -> anim
        // res/xml/*.xml -> xml
        let type = "other";
        let resourceName = file.name;
        if (parts[1] === "layout") {
            type = "layout";
            layouts.push(resourceName);
        }
        else if (parts[1]?.startsWith("drawable")) {
            type = "drawable";
            drawables.push(resourceName);
        }
        else if (parts[1] === "values") {
            type = "values";
            values.push(resourceName);
        }
        else if (parts[1] === "menu") {
            type = "menu";
        }
        else if (parts[1]?.startsWith("mipmap")) {
            type = "mipmap";
        }
        else if (parts[1] === "anim") {
            type = "anim";
        }
        else if (parts[1] === "xml") {
            type = "xml";
        }
        resources.push({
            type,
            name: resourceName,
            path: relativePath,
        });
    }
    return {
        isAndroid: true,
        resources,
        layouts,
        drawables,
        values,
        totalResources: resources.length,
    };
}
/**
 * Generate android-resources.json content
 */
export function generateAndroidResourcesJson(analysis) {
    const output = {
        isAndroid: analysis.isAndroid,
        totalResources: analysis.totalResources,
        layouts: analysis.layouts,
        drawables: analysis.drawables,
        values: analysis.values,
        byType: {
            layout: analysis.resources.filter(r => r.type === "layout").map(r => r.path),
            drawable: analysis.resources.filter(r => r.type === "drawable").map(r => r.path),
            values: analysis.resources.filter(r => r.type === "values").map(r => r.path),
            menu: analysis.resources.filter(r => r.type === "menu").map(r => r.path),
            mipmap: analysis.resources.filter(r => r.type === "mipmap").map(r => r.path),
            anim: analysis.resources.filter(r => r.type === "anim").map(r => r.path),
            xml: analysis.resources.filter(r => r.type === "xml").map(r => r.path),
        },
    };
    return JSON.stringify(output, null, 2);
}
//# sourceMappingURL=androidResources.js.map