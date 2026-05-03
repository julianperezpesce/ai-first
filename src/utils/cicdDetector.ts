import fs from "fs";
import path from "path";

export interface CICDConfig {
  platform: string | null;
  workflows: Workflow[];
  hasCI: boolean;
  hasCD: boolean;
  summary: string;
}

export interface Workflow {
  name: string;
  file: string;
  triggers: string[];
  jobs: string[];
}

export function detectCICD(rootDir: string): CICDConfig {
  const result: CICDConfig = {
    platform: null,
    workflows: [],
    hasCI: false,
    hasCD: false,
    summary: "",
  };

  const githubDir = path.join(rootDir, ".github", "workflows");
  if (fs.existsSync(githubDir)) {
    result.platform = "GitHub Actions";
    const files = fs.readdirSync(githubDir).filter(f => f.endsWith(".yml") || f.endsWith(".yaml"));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(githubDir, file), "utf-8");
        const workflow = parseGitHubWorkflow(file, content);
        result.workflows.push(workflow);
        
        if (workflow.triggers.includes("push") || workflow.triggers.includes("pull_request")) {
          result.hasCI = true;
        }
        if (workflow.triggers.includes("release") || content.includes("deploy")) {
          result.hasCD = true;
        }
      } catch {}
    }
  }

  const gitlabPath = path.join(rootDir, ".gitlab-ci.yml");
  if (fs.existsSync(gitlabPath)) {
    result.platform = "GitLab CI";
    try {
      const content = fs.readFileSync(gitlabPath, "utf-8");
      result.workflows.push({
        name: "GitLab CI",
        file: ".gitlab-ci.yml",
        triggers: ["push", "merge_request"],
        jobs: extractGitLabJobs(content),
      });
      result.hasCI = true;
    } catch {}
  }

  const jenkinsPath = path.join(rootDir, "Jenkinsfile");
  if (fs.existsSync(jenkinsPath)) {
    result.platform = "Jenkins";
    result.workflows.push({
      name: "Jenkins Pipeline",
      file: "Jenkinsfile",
      triggers: ["push"],
      jobs: ["build", "test"],
    });
    result.hasCI = true;
  }

  const circlePath = path.join(rootDir, ".circleci", "config.yml");
  if (fs.existsSync(circlePath)) {
    result.platform = "CircleCI";
    result.workflows.push({
      name: "CircleCI",
      file: ".circleci/config.yml",
      triggers: ["push"],
      jobs: ["build", "test"],
    });
    result.hasCI = true;
  }

  const azurePath = path.join(rootDir, "azure-pipelines.yml");
  if (fs.existsSync(azurePath)) {
    result.platform = "Azure Pipelines";
    result.workflows.push({
      name: "Azure Pipeline",
      file: "azure-pipelines.yml",
      triggers: ["push"],
      jobs: ["build", "test"],
    });
    result.hasCI = true;
  }

  if (result.workflows.length === 0) {
    const packageJsonPath = path.join(rootDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (pkg.scripts?.test || pkg.scripts?.build) {
          result.summary = "No CI/CD detected, but project has build/test scripts";
        }
      } catch {}
    }
  }

  if (result.workflows.length > 0) {
    result.summary = `${result.platform}: ${result.workflows.length} workflow(s), CI=${result.hasCI}, CD=${result.hasCD}`;
  } else if (!result.summary) {
    result.summary = "No CI/CD pipeline detected";
  }

  return result;
}

function parseGitHubWorkflow(filename: string, content: string): Workflow {
  const workflow: Workflow = {
    name: filename.replace(/\.ya?ml$/, ""),
    file: `.github/workflows/${filename}`,
    triggers: [],
    jobs: [],
  };

  const onMatch = content.match(/^on:\s*\n((?:\s+.+\n)*)/m);
  if (onMatch) {
    const triggersBlock = onMatch[1];
    if (triggersBlock.includes("push:")) workflow.triggers.push("push");
    if (triggersBlock.includes("pull_request:")) workflow.triggers.push("pull_request");
    if (triggersBlock.includes("release:")) workflow.triggers.push("release");
    if (triggersBlock.includes("schedule:")) workflow.triggers.push("schedule");
    if (triggersBlock.includes("workflow_dispatch:")) workflow.triggers.push("manual");
  }

  const jobsMatch = content.match(/^jobs:\s*\n((?:\s+\w+:.*\n)*)/m);
  if (jobsMatch) {
    const jobsBlock = jobsMatch[1];
    const jobNames = jobsBlock.match(/^\s+(\w+):/gm);
    if (jobNames) {
      workflow.jobs = jobNames.map(j => j.trim().replace(":", ""));
    }
  }

  return workflow;
}

function extractGitLabJobs(content: string): string[] {
  const jobs: string[] = [];
  const jobMatches = content.match(/^(\w+):\s*$/gm);
  if (jobMatches) {
    for (const match of jobMatches) {
      const jobName = match.replace(":", "").trim();
      if (!["stages", "variables", "image", "services", "before_script", "after_script", "cache"].includes(jobName)) {
        jobs.push(jobName);
      }
    }
  }
  return jobs;
}
