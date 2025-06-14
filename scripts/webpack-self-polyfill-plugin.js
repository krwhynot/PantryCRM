/**
 * Webpack Plugin to Replace 'self' References in Vendor Bundles
 * Addresses React 19 + Next.js 15 SSR compatibility issues
 */

class SelfPolyfillPlugin {
  constructor(options = {}) {
    this.options = {
      replacement: 'globalThis',
      ...options
    };
  }

  apply(compiler) {
    const { replacement } = this.options;
    
    compiler.hooks.emit.tap('SelfPolyfillPlugin', (compilation) => {
      // Process all chunks
      Object.keys(compilation.assets).forEach(filename => {
        // Focus on server-side vendor bundles
        if (filename.includes('vendors') && filename.endsWith('.js') && filename.includes('server')) {
          const asset = compilation.assets[filename];
          let source = asset.source();
          
          if (typeof source === 'function') {
            source = source();
          }
          
          // Replace problematic self references with globalThis
          let modified = false;
          
          // Pattern 1: (self.webpackChunk_N_E=self.webpackChunk_N_E||[])
          const webpackChunkPattern = /\(self\.webpackChunk_N_E\s*=\s*self\.webpackChunk_N_E\s*\|\|\s*\[\]\)/g;
          if (webpackChunkPattern.test(source)) {
            source = source.replace(webpackChunkPattern, `(${replacement}.webpackChunk_N_E=${replacement}.webpackChunk_N_E||[])`);
            modified = true;
          }
          
          // Pattern 2: self.webpackChunk_N_E.push
          const webpackPushPattern = /self\.webpackChunk_N_E\.push/g;
          if (webpackPushPattern.test(source)) {
            source = source.replace(webpackPushPattern, `${replacement}.webpackChunk_N_E.push`);
            modified = true;
          }
          
          // Pattern 3: Standalone self references (not in comments or strings)
          const standalonePattern = /(?<!\/\/.*|\/\*[\s\S]*?\*\/|["'`][^"'`]*?)(?<!\w)self(?!\w)/g;
          if (standalonePattern.test(source)) {
            source = source.replace(standalonePattern, replacement);
            modified = true;
          }
          
          if (modified) {
            console.log(`✅ SelfPolyfillPlugin: Patched ${filename}`);
            
            // Update the asset
            compilation.assets[filename] = {
              source: () => source,
              size: () => source.length
            };
          }
        }
      });
    });
  }
}

module.exports = SelfPolyfillPlugin;