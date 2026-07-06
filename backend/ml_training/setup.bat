@echo off
REM ML Training Setup Script for Windows
REM Installs dependencies and runs initial training

echo ========================================
echo ProjectAura ML Training Setup
echo ========================================
echo.

REM Check Python version
python --version
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo Step 1: Installing Python dependencies...
echo ========================================
pip install -r requirements.txt

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Creating directories...
echo ========================================
if not exist "data" mkdir data
if not exist "models" mkdir models
if not exist "logs" mkdir logs
if not exist "medical_knowledge" mkdir medical_knowledge

echo.
echo Step 3: Testing installation...
echo ========================================
python -c "import xgboost; import shap; import pandas; print('✅ All dependencies installed successfully!')"

if errorlevel 1 (
    echo ERROR: Dependency test failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start training:
echo   python train_all.py
echo.
echo To train a specific task:
echo   python model_trainer.py --task vital_risk
echo.
echo To download data only:
echo   python data_downloader.py
echo.
pause
