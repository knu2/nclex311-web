#!/usr/bin/env python3
"""
NCLEX 311 Image Extraction CLI Tool

Extract medical diagrams and illustrations from PDF pages using computer vision.
Handles the side-by-side page layout of the NCLEX 311 book.
"""

import argparse
import json
import sys
import shutil
from pathlib import Path
from typing import Dict, List, Any, Tuple
import os

# Add the parent directory to the path to import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Note: We'll use subprocess to call the existing extraction scripts
# since they are standalone scripts


def parse_page_range(page_range: str) -> List[int]:
    """Parse page range string like '89' or '89-91' into list of integers."""
    if '-' in page_range:
        start, end = map(int, page_range.split('-'))
        return list(range(start, end + 1))
    else:
        return [int(page_range)]


# Removed book page conversion - now using PDF pages directly


def extract_images_from_pdf(pdf_path: str, pdf_pages: List[int], temp_output_dir: str) -> Dict[str, Any]:
    """Extract images from PDF pages using the comprehensive extraction pipeline."""
    
    # Convert to Path objects
    pdf_path = Path(pdf_path)
    temp_output_dir = Path(temp_output_dir)
    
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    # Create temporary extraction directory
    temp_output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Extracting images from PDF pages {pdf_pages}...")
    
    try:
        # Run comprehensive image extraction
        # The extraction script expects page range as command line arguments
        import subprocess
        
        # Convert pages to string format for the extraction script
        # The comprehensive script expects 'start-end' format, so use same page for both
        if len(pdf_pages) == 1:
            page_arg = f"{pdf_pages[0]}-{pdf_pages[0]}"
        else:
            page_arg = f"{min(pdf_pages)}-{max(pdf_pages)}"
        
        # Use the existing comprehensive extraction script
        script_path = Path(__file__).parent / "extract_images_comprehensive.py"
        cmd = [
            sys.executable, str(script_path),
            "--pdf", str(pdf_path),
            "--pages", page_arg,
            "--output", str(temp_output_dir)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"Image extraction failed: {result.stderr}")
        
        print("✓ Image extraction completed")
        
        # Now analyze the extracted images
        print("Analyzing extracted images...")
        
        # Look for the extraction results file for analysis
        results_file = temp_output_dir / "extraction_results.json"
        if results_file.exists():
            # Run image analysis using existing script
            analysis_script_path = Path(__file__).parent / "analyze_extracted_images.py"
            analysis_cmd = [
                sys.executable, str(analysis_script_path),
                "--results", str(results_file)
            ]
            
            analysis_result = subprocess.run(analysis_cmd, capture_output=True, text=True)
            
            if analysis_result.returncode != 0:
                print(f"Warning: Image analysis failed: {analysis_result.stderr}", file=sys.stderr)
            else:
                print("✓ Image analysis completed")
        
        # Collect results
        results = collect_extraction_results(temp_output_dir, pdf_pages)
        
        return results
        
    except Exception as e:
        raise RuntimeError(f"Image extraction pipeline failed: {str(e)}")


