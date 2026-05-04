complete -c af -f

# Commands
complete -c af -a init -d "Generate AI context files"
complete -c af -a index -d "Generate SQLite index"
complete -c af -a watch -d "Watch for file changes"
complete -c af -a context -d "Generate LLM-optimized context"
complete -c af -a doctor -d "Check repository health"
complete -c af -a explore -d "Explore module dependencies"
complete -c af -a map -d "Generate repository map"
complete -c af -a git -d "Show git activity"
complete -c af -a graph -d "Build knowledge graph"
complete -c af -a history -d "Context evolution"
complete -c af -a pr-description -d "Generate PR description"
complete -c af -a install-hook -d "Install pre-commit hook"

# Options
complete -c af -l root -r -d "Root directory"
complete -c af -s r -r -d "Root directory"
complete -c af -l output -r -d "Output directory"
complete -c af -s o -r -d "Output directory"
complete -c af -l preset -x -a "full quick api docs"
complete -c af -l diff -d "Show context diff"
complete -c af -l json -d "JSON output"
complete -c af -l watch -d "Watch mode"
complete -c af -l smart -d "Smart mode"
