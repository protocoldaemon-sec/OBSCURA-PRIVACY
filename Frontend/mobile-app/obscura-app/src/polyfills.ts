/**
 * Polyfills for React Native crypto and web3 libraries
 */

import 'react-native-get-random-values';

// Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// TextEncoder/TextDecoder polyfill
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
