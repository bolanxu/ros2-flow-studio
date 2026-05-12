const SCHEMA_VERSION = 1;

const DEFAULT_PROJECT = {
  id: 'ros2-flow-project',
  name: 'untitled.ros2flow',
  rosDistro: 'humble',
  runMode: 'launch',
  workspace: {
    mode: 'per-project',
    path: ''
  }
};

module.exports = {
  SCHEMA_VERSION,
  DEFAULT_PROJECT
};
