const { migrateProject } = require('./migrate');
const { validateProjectDocument } = require('./validate');
const { SCHEMA_VERSION, DEFAULT_PROJECT } = require('./schema');

function loadProjectDocument(raw) {
  const migrated = migrateProject(raw);
  const validation = validateProjectDocument(migrated);
  if (!validation.valid) {
    const details = validation.errors.join('\n- ');
    throw new Error(`Invalid project document:\n- ${details}`);
  }
  return migrated;
}

function createProjectDocumentFromGraph({ nodes = [], wires = [], project = {}, meta = {} }) {
  const now = new Date().toISOString();
  const doc = {
    schemaVersion: SCHEMA_VERSION,
    project: {
      ...DEFAULT_PROJECT,
      ...project
    },
    graph: {
      nodes,
      wires
    },
    meta: {
      createdAt: meta.createdAt || now,
      updatedAt: now
    }
  };

  const validation = validateProjectDocument(doc);
  if (!validation.valid) {
    const details = validation.errors.join('\n- ');
    throw new Error(`Cannot save invalid project:\n- ${details}`);
  }

  return doc;
}

module.exports = {
  loadProjectDocument,
  createProjectDocumentFromGraph
};
