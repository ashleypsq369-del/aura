"""Test full FastAPI app startup."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('SECRET_KEY', 'test-key-abc123')

try:
    import main
    print('main.py import OK')
    print('Routes registered:', len(main.app.routes))
except Exception as e:
    print('main.py import FAILED:', e)
    import traceback; traceback.print_exc()
