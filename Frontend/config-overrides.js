const path = require("path");

module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    bs58: path.resolve(__dirname, "src/shims/bs58.js"),
  };

  return config;
};
