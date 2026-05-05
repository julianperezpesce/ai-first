import fs from "fs";
import path from "path";

export type McpCompatibilityPlatform =
  | "opencode"
  | "opencode-legacy"
  | "codex"
  | "claude-code"
  | "cursor"
  | "remote-http"
  | "generic-stdio";

export interface McpCompatibilityProfile {
  platform: McpCompatibilityPlatform;
  label: string;
  status: "supported" | "partial";
  transport: "stdio" | "streamable-http";
  configPath: string | null;
  installable: boolean;
  description: string;
  evidence: string[];
  notes: string[];
}

export interface McpInstallOptions {
  rootDir: string;
  platform: McpCompatibilityPlatform;
  command?: string;
  serverName?: string;
  writeLegacyOpenCodeConfig?: boolean;
}

export interface McpInstallResult {
  platform: McpCompatibilityPlatform;
  rootDir: string;
  success: boolean;
  filesWritten: string[];
  warnings: string[];
  nextSteps: string[];
  config: unknown;
}

export interface McpDoctorResult {
  rootDir: string;
  ok: boolean;
  transport: "stdio" | "streamable-http";
  checks: Array<{
    id: string;
    status: "pass" | "warn" | "fail";
    message: string;
    evidence: string[];
  }>;
}

export interface McpDoctorOptions {
  rootDir: string;
  transport?: "stdio" | "streamable-http";
  host?: string;
  port?: number;
  authToken?: string;
  allowUnsafe?: boolean;
}

export interface McpHttpSafetyResult {
  ok: boolean;
  status: "pass" | "warn" | "fail";
  localOnly: boolean;
  authEnabled: boolean;
  message: string;
  evidence: string[];
}

const DEFAULT_SERVER_NAME = "ai-first";

export function getMcpCompatibilityProfiles(): McpCompatibilityProfile[] {
  return [
    {
      platform: "opencode",
      label: "OpenCode",
      status: "supported",
      transport: "stdio",
      configPath: "opencode.jsonc",
      installable: true,
      description: "Project-local OpenCode MCP config using the current mcp.local shape.",
      evidence: [
        "OpenCode docs define MCP servers under opencode.jsonc mcp",
        "local MCP command is an array of command and arguments",
      ],
      notes: [
        "The legacy .opencode/mcp.json file can also be written for older ai-first setups.",
      ],
    },
    {
      platform: "codex",
      label: "Codex",
      status: "supported",
      transport: "stdio",
      configPath: ".codex/config.toml",
      installable: true,
      description: "Project-local TOML snippet compatible with Codex mcp_servers config.",
      evidence: [
        "OpenAI docs document Codex MCP config under ~/.codex/config.toml",
        "Codex supports mcp_servers entries with command/args for local stdio servers",
      ],
      notes: [
        "ai-first writes a project-local .codex/config.toml snippet instead of modifying the user home config.",
      ],
    },
    {
      platform: "claude-code",
      label: "Claude Code",
      status: "supported",
      transport: "stdio",
      configPath: ".mcp.json",
      installable: true,
      description: "Project-scoped .mcp.json config for Claude Code and other MCP JSON clients.",
      evidence: [
        "Claude Code docs define project-scoped MCP servers in .mcp.json",
        "stdio servers use command and args fields",
      ],
      notes: [
        "Claude Code may ask the user to approve project-scoped MCP servers before first use.",
      ],
    },
    {
      platform: "cursor",
      label: "Cursor",
      status: "partial",
      transport: "stdio",
      configPath: ".cursor/mcp.json",
      installable: true,
      description: "Cursor-style mcpServers JSON config for local stdio MCP servers.",
      evidence: [
        "Cursor MCP examples use mcpServers JSON config",
      ],
      notes: [
        "Cursor support can vary by version; verify from Cursor settings after install.",
      ],
    },
    {
      platform: "generic-stdio",
      label: "Generic stdio",
      status: "supported",
      transport: "stdio",
      configPath: null,
      installable: false,
      description: "Use command `af mcp --root <repo>` in any MCP client that supports local stdio servers.",
      evidence: [
        "ai-first MCP server currently exposes a stdio transport",
      ],
      notes: [
        "Use the remote-http profile when the client connects to a URL instead of spawning a process.",
      ],
    },
    {
      platform: "remote-http",
      label: "Remote HTTP MCP",
      status: "supported",
      transport: "streamable-http",
      configPath: null,
      installable: false,
      description: "Expose AI-First over MCP Streamable HTTP for clients that connect to a URL instead of spawning a local process.",
      evidence: [
        "MCP TypeScript SDK supports Streamable HTTP for remote servers",
        "ai-first exposes HTTP transport with `af mcp --transport http`",
      ],
      notes: [
        "The built-in server is intended for trusted local networks or localhost unless placed behind external auth/proxy controls.",
      ],
    },
    {
      platform: "opencode-legacy",
      label: "OpenCode legacy",
      status: "partial",
      transport: "stdio",
      configPath: ".opencode/mcp.json",
      installable: true,
      description: "Historical ai-first OpenCode config kept for backwards compatibility.",
      evidence: [
        "Existing ai-first --install-mcp tests and workflows expect .opencode/mcp.json",
      ],
      notes: [
        "Prefer opencode.jsonc for new OpenCode installs.",
      ],
    },
  ];
}

