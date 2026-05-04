#compdef af

_af() {
  local -a commands
  commands=(
    'init:Generate AI context files'
    'index:Generate SQLite index database'
    'watch:Watch for file changes'
    'context:Generate LLM-optimized context'
    'summarize:Generate hierarchical summaries'
    'query:Query the index'
    'doctor:Check repository health'
    'explore:Explore module dependencies'
    'map:Generate repository map'
    'adapters:List available adapters'
    'git:Show git activity'
    'graph:Build knowledge graph'
    'update:Update context incrementally'
    'history:Context evolution over time'
    'pr-description:Generate PR description'
    'install-hook:Install pre-commit hook'
  )

  _arguments \
    '1: :{_describe command commands}' \
    '*--root[Root directory]:directory:_files -/' \
    '*--output[Output directory]:directory:_files -/' \
    '*--preset[Analysis preset]:(full quick api docs)' \
    '*--diff[Show context diff]' \
    '*--json[JSON output]' \
    '*--watch[Watch mode]' \
    '*--smart[Smart mode for large repos]' \
    '*--help[Show help]'
}

_af
