"""Recover llm_chatbot.py from compiled .pyc bytecode"""
import dis, marshal, struct, sys
from pathlib import Path

pyc = Path("routers/__pycache__/llm_chatbot.cpython-311.pyc")

with open(pyc, "rb") as f:
    magic = f.read(16)  # magic + flags + timestamp + source size
    code = marshal.loads(f.read())

# Try decompilation with uncompyle6 or decompile3 if available
try:
    import uncompyle6
    print("Using uncompyle6...")
    import io
    out = io.StringIO()
    uncompyle6.decompile_file(str(pyc), out)
    src = out.getvalue()
    Path("routers/llm_chatbot.py").write_text(src, encoding="utf-8")
    print("Recovered with uncompyle6")
except ImportError:
    try:
        import decompile
        print("Using decompile...")
    except ImportError:
        # Fallback: use dis to get the constants/names and rebuild from structure
        print("No decompiler available - trying pycdc via subprocess")
        import subprocess, os
        # Check if pycdc exists
        result = subprocess.run(["pycdc", str(pyc)], capture_output=True, text=True)
        if result.returncode == 0:
            Path("routers/llm_chatbot.py").write_text(result.stdout, encoding="utf-8")
            print("Recovered with pycdc")
        else:
            print("pycdc not available:", result.stderr[:100])
            print("Trying decompileall...")
            result2 = subprocess.run(
                [sys.executable, "-m", "py_compile", "--help"],
                capture_output=True
            )
            print("Manual recovery needed")
            # At minimum, extract all string constants to understand structure
            strings = []
            def extract_strings(code_obj):
                for const in code_obj.co_consts:
                    if isinstance(const, str) and len(const) > 10:
                        strings.append(const[:80])
                    if hasattr(const, 'co_consts'):
                        extract_strings(const)
            extract_strings(code)
            print(f"Found {len(strings)} string constants")
            for s in strings[:20]:
                print(f"  {repr(s)}")
