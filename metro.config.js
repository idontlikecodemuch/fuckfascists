const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const config = getDefaultConfig(__dirname);

function escapedPath(dir) {
  return path.resolve(__dirname, dir).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

config.resolver.blockList = exclusionList([
  new RegExp(`${escapedPath('tools')}\\/.*`),
]);

module.exports = config;
