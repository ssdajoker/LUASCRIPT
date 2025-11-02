#!/usr/bin/env python3
"""
LUASCRIPT IDE Backend Server
Provides compilation API for the revolutionary web interface

Steve Jobs + Donald Knuth Leadership Team
Revolutionary Web IDE Backend - Making mathematical programming beautiful and accessible
"""

import json
import sys
import os
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Add LUASCRIPT compiler to path
current_dir = Path(__file__).parent
luascript_root = current_dir.parent
sys.path.insert(0, str(luascript_root / 'src' / 'lexer'))
sys.path.insert(0, str(luascript_root / 'src' / 'transpiler'))

try:
    from enhanced_lexer import tokenize_source, LexerError
    from enhanced_transpiler import transpile_source, TranspilerError
    
    # Import the main compiler
    sys.path.insert(0, str(luascript_root / 'src'))
    from luascript_compiler import LuascriptCompiler
except ImportError as e:
    print(f"❌ Failed to import LUASCRIPT components: {e}")
    sys.exit(1)

app = Flask(__name__)
CORS(app)  # Enable CORS for web IDE

# Initialize LUASCRIPT compiler
compiler = LuascriptCompiler()

@app.route('/')
def index():
    """Serve the revolutionary IDE interface"""
    return send_from_directory(current_dir, 'index.html')

@app.route('/api/compile', methods=['POST'])
def compile_code():
    """Compile LUASCRIPT code to Lua"""
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'success': False, 'error': 'No code provided'})
        
        code = data['code']
        
        # Create temporary file for compilation
        with tempfile.NamedTemporaryFile(mode='w', suffix='.ls', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Compile using LUASCRIPT compiler
            lua_code = compiler.compile(temp_file, verbose=False)
            
            # Read the generated Lua file
            lua_file = temp_file.replace('.ls', '.lua')
            if os.path.exists(lua_file):
                with open(lua_file, 'r') as f:
                    lua_output = f.read()
                os.unlink(lua_file)  # Clean up
            else:
                lua_output = lua_code
            
            return jsonify({
                'success': True,
                'lua': lua_output,
                'message': 'Compilation successful!'
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'lua': f'-- Compilation Error:\n-- {str(e)}'
            })
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        })

@app.route('/api/examples')
def get_examples():
    """Get example LUASCRIPT programs"""
    examples_dir = luascript_root / 'examples'
    examples = {}
    
    try:
        for example_file in examples_dir.glob('*.ls'):
            name = example_file.stem
            with open(example_file, 'r') as f:
                examples[name] = f.read()
        
        return jsonify({
            'success': True,
            'examples': examples
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'examples': {}
        })

@app.route('/api/status')
def status():
    """API status endpoint"""
    return jsonify({
        'status': 'online',
        'message': 'LUASCRIPT IDE Backend - Mathematical Programming Revolution',
        'version': '1.0.0-revolutionary',
        'features': [
            'Real-time LUASCRIPT compilation',
            'Mathematical Unicode operator support',
            'Template literal transpilation',
            'Object-oriented programming',
            'LuaJIT performance optimization'
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting LUASCRIPT Revolutionary Web IDE Backend...")
    print("📍 IDE Interface: http://localhost:5000")
    print("⚡ Compilation API: http://localhost:5000/api/compile")
    print("🧮 Mathematical programming with Unicode elegance!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
