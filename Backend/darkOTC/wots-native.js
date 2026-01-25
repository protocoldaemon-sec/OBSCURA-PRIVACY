/**
 * WOTS Native Wrapper
 * 
 * This is a JavaScript (not TypeScript) file that can directly require
 * the mochimo-wots-v2 ES Module using Node.js native capabilities.
 * 
 * We use .js extension and dynamic import to bypass CommonJS restrictions.
 */

let wotsCache = null;

async function loadWOTS() {
  if (wotsCache) {
    return wotsCache;
  }
  
  // Use native import() which works in .js files
  const module = await import('mochimo-wots-v2');
  
  console.log('[WOTS Native] Module keys:', Object.keys(module));
  console.log('[WOTS Native] Has WOTS:', !!module.WOTS);
  
  wotsCache = module.WOTS;
  
  if (!wotsCache) {
    throw new Error('WOTS not found in module');
  }
  
  console.log('[WOTS Native] WOTS keys:', Object.keys(wotsCache));
  console.log('[WOTS Native] wots_pk_from_sig type:', typeof wotsCache.wots_pk_from_sig);
  
  if (typeof wotsCache.wots_pk_from_sig !== 'function') {
    throw new Error('WOTS.wots_pk_from_sig not found');
  }
  
  return wotsCache;
}

module.exports = { loadWOTS };
