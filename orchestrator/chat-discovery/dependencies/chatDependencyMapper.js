const fs = require('fs');
const path = require('path');

function mapArtifactDependencies(artifact) {
  const content = artifact.content || '';
  const dependencies = [];

  if (content.includes('orchestrator_runtime_infrastructure_v1')) {
    dependencies.push('orchestrator_runtime_infrastructure_v1');
  }
  if (content.includes('memory_governance_core_v1')) {
    dependencies.push('memory_governance_core_v1');
  }

  return {
    artifact_id: artifact.artifact_id,
    blocks: [],
    blocked_by: dependencies,
    validation_dependencies: dependencies.filter(d => d.includes('validation')),
    replay_dependencies: dependencies.filter(d => d.includes('replay')),
    codex_dependencies: dependencies.filter(d => d.includes('codex'))
  };
}

function updateDependencyGraph(rootPath, artifact) {
  const graphPath = path.join(rootPath, 'orchestrator', 'registry', 'dependencyGraph.json');
  let graph = {};
  if (fs.existsSync(graphPath)) {
    graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  }
  graph[artifact.artifact_id] = mapArtifactDependencies(artifact);
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));
}

function evaluateBlockedSystems(artifact) {
  const deps = mapArtifactDependencies(artifact);
  const incompleteDeps = deps.blocked_by.filter(d => !isComplete(d));
  if (incompleteDeps.length > 0 || !artifact.artifact_id || !artifact.content) {
    return ['dependent_systems'];
  }
  return [];
}

function isComplete(dep) {
  return false; // assume external dependencies are incomplete until proven otherwise
}

module.exports = {
  mapArtifactDependencies,
  updateDependencyGraph,
  evaluateBlockedSystems
};