def collect_extraction_results(extraction_dir: Path, pdf_pages: List[int]) -> Dict[str, Any]:
    """Collect and organize extraction results."""
    
    results = {
        "extraction_directory": str(extraction_dir),
        "pdf_pages_processed": pdf_pages,
        "extraction_summary": {},
        "images_by_page": {},
        "high_quality_images": [],
        "analysis_results": None
    }
    
    # Check for different extraction methods
    direct_images_dir = extraction_dir / "direct_extraction"
    detected_regions_dir = extraction_dir / "detected_regions"
    page_screenshots_dir = extraction_dir / "page_screenshots"
    filtered_images_dir = extraction_dir / "filtered_images"
    
    # Count images by method
    summary = {}
    
    if direct_images_dir.exists():
        direct_images = list(direct_images_dir.glob("*.png"))
        summary["direct_extraction"] = len(direct_images)
        
        for img_path in direct_images:
            page_num = extract_page_from_filename(img_path.name)
            if page_num:
                if page_num not in results["images_by_page"]:
                    results["images_by_page"][page_num] = []
                results["images_by_page"][page_num].append({
                    "filename": img_path.name,
                    "path": str(img_path),
                    "method": "direct_extraction",
                    "size_bytes": img_path.stat().st_size
                })
    
    if detected_regions_dir.exists():
        detected_images = list(detected_regions_dir.glob("*.png"))
        summary["computer_vision_detection"] = len(detected_images)
        
        for img_path in detected_images:
            page_num = extract_page_from_filename(img_path.name)
            if page_num:
                if page_num not in results["images_by_page"]:
                    results["images_by_page"][page_num] = []
                results["images_by_page"][page_num].append({
                    "filename": img_path.name,
                    "path": str(img_path),
                    "method": "computer_vision_detection",
                    "size_bytes": img_path.stat().st_size
                })
    
    if page_screenshots_dir.exists():
        screenshot_images = list(page_screenshots_dir.glob("*.png"))
        summary["page_screenshots"] = len(screenshot_images)
    
    if filtered_images_dir.exists():
        filtered_images = list(filtered_images_dir.glob("*.png"))
        summary["filtered_high_quality"] = len(filtered_images)
        
        # These are the high-quality images we want to highlight
        for img_path in filtered_images:
            results["high_quality_images"].append({
                "filename": img_path.name,
                "path": str(img_path),
                "size_bytes": img_path.stat().st_size
            })
    
    results["extraction_summary"] = summary
    
    # Load analysis results if available
    analysis_file = extraction_dir / "image_analysis_results.json"
    if analysis_file.exists():
        try:
            with open(analysis_file, 'r') as f:
                results["analysis_results"] = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load analysis results: {e}", file=sys.stderr)
    
    return results


def extract_page_from_filename(filename: str) -> int:
    """Extract page number from image filename."""
    try:
        # Pattern: page_89_region_5_75617085.png
        if "page_" in filename:
            parts = filename.split("_")
            for i, part in enumerate(parts):
                if part == "page" and i + 1 < len(parts):
                    return int(parts[i + 1])
    except ValueError:
        pass
    return None


def copy_images_to_output(results: Dict[str, Any], output_dir: Path, pdf_pages: List[int]):
    """Copy extracted images to the final output directory organized by PDF page."""
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for pdf_page in pdf_pages:
        if pdf_page not in results["images_by_page"]:
            continue
            
        # Create directory for this PDF page
        page_dir = output_dir / f"pdf_page_{pdf_page:03d}"
        page_dir.mkdir(parents=True, exist_ok=True)
        
        images_copied = []
        
        # Copy all images for this PDF page
        for image_info in results["images_by_page"][pdf_page]:
            src_path = Path(image_info["path"])
            if src_path.exists():
                dest_path = page_dir / image_info["filename"]
                shutil.copy2(src_path, dest_path)
                
                images_copied.append({
                    "filename": image_info["filename"],
                    "method": image_info["method"],
                    "size_bytes": image_info["size_bytes"],
                    "path": str(dest_path)
                })
        
        # Create metadata file for this PDF page
        page_metadata = {
            "pdf_page": pdf_page,
            "images": images_copied,
            "image_count": len(images_copied),
            "extraction_summary": results["extraction_summary"]
        }
        
        metadata_file = page_dir / f"pdf_page_{pdf_page:03d}_images.json"
        with open(metadata_file, 'w') as f:
            json.dump(page_metadata, f, indent=2)
        
        print(f"✓ Copied {len(images_copied)} images for PDF page {pdf_page} to {page_dir}")


