// Polyfill fetch API globals for MSW v2 compatibility
require('whatwg-fetch');

// Polyfill Node.js globals for MSW v2 compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill structuredClone for jsdom environments (available in Node 17+ / V8, but
// jsdom does not expose it on the global object automatically in some Jest setups).
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