export function installMcpProfile(options: McpInstallOptions): McpInstallResult {
  const rootDir = options.rootDir;
  const platform = options.platform;
  const command = options.command || "af";
  const serverName = options.serverName || DEFAULT_SERVER_NAME;
  const warnings: string[] = [];
  const filesWritten: string[] = [];

  const config = generateProfileConfig(platform, command, serverName);
  if (!config.installPath) {
    return {
      platform,
      rootDir,
      success: false,
      filesWritten,
      warnings: [`${platform} does not have an installable project config`],
      nextSteps: [`Configure your MCP client with: ${command} mcp --root ${rootDir}`],
      config: config.content,
    };
  }

  const targetPath = path.join(rootDir, config.installPath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  if (config.kind === "json") {
    const merged = mergeJsonConfig(targetPath, config.content, warnings);
    fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2));
  } else {
    fs.writeFileSync(targetPath, String(config.content));
  }
  filesWritten.push(targetPath);

  if (platform === "opencode" && options.writeLegacyOpenCodeConfig !== false) {
    const legacy = generateProfileConfig("opencode-legacy", command, serverName);
    if (legacy.installPath && legacy.kind === "json") {
      const legacyPath = path.join(rootDir, legacy.installPath);
      fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
      const merged = mergeJsonConfig(legacyPath, legacy.content, warnings);
      fs.writeFileSync(legacyPath, JSON.stringify(merged, null, 2));
      filesWritten.push(legacyPath);
    }
  }

  return {
    platform,
    rootDir,
    success: true,
    filesWritten,
    warnings,
    nextSteps: getNextSteps(platform),
    config: config.content,
  };
}

