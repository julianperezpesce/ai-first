export {
  DependencyAnalyzer,
  dependencyAnalyzer,
  type ImportRelation,
  type DependencyGraph,
} from "./dependencyAnalyzer.js";

export {
  CallGraphBuilder,
  callGraphBuilder,
  type Call,
  type CallGraph,
} from "./callGraphBuilder.js";

export {
  InheritanceAnalyzer,
  inheritanceAnalyzer,
  type InheritanceRelation,
  type InheritanceGraph,
} from "./inheritanceAnalyzer.js";

export {
  ArchitectureDetector,
  architectureDetector,
  type ArchitecturePattern,
  type Layer,
  type ArchitectureAnalysis,
} from "./architectureDetector.js";
