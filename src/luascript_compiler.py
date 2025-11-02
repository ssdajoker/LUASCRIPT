#!/usr/bin/env python3
"""
LUASCRIPT Main Compiler  
Integrates enhanced lexer + transpiler + runtime for complete mathematical programming

Steve Jobs + Donald Knuth Leadership Team
Priority: CRITICAL - The complete working system that proves our vision
"""

import sys
import os
import argparse
import subprocess
from pathlib import Path

# Add paths for our enhanced components
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir / 'lexer'))
sys.path.insert(0, str(current_dir / 'transpiler'))

try:
    from enhanced_lexer import tokenize_source, LexerError
    from enhanced_transpiler import transpile_source, TranspilerError
except ImportError as e:
    print(f"❌ Failed to import LUASCRIPT components: {e}")
    print("Make sure enhanced_lexer.py and enhanced_transpiler.py are in the correct directories")
    sys.exit(1)

class LuascriptError(Exception):
    pass

class LuascriptCompiler:
    """Complete LUASCRIPT compiler with mathematical programming support"""
    
    def __init__(self):
        self.runtime_path = current_dir.parent / 'runtime' / 'core' / 'enhanced_runtime.lua'
        
    def compile(self, source_path: str, output_path: str = None, verbose: bool = False) -> str:
        """Compile LUASCRIPT source to optimized Lua"""
        try:
            # Read source code
            if verbose:
                print(f"📖 Reading LUASCRIPT source: {source_path}")
                
            with open(source_path, 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Transpile to Lua
            if verbose:
                print("🔄 Transpiling with mathematical Unicode support...")
                
            lua_code = transpile_source(source_code, source_path)
            
            # Determine output path
            if output_path is None:
                source_file = Path(source_path)
                output_path = source_file.with_suffix('.lua')
            
            # Write Lua output
            if verbose:
                print(f"✍️  Writing compiled Lua: {output_path}")
                
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(lua_code)
            
            if verbose:
                print("✅ Compilation successful!")
                print(f"📊 Source: {len(source_code)} chars → Lua: {len(lua_code)} chars")
                
            return str(output_path)
            
        except FileNotFoundError:
            raise LuascriptError(f"Source file not found: {source_path}")
        except (LexerError, TranspilerError) as e:
            raise LuascriptError(f"Compilation failed: {e}")
        except Exception as e:
            raise LuascriptError(f"Unexpected compilation error: {e}")
    
    def run(self, source_path: str, verbose: bool = False) -> None:
        """Compile and run LUASCRIPT source"""
        try:
            # Compile source
            lua_path = self.compile(source_path, verbose=verbose)
            
            if verbose:
                print(f"🚀 Running compiled Lua: {lua_path}")
            
            # Check if runtime library exists
            if not self.runtime_path.exists():
                raise LuascriptError(f"Runtime library not found: {self.runtime_path}")
            
            # Try to run with LuaJIT first, then Lua
            lua_commands = ['luajit', 'lua']
            
            for lua_cmd in lua_commands:
                try:
                    # Set up Lua path to include our runtime
                    env = os.environ.copy()
                    runtime_dir = str(self.runtime_path.parent.parent)
                    
                    if 'LUA_PATH' in env:
                        env['LUA_PATH'] = f"{runtime_dir}/?.lua;{env['LUA_PATH']}"
                    else:
                        env['LUA_PATH'] = f"{runtime_dir}/?.lua;;"
                    
                    if verbose:
                        print(f"🔧 Trying {lua_cmd} with runtime path: {runtime_dir}")
                    
                    # Run the compiled Lua code
                    result = subprocess.run(
                        [lua_cmd, lua_path], 
                        env=env,
                        capture_output=not verbose,
                        text=True,
                        check=True
                    )
                    
                    if not verbose and result.stdout:
                        print(result.stdout)
                    
                    return
                    
                except (FileNotFoundError, subprocess.CalledProcessError) as e:
                    if lua_cmd == lua_commands[-1]:  # Last attempt
                        raise LuascriptError(f"Failed to run with any Lua interpreter: {e}")
                    continue
                    
        except LuascriptError:
            raise
        except Exception as e:
            raise LuascriptError(f"Runtime error: {e}")
    
    def show_tokens(self, source_path: str) -> None:
        """Debug: Show tokenized output"""
        try:
            with open(source_path, 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            tokens = tokenize_source(source_code, source_path)
            
            print(f"📊 Tokenization of {source_path}:")
            print(f"Found {len(tokens)} tokens\n")
            
            # Group tokens by type for better display
            math_tokens = []
            regular_tokens = []
            
            for token in tokens:
                if token.unicode_name or 'MATH' in token.type.name:
                    math_tokens.append(token)
                else:
                    regular_tokens.append(token)
            
            if math_tokens:
                print(f"📐 Mathematical tokens ({len(math_tokens)}):")
                for token in math_tokens:
                    name = token.unicode_name or token.type.name
                    print(f"  {token.value:>3} → {token.type.name:<20} ({name})")
                print()
            
            print(f"⚙️  Regular tokens ({len(regular_tokens)}):")
            for i, token in enumerate(regular_tokens[:20]):  # Show first 20
                print(f"  {token.value:<15} → {token.type.name}")
            
            if len(regular_tokens) > 20:
                print(f"  ... and {len(regular_tokens) - 20} more")
                
        except Exception as e:
            raise LuascriptError(f"Tokenization failed: {e}")
    
    def benchmark(self, source_path: str, iterations: int = 100) -> None:
        """Run performance benchmark"""
        import time
        
        print(f"🏁 Running LUASCRIPT benchmark: {iterations} iterations")
        print(f"📁 Source: {source_path}")
        
        start_time = time.time()
        
        for i in range(iterations):
            try:
                lua_path = self.compile(source_path)
                
                # Run without output
                subprocess.run(['luajit', lua_path], 
                             capture_output=True, check=True)
            except subprocess.CalledProcessError:
                try:
                    subprocess.run(['lua', lua_path], 
                                 capture_output=True, check=True)
                except subprocess.CalledProcessError as e:
                    print(f"❌ Benchmark failed at iteration {i+1}: {e}")
                    return
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / iterations
        
        print(f"✅ Benchmark complete!")
        print(f"📊 Total time: {total_time:.4f}s")
        print(f"⚡ Average per run: {avg_time*1000:.2f}ms")
        print(f"🚀 Throughput: {iterations/total_time:.1f} compilations/second")

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="LUASCRIPT - Mathematical Programming Language",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  luascript compile mathematical_showcase.ls    # Compile to Lua
  luascript run mathematical_showcase.ls        # Compile and run  
  luascript tokens mathematical_showcase.ls     # Show tokenization
  luascript benchmark mathematical_showcase.ls  # Performance test
  
LUASCRIPT delivers mathematical programming with Unicode operators,
array methods, SIMD performance, and AI/ML computational alternatives.
        """
    )
    
    parser.add_argument('--version', action='version', 
                       version='LUASCRIPT 2.0 - Mathematical Programming Revolution')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Verbose output')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Compile command
    compile_parser = subparsers.add_parser('compile', help='Compile LUASCRIPT to Lua')
    compile_parser.add_argument('source', help='LUASCRIPT source file (.ls)')
    compile_parser.add_argument('-o', '--output', help='Output Lua file')
    
    # Run command
    run_parser = subparsers.add_parser('run', help='Compile and run LUASCRIPT')
    run_parser.add_argument('source', help='LUASCRIPT source file (.ls)')
    
    # Tokens command (debug)
    tokens_parser = subparsers.add_parser('tokens', help='Show tokenization (debug)')
    tokens_parser.add_argument('source', help='LUASCRIPT source file (.ls)')
    
    # Benchmark command
    benchmark_parser = subparsers.add_parser('benchmark', help='Performance benchmark')
    benchmark_parser.add_argument('source', help='LUASCRIPT source file (.ls)')
    benchmark_parser.add_argument('-n', '--iterations', type=int, default=100,
                                 help='Number of iterations (default: 100)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    compiler = LuascriptCompiler()
    
    try:
        if args.command == 'compile':
            output_path = compiler.compile(args.source, args.output, args.verbose)
            if not args.verbose:
                print(f"✅ Compiled: {args.source} → {output_path}")
                
        elif args.command == 'run':
            compiler.run(args.source, args.verbose)
            
        elif args.command == 'tokens':
            compiler.show_tokens(args.source)
            
        elif args.command == 'benchmark':
            compiler.benchmark(args.source, args.iterations)
            
    except LuascriptError as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⏹️  Interrupted")
        sys.exit(1)

if __name__ == "__main__":
    main()
