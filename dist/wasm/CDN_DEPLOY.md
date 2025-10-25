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
