#!/bin/bash
# WASM Backend Build Script for LUASCRIPT v1.0.0

echo "=================================="
echo "  Building WASM Backend v1.0.0"
echo "=================================="

# Create output directory
mkdir -p dist/wasm

# Bundle the WASM backend with dependencies
echo "Bundling WASM backend..."
node -e "
const fs = require('fs');
const wasmBackend = fs.readFileSync('src/wasm_backend.js', 'utf8');
const phase8 = fs.readFileSync('src/phase8_complete.js', 'utf8');

// Create standalone WASM module
const bundle = \`
// LUASCRIPT WASM Backend v1.0.0
// Generated: \${new Date().toISOString()}

${wasmBackend}

${phase8}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WASMBackend };
}
if (typeof window !== 'undefined') {
  window.LuaScriptWASM = { WASMBackend };
}
\`;

fs.writeFileSync('dist/wasm/luascript-wasm.js', bundle);
console.log('✅ WASM bundle created: dist/wasm/luascript-wasm.js');
"

# Create minified version
echo "Creating minified version..."
node -e "
const fs = require('fs');
const bundle = fs.readFileSync('dist/wasm/luascript-wasm.js', 'utf8');
// Simple minification (remove comments and extra whitespace)
const minified = bundle
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*/g, '')
  .replace(/\s+/g, ' ')
  .trim();
fs.writeFileSync('dist/wasm/luascript-wasm.min.js', minified);
console.log('✅ Minified bundle created: dist/wasm/luascript-wasm.min.js');
"

# Create loader HTML
cat > dist/wasm/loader.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <title>LUASCRIPT WASM Loader</title>
    <script src="luascript-wasm.min.js"></script>
</head>
<body>
    <h1>LUASCRIPT WASM Backend v1.0.0</h1>
    <p>WASM backend loaded and ready!</p>
    <script>
        console.log('LUASCRIPT WASM:', window.LuaScriptWASM);
    </script>
</body>
</html>
HTMLEOF

echo "✅ Loader HTML created: dist/wasm/loader.html"

# Generate CDN deployment info
cat > dist/wasm/CDN_DEPLOY.md << 'MDEOF'
# LUASCRIPT WASM CDN Deployment

## Files Ready for CDN:
- `luascript-wasm.js` - Full bundle with source maps
- `luascript-wasm.min.js` - Minified production bundle
- `loader.html` - Example loader page

## CDN URLs (after deployment):
```
https://cdn.example.com/luascript/v1.0.0/luascript-wasm.min.js
```

## Usage:
```html
<script src="https://cdn.example.com/luascript/v1.0.0/luascript-wasm.min.js"></script>
<script>
  const wasm = new window.LuaScriptWASM.WASMBackend();
  // Use WASM backend
</script>
```
MDEOF

echo "✅ CDN deployment guide created"
echo ""
echo "=================================="
echo "  Build Complete!"
echo "=================================="
echo "Output: dist/wasm/"
ls -lh dist/wasm/