def organize_images_by_book_page(results: Dict[str, Any], book_pages: List[int], output_dir: Path):
    """Organize extracted images by book page number."""
    
    # Create output structure
    for book_page in book_pages:
        page_dir = output_dir / f"page_{book_page:03d}"
        page_dir.mkdir(parents=True, exist_ok=True)
        
        # Determine which PDF page this book page belongs to
        pdf_page = book_to_pdf_page(book_page)
        
        # Copy relevant images for this book page
        images_copied = []
        
        if pdf_page in results["images_by_page"]:
            for image_info in results["images_by_page"][pdf_page]:
                src_path = Path(image_info["path"])
                if src_path.exists():
                    dest_path = page_dir / image_info["filename"]
                    shutil.copy2(src_path, dest_path)
                    images_copied.append({
                        "filename": image_info["filename"],
                        "method": image_info["method"],
                        "size_bytes": image_info["size_bytes"]
                    })
        
        # Create page-specific JSON
        page_results = {
            "book_page": book_page,
            "pdf_page": pdf_page,
            "images": images_copied,
            "image_count": len(images_copied)
        }
        
        page_json = page_dir / f"page_{book_page:03d}_images.json"
        with open(page_json, 'w') as f:
            json.dump(page_results, f, indent=2)
        
        print(f"✓ Organized {len(images_copied)} images for book page {book_page}")


def main():
    parser = argparse.ArgumentParser(
        description="Extract images from NCLEX 311 PDF pages",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract images from PDF page 9
  python extract_images_cli.py --pdf-pages 9
  
  # Extract images from PDF pages 9-11
  python extract_images_cli.py --pdf-pages 9-11
  
  # Extract with custom output directory
  python extract_images_cli.py --pdf-pages 9 --output ./extracted_images
  
  # Use custom PDF path
  python extract_images_cli.py --pdf-pages 9 --pdf ./custom_nclex.pdf
        """
    )
    
    parser.add_argument(
        "--pdf-pages",
        required=True,
        help="PDF page number or range (e.g., '9' or '9-11')"
    )
    
    parser.add_argument(
        "--pdf",
        default="../shared/pdfs/NCLEX 311 - 20240731.pdf",
        help="Path to the NCLEX 311 PDF file (default: ../shared/pdfs/NCLEX 311 - 20240731.pdf)"
    )
    
    parser.add_argument(
        "--output",
        help="Output directory for organized results (default: ./extracted_images)"
    )
    
    parser.add_argument(
        "--temp-dir",
        help="Temporary directory for extraction (default: ./temp_extraction)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="Keep temporary extraction files"
    )
    
    args = parser.parse_args()
    
    try:
        # Parse page range
        pdf_pages = parse_page_range(args.pdf_pages)
        
        if args.verbose:
            print(f"Processing PDF pages: {pdf_pages}")
            print(f"PDF file: {args.pdf}")
        
        # Set up directories
        output_dir = Path(args.output) if args.output else Path("./extracted_images")
        temp_dir = Path(args.temp_dir) if args.temp_dir else Path("./temp_extraction")
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Extract images
        results = extract_images_from_pdf(
            pdf_path=args.pdf,
            pdf_pages=pdf_pages,
            temp_output_dir=str(temp_dir)
        )
        
        # Copy images to the final output directory
        copy_images_to_output(results, output_dir, pdf_pages)
        
        # Save comprehensive results
        results_file = output_dir / "extraction_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Print summary
        total_images = sum(len(images) for images in results["images_by_page"].values())
        high_quality_count = len(results["high_quality_images"])
        
        print(f"\nExtraction Summary:")
        print(f"  PDF pages processed: {len(pdf_pages)} ({pdf_pages})")
        print(f"  Total images extracted: {total_images}")
        print(f"  High-quality images identified: {high_quality_count}")
        print(f"  Results saved to: {output_dir}")
        print(f"  Detailed results: {results_file}")
        
        # Show extraction method breakdown
        if results["extraction_summary"]:
            print(f"\nExtraction Methods:")
            for method, count in results["extraction_summary"].items():
                print(f"  {method}: {count} images")
        
        # Clean up temp directory unless requested to keep
        if not args.keep_temp and temp_dir.exists():
            shutil.rmtree(temp_dir)
            if args.verbose:
                print(f"Cleaned up temporary directory: {temp_dir}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()