export function getMcpDoctor(rootDirOrOptions: string | McpDoctorOptions): McpDoctorResult {
  const options: McpDoctorOptions = typeof rootDirOrOptions === "string"
    ? { rootDir: rootDirOrOptions }
    : rootDirOrOptions;
  const rootDir = options.rootDir;
  const transport = options.transport || "stdio";
  const checks: McpDoctorResult["checks"] = [];
  const packageJsonPath = path.join(rootDir, "package.json");
  const distBinPath = path.join(rootDir, "dist", "commands", "ai-first.js");
  const srcServerPath = path.join(rootDir, "src", "mcp", "server.ts");
  const installedConfigs = getInstalledMcpConfigs(rootDir);

  checks.push({
    id: "mcp-source",
    status: fs.existsSync(srcServerPath) ? "pass" : "warn",
    message: fs.existsSync(srcServerPath) ? "MCP server source exists" : "MCP server source is missing",
    evidence: [srcServerPath],
  });
  checks.push({
    id: "mcp-bin",
    status: fs.existsSync(distBinPath) ? "pass" : "warn",
    message: fs.existsSync(distBinPath) ? "Built CLI bin exists" : "Built CLI bin is missing; run npm run build",
    evidence: [distBinPath],
  });
  checks.push({
    id: "package-bin",
    status: packageDeclaresBin(packageJsonPath) ? "pass" : "warn",
    message: packageDeclaresBin(packageJsonPath) ? "package.json declares CLI bin entries" : "package.json bin entry is missing",
    evidence: [packageJsonPath],
  });
  checks.push({
    id: "installed-profile",
    status: installedConfigs.length > 0 ? "pass" : "warn",
    message: installedConfigs.length > 0 ? "MCP compatibility config found" : "No project-local MCP compatibility config found",
    evidence: installedConfigs.length > 0 ? installedConfigs : ["opencode.jsonc", ".mcp.json", ".codex/config.toml", ".cursor/mcp.json"],
  });

  if (transport === "streamable-http") {
    const safety = evaluateMcpHttpSafety({
      host: options.host || "127.0.0.1",
      port: options.port ?? 3847,
      authToken: options.authToken,
      allowUnsafe: options.allowUnsafe,
    });
    checks.push({
      id: "http-safety",
      status: safety.status,
      message: safety.message,
      evidence: safety.evidence,
    });
  }

  return {
    rootDir,
    ok: checks.every(check => check.status !== "fail"),
    transport,
    checks,
  };
}

export function evaluateMcpHttpSafety(options: {
  host: string;
  port: number;
  authToken?: string;
  allowUnsafe?: boolean;
}): McpHttpSafetyResult {
  const localOnly = isLocalMcpHost(options.host);
  const authEnabled = Boolean(options.authToken);
  const evidence = [
    `host=${options.host}`,
    `port=${options.port}`,
    `auth=${authEnabled ? "enabled" : "disabled"}`,
  ];

  if (localOnly && !authEnabled) {
    return {
      ok: true,
      status: "warn",
      localOnly,
      authEnabled,
      message: "HTTP MCP is bound to localhost without auth; acceptable for local development only",
      evidence,
    };
  }

  if (authEnabled) {
    return {
      ok: true,
      status: "pass",
      localOnly,
      authEnabled,
      message: localOnly ? "HTTP MCP auth is enabled" : "HTTP MCP auth is enabled for non-local bind",
      evidence,
    };
  }

  return {
    ok: Boolean(options.allowUnsafe),
    status: options.allowUnsafe ? "warn" : "fail",
    localOnly,
    authEnabled,
    message: options.allowUnsafe
      ? "HTTP MCP is exposed beyond localhost without auth because unsafe mode is allowed"
      : "HTTP MCP refuses non-local bind without auth token",
    evidence: options.allowUnsafe ? [...evidence, "allowUnsafe=true"] : evidence,
  };
}

export function isLocalMcpHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === "127.0.0.1"
    || normalized === "localhost"
    || normalized === "::1"
    || normalized === "[::1]";
}

export function normalizeMcpPlatform(value: string): McpCompatibilityPlatform | null {
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, McpCompatibilityPlatform> = {
    opencode: "opencode",
    "opencode-legacy": "opencode-legacy",
    codex: "codex",
    claude: "claude-code",
    "claude-code": "claude-code",
    cursor: "cursor",
    generic: "generic-stdio",
    "generic-stdio": "generic-stdio",
    "remote-http": "remote-http",
    http: "remote-http",
    "streamable-http": "remote-http",
    stdio: "generic-stdio",
  };
  return aliases[normalized] || null;
}

