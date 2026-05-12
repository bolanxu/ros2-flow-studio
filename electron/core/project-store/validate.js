function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function validatePort(port, path, errors) {
  if (!isObject(port)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof port.id !== 'string' || !port.id.trim()) errors.push(`${path}.id must be a non-empty string`);
  if (typeof port.label !== 'string') errors.push(`${path}.label must be a string`);
  if (typeof port.type !== 'string' || !port.type.trim()) errors.push(`${path}.type must be a non-empty string`);
}

function validateNode(node, idx, errors) {
  const path = `graph.nodes[${idx}]`;
  if (!isObject(node)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (typeof node.id !== 'string' || !node.id.trim()) errors.push(`${path}.id must be a non-empty string`);
  if (typeof node.type !== 'string' || !node.type.trim()) errors.push(`${path}.type must be a non-empty string`);
  if (typeof node.label !== 'string' || !node.label.trim()) errors.push(`${path}.label must be a non-empty string`);
  if (typeof node.x !== 'number' || Number.isNaN(node.x)) errors.push(`${path}.x must be a number`);
  if (typeof node.y !== 'number' || Number.isNaN(node.y)) errors.push(`${path}.y must be a number`);

  const inPorts = node.ports?.in || [];
  const outPorts = node.ports?.out || [];
  if (!Array.isArray(inPorts)) errors.push(`${path}.ports.in must be an array`);
  if (!Array.isArray(outPorts)) errors.push(`${path}.ports.out must be an array`);
  if (Array.isArray(inPorts)) inPorts.forEach((p, i) => validatePort(p, `${path}.ports.in[${i}]`, errors));
  if (Array.isArray(outPorts)) outPorts.forEach((p, i) => validatePort(p, `${path}.ports.out[${i}]`, errors));

  if (!Array.isArray(node.params)) {
    errors.push(`${path}.params must be an array`);
  }
}

function validateWire(wire, idx, errors) {
  const path = `graph.wires[${idx}]`;
  if (!isObject(wire)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const required = ['id', 'fromNode', 'fromPort', 'toNode', 'toPort', 'type'];
  required.forEach((k) => {
    if (typeof wire[k] !== 'string' || !wire[k].trim()) {
      errors.push(`${path}.${k} must be a non-empty string`);
    }
  });
}

function validateProjectDocument(doc) {
  const errors = [];

  if (!isObject(doc)) {
    return { valid: false, errors: ['Project must be an object'] };
  }

  if (typeof doc.schemaVersion !== 'number') errors.push('schemaVersion must be a number');

  if (!isObject(doc.project)) {
    errors.push('project must be an object');
  } else {
    if (typeof doc.project.name !== 'string' || !doc.project.name.trim()) errors.push('project.name must be a non-empty string');
    if (typeof doc.project.rosDistro !== 'string' || !doc.project.rosDistro.trim()) errors.push('project.rosDistro must be a non-empty string');
    if (!['launch', 'run'].includes(doc.project.runMode)) errors.push("project.runMode must be 'launch' or 'run'");
  }

  if (!isObject(doc.graph)) {
    errors.push('graph must be an object');
  } else {
    if (!Array.isArray(doc.graph.nodes)) errors.push('graph.nodes must be an array');
    if (!Array.isArray(doc.graph.wires)) errors.push('graph.wires must be an array');
    if (Array.isArray(doc.graph.nodes)) doc.graph.nodes.forEach((node, idx) => validateNode(node, idx, errors));
    if (Array.isArray(doc.graph.wires)) doc.graph.wires.forEach((wire, idx) => validateWire(wire, idx, errors));
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateProjectDocument
};
