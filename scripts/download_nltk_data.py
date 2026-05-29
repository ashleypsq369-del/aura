"""
Download NLTK Data for Sentiment Analysis
"""

import nltk
import sys

def download_nltk_data():
    """Download required NLTK datasets"""
    datasets = [
        'vader_lexicon',
        'punkt',
        'stopwords',
        'averaged_perceptron_tagger',
        'brown',
        'wordnet'
    ]
    
    print("Downloading NLTK data...")
    for dataset in datasets:
        try:
            print(f"  → Downloading {dataset}...")
            nltk.download(dataset, quiet=True)
            print(f"  ✓ {dataset} downloaded")
        except Exception as e:
            print(f"  ⚠ Warning: Could not download {dataset}: {e}")
    
    print("\n✓ NLTK data download complete!")

if __name__ == "__main__":
    download_nltk_data()