function generateProfileConfig(
  platform: McpCompatibilityPlatform,
  command: string,
  serverName: string
): { installPath: string | null; kind: "json" | "toml" | "jsonc"; content: unknown } {
  const stdioArgs = ["mcp", "--root", "."];

  if (platform === "opencode") {
    return {
      installPath: "opencode.jsonc",
      kind: "json",
      content: {
        $schema: "https://opencode.ai/config.json",
        mcp: {
          [serverName]: {
            type: "local",
            command: [command, ...stdioArgs],
            enabled: true,
          },
        },
      },
    };
  }

  if (platform === "opencode-legacy") {
    return {
      installPath: path.join(".opencode", "mcp.json"),
      kind: "json",
      content: {
        mcpServers: {
          [serverName]: {
            command,
            args: ["mcp"],
            autoConnect: true,
          },
        },
      },
    };
  }

  if (platform === "codex") {
    return {
      installPath: path.join(".codex", "config.toml"),
      kind: "toml",
      content: `[mcp_servers.${serverName}]\ncommand = "${escapeTomlString(command)}"\nargs = ["mcp", "--root", "."]\n`,
    };
  }

  if (platform === "claude-code") {
    return {
      installPath: ".mcp.json",
      kind: "json",
      content: {
        mcpServers: {
          [serverName]: {
            command,
            args: stdioArgs,
            env: {},
          },
        },
      },
    };
  }

  if (platform === "cursor") {
    return {
      installPath: path.join(".cursor", "mcp.json"),
      kind: "json",
      content: {
        mcpServers: {
          [serverName]: {
            command,
            args: stdioArgs,
          },
        },
      },
    };
  }

  if (platform === "remote-http") {
    return {
      installPath: null,
      kind: "json",
      content: {
        url: "http://127.0.0.1:3847/mcp",
        transport: "streamable-http",
      },
    };
  }

  return {
    installPath: null,
    kind: "json",
    content: {
      command,
      args: stdioArgs,
    },
  };
}

function mergeJsonConfig(targetPath: string, nextConfig: unknown, warnings: string[]): unknown {
  if (!fs.existsSync(targetPath)) return nextConfig;

  try {
    const current = JSON.parse(stripJsonComments(fs.readFileSync(targetPath, "utf-8"))) as Record<string, unknown>;
    return deepMerge(current, nextConfig as Record<string, unknown>);
  } catch {
    warnings.push(`Could not parse existing ${targetPath}; overwrote with generated ai-first MCP config`);
    return nextConfig;
  }
}

function deepMerge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripJsonComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function escapeTomlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getNextSteps(platform: McpCompatibilityPlatform): string[] {
  if (platform === "opencode") {
    return ["Restart OpenCode or reload its config", "Ask the agent to use the ai-first MCP tools"];
  }
  if (platform === "codex") {
    return ["Copy or symlink the project-local .codex/config.toml entry into ~/.codex/config.toml if your Codex install does not read project config", "Run codex mcp list"];
  }
  if (platform === "claude-code") {
    return ["Restart Claude Code in this project", "Approve the project MCP server if Claude Code prompts for trust"];
  }
  if (platform === "cursor") {
    return ["Restart Cursor", "Enable the ai-first MCP server from Cursor MCP settings/tools"];
  }
  return ["Configure a local stdio MCP server with command: af mcp --root <repo>"];
}

function getInstalledMcpConfigs(rootDir: string): string[] {
  return [
    "opencode.jsonc",
    path.join(".opencode", "mcp.json"),
    ".mcp.json",
    path.join(".codex", "config.toml"),
    path.join(".cursor", "mcp.json"),
  ]
    .map(configPath => path.join(rootDir, configPath))
    .filter(configPath => fs.existsSync(configPath));
}

function packageDeclaresBin(packageJsonPath: string): boolean {
  if (!fs.existsSync(packageJsonPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as { bin?: unknown };
    return Boolean(pkg.bin);
  } catch {
    return false;
  }
}
