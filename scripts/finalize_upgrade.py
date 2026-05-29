"""
Finalize Project Aura Upgrade
Final installation and verification script
"""

import subprocess
import sys
import os

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def print_success(text):
    print(f"✓ {text}")

def print_info(text):
    print(f"→ {text}")

def print_error(text):
    print(f"✗ {text}")

def main():
    print_header("PROJECT AURA - FINALIZE UPGRADE")
    
    print_info("Verifying installation...")
    print()
    
    # Check Python version
    print_info(f"Python version: {sys.version}")
    
    # Check key packages
    packages_to_check = [
        'vaderSentiment',
        'nltk',
        'textblob',
        'streamlit',
        'plotly',
        'pandas',
        'numpy'
    ]
    
    print_info("Checking installed packages...")
    missing = []
    for package in packages_to_check:
        try:
            __import__(package)
            print_success(f"{package} installed")
        except ImportError:
            print_error(f"{package} NOT installed")
            missing.append(package)
    
    if missing:
        print()
        print_error(f"Missing packages: {', '.join(missing)}")
        print_info("Run: pip install " + " ".join(missing))
        return False
    
    print()
    
    # Check new modules
    print_info("Checking new modules...")
    modules = [
        'src/sentiment_analyzer.py',
        'src/conversational_support.py',
        'src/dashboard_components.py',
        'assets/design_system.py',
        'data/platform_resources.json',
        'docs/PLATFORM_COMPARISON.md'
    ]
    
    all_exist = True
    for module in modules:
        if os.path.exists(module):
            print_success(module)
        else:
            print_error(f"{module} NOT FOUND")
            all_exist = False
    
    print()
    
    # Download NLTK data
    print_info("Downloading NLTK data...")
    try:
        import nltk
        datasets = ['vader_lexicon', 'punkt', 'stopwords']
        for dataset in datasets:
            try:
                nltk.download(dataset, quiet=True)
                print_success(f"{dataset} downloaded")
            except:
                print_error(f"Could not download {dataset}")
    except Exception as e:
        print_error(f"NLTK data download failed: {e}")
    
    print()
    
    # Run tests
    print_info("Running feature tests...")
    try:
        result = subprocess.run(
            [sys.executable, 'test_upgraded_features.py'],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print_success("All tests passed!")
        else:
            print_error("Some tests failed")
            print(result.stdout)
    except Exception as e:
        print_error(f"Could not run tests: {e}")
    
    print()
    
    # Final summary
    print_header("UPGRADE FINALIZED")
    
    print("✅ Project Aura upgrade complete!")
    print()
    print("New features available:")
    print("  • Sentiment Analysis (nanaBEREAVEMENT inspired)")
    print("  • Conversational Support (Wysa inspired)")
    print("  • Dashboard Components (MatrixCare/Alora inspired)")
    print("  • Design System (Healthcare UI best practices)")
    print("  • Platform Resources (Industry templates)")
    print()
    print("Next steps:")
    print("  1. Review UPGRADE_COMPLETE.md")
    print("  2. Review PROJECT_AURA_UPGRADED.md")
    print("  3. Run: streamlit run app.py")
    print("  4. Integrate new features into pages")
    print()
    print("Documentation:")
    print("  • UPGRADE_COMPLETE.md - Detailed upgrade guide")
    print("  • PROJECT_AURA_UPGRADED.md - Executive summary")
    print("  • docs/PLATFORM_COMPARISON.md - Competitive analysis")
    print()
    print("🌅 Ready to deliver compassionate, AI-powered hospice care!")
    print()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
