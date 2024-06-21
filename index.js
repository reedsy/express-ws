/* eslint-disable-next-line no-underscore-dangle */
const _require = require('esm')(module);

module.exports = {
  expressWs: _require('./src/index').default,
  addWsMethod: _require('./src/add-ws-method').default,
};
