#!/usr/bin/env python3
"""
Script to install required dependencies for SageMaker training
"""
import subprocess
import sys
import os

def install_dependencies():
    """Install required packages from requirements.txt"""
    try:
        print("Installing required dependencies...")
        
        # Install packages from requirements.txt
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        
        print("Dependencies installed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Failed to install dependencies: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error installing dependencies: {e}")
        return False

if __name__ == "__main__":
    success = install_dependencies()
    if not success:
        sys.exit(1) 