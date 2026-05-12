const { SCHEMA_VERSION, DEFAULT_PROJECT } = require('./schema');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeLegacyProject(input) {
  const data = input && typeof input === 'object' ? input : {};
  return {
    schemaVersion: SCHEMA_VERSION,
    project: {
      ...clone(DEFAULT_PROJECT),
      name: data.meta?.name || DEFAULT_PROJECT.name
    },
    graph: {
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      wires: Array.isArray(data.wires) ? data.wires : []
    },
    meta: {
      createdAt: data.meta?.created || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}

function migrateProject(input) {
  if (!input || typeof input !== 'object') {
    return normalizeLegacyProject({});
  }

  if (!input.schemaVersion) {
    return normalizeLegacyProject(input);
  }

  if (input.schemaVersion === SCHEMA_VERSION) {
    return {
      ...input,
      project: {
        ...clone(DEFAULT_PROJECT),
        ...(input.project || {})
      },
      graph: {
        nodes: Array.isArray(input.graph?.nodes) ? input.graph.nodes : [],
        wires: Array.isArray(input.graph?.wires) ? input.graph.wires : []
      },
      meta: {
        createdAt: input.meta?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  throw new Error(`Unsupported project schema version: ${input.schemaVersion}`);
}

module.exports = {
  migrateProject
};
