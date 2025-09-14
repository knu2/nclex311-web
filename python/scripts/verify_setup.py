#!/usr/bin/env python3
"""
Verify Python setup and dependencies for NCLEX 311 data processing.

This script checks that all required dependencies are installed and
that paths are configured correctly.
"""

import os
import sys
from pathlib import Path

def check_dependencies():
    """Check if all required dependencies are available."""
    print("🔍 Checking Python dependencies...")
    
    dependencies = {
        'fitz': 'pymupdf',
        'cv2': 'opencv-python', 
        'PIL': 'pillow',
        'pdf2image': 'pdf2image',
        'pytesseract': 'pytesseract',
        'numpy': 'numpy'
    }
    
    missing = []
    for module, package in dependencies.items():
        try:
            __import__(module)
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package} (missing)")
            missing.append(package)
    
    if missing:
        print(f"\n❌ Missing dependencies: {', '.join(missing)}")
        print("   Run: uv sync")
        return False
    else:
        print("✅ All dependencies available")
        return True

def check_system_dependencies():
    """Check system-level dependencies."""
    print("\n🔍 Checking system dependencies...")
    
    # Check for poppler (pdf2image)
    try:
        import subprocess
        result = subprocess.run(['pdftoppm', '-h'], capture_output=True)
        if result.returncode == 0:
            print("  ✅ Poppler (pdftoppm available)")
        else:
            print("  ❌ Poppler (install with: brew install poppler)")
            return False
    except FileNotFoundError:
        print("  ❌ Poppler (install with: brew install poppler)")
        return False
    
    # Check for tesseract
    try:
        result = subprocess.run(['tesseract', '--version'], capture_output=True)
        if result.returncode == 0:
            print("  ✅ Tesseract OCR")
        else:
            print("  ❌ Tesseract OCR (install with: brew install tesseract)")
            return False
    except FileNotFoundError:
        print("  ❌ Tesseract OCR (install with: brew install tesseract)")
        return False
    
    print("✅ All system dependencies available")
    return True

def check_file_structure():
    """Check that the file structure is correct."""
    print("\n🔍 Checking file structure...")
    
    base_dir = Path(__file__).parent.parent
    
    required_dirs = [
        'scripts',
        'data', 
        'docs',
        '../shared/pdfs'
    ]
    
    required_files = [
        'pyproject.toml',
        'uv.lock',
        'scripts/extract_images_comprehensive.py',
        'scripts/analyze_extracted_images.py'
    ]
    
    # Check directories
    for dir_path in required_dirs:
        full_path = base_dir / dir_path
        if full_path.exists():
            print(f"  ✅ {dir_path}/")
        else:
            print(f"  ❌ {dir_path}/ (missing)")
            return False
    
    # Check files
    for file_path in required_files:
        full_path = base_dir / file_path
        if full_path.exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} (missing)")
            return False
    
    print("✅ File structure correct")
    return True

def check_pdf_availability():
    """Check if the PDF file is available."""
    print("\n🔍 Checking PDF availability...")
    
    base_dir = Path(__file__).parent.parent
    pdf_path = base_dir / "../shared/pdfs/NCLEX 311 - 20240731.pdf"
    
    if pdf_path.exists():
        print(f"  ✅ PDF found: {pdf_path}")
        print(f"     Size: {pdf_path.stat().st_size / (1024*1024):.1f} MB")
        return True
    else:
        print(f"  ❌ PDF not found: {pdf_path}")
        print("     Place the PDF file in shared/pdfs/")
        return False

def main():
    """Run all verification checks."""
    print("="*60)
    print("NCLEX 311 Python Setup Verification")
    print("="*60)
    
    checks = [
        check_file_structure(),
        check_dependencies(),
        check_system_dependencies(), 
        check_pdf_availability()
    ]
    
    print("\n" + "="*60)
    if all(checks):
        print("🎉 Setup verification PASSED!")
        print("   You can now run the extraction scripts.")
        print("\n📝 Quick start:")
        print("   cd python")
        print("   uv run python scripts/extract_images_comprehensive.py --pages 89-92")
        return 0
    else:
        print("❌ Setup verification FAILED!")
        print("   Please fix the issues above and try again.")
        return 1

if __name__ == "__main__":
    exit(main())