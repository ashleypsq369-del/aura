"""Recover llm_chatbot.py source using pydoc + inspect approach"""
import sys, marshal, importlib.util
from pathlib import Path

pyc_path = Path("routers/__pycache__/llm_chatbot.cpython-311.pyc")

# Load the module from pyc directly
spec = importlib.util.spec_from_file_location("llm_chatbot", pyc_path)
mod = importlib.util.module_from_spec(spec)

# Add parent to path
sys.path.insert(0, ".")
try:
    spec.loader.exec_module(mod)
    print("Module loaded from pyc!")
    print("Attributes:", [a for a in dir(mod) if not a.startswith('_')])
    
    # Get the source
    import inspect
    try:
        src = inspect.getsource(mod)
        Path("routers/llm_chatbot_recovered.py").write_text(src, encoding='utf-8')
        print("Source recovered!")
    except Exception as e:
        print("inspect.getsource failed:", e)
        
except Exception as e:
    print("Module load failed:", e)
