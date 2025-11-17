// Polyfill fetch API globals for MSW v2 compatibility
require('whatwg-fetch');

// Polyfill Node.js globals for MSW v2 compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
