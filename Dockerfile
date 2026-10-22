FROM python:3.11.9-slim

WORKDIR /app

# Install system dependencies needed for ML packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements first (layer caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir "bcrypt==4.0.1" && \
    pip install --no-cache-dir -r requirements.txt

# Download NLTK data needed by aura_ai_engine
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('averaged_perceptron_tagger'); nltk.download('punkt_tab')"

# Copy application code
COPY backend/ .

# Expose port
EXPOSE 8000

# Start the app
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
