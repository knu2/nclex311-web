#!/usr/bin/env python3
"""
NCLEX 311 Text Extraction CLI Tool

Extract structured text content from PDF pages using unstructured.io API.
Handles the side-by-side page layout of the NCLEX 311 book.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
import os

# Add the parent directory to the path to import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from unstructured.partition.pdf import partition_pdf
    import fitz  # PyMuPDF
except ImportError as e:
    print(f"Error: Could not import required modules: {e}", file=sys.stderr)
    print("Please install dependencies: pip install PyMuPDF 'unstructured[pdf]'", file=sys.stderr)
    sys.exit(1)


def parse_page_range(page_range: str) -> List[int]:
    """Parse page range string like '89' or '89-91' into list of integers."""
    if '-' in page_range:
        start, end = map(int, page_range.split('-'))
        return list(range(start, end + 1))
    else:
        return [int(page_range)]


# Removed book page conversion - now using PDF pages directly


def extract_page_content_unstructured(pdf_path: str, page_number: int) -> List[Dict[str, Any]]:
    """Extract content from a specific PDF page using unstructured.io."""
    try:
        # Note: unstructured.io "fast" strategy seems to ignore pages parameter
        # So we extract and then filter by page number
        elements = partition_pdf(
            filename=pdf_path,
            strategy="fast"  # Use fast strategy for CLI testing
        )
        
        # Convert elements to dictionary format and filter by page
        content = []
        for element in elements:
            # Get metadata to check page number
            metadata = getattr(element, 'metadata', {})
            element_page = None
            
            # Extract page number from metadata
            if hasattr(metadata, 'page_number'):
                element_page = metadata.page_number
            elif hasattr(metadata, 'to_dict'):
                try:
                    meta_dict = metadata.to_dict()
                    element_page = meta_dict.get('page_number')
                except:
                    pass
            
            # Skip elements that are not from the requested page
            if element_page is not None and element_page != page_number:
                continue
            
            # Convert metadata to serializable format
            serializable_metadata = {}
            if metadata:
                try:
                    # Convert metadata to dict, handling non-serializable objects
                    serializable_metadata = {
                        k: str(v) if not isinstance(v, (str, int, float, bool, list, dict, type(None))) else v
                        for k, v in metadata.to_dict().items() if hasattr(metadata, 'to_dict')
                    } if hasattr(metadata, 'to_dict') else {
                        k: str(v) if not isinstance(v, (str, int, float, bool, list, dict, type(None))) else v
                        for k, v in vars(metadata).items()
                    }
                except:
                    serializable_metadata = {"metadata_str": str(metadata)}
            
            content.append({
                "type": str(type(element)).split(".")[-1].replace("'>", ""),
                "text": str(element),
                "metadata": serializable_metadata
            })
        
        return content
        
    except Exception as e:
        raise RuntimeError(f"Failed to extract content from page {page_number}: {str(e)}")


def extract_text_content(pdf_path: str, pdf_pages: List[int], output_dir: str = None) -> Dict[str, Any]:
    """Extract text content from specified PDF pages."""
    
    # Convert to Path object
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    results = {}
    total_pages = len(pdf_pages)
    
    print(f"Extracting text content from {total_pages} PDF page(s)...")
    
    for i, pdf_page in enumerate(pdf_pages, 1):
        print(f"Processing PDF page {pdf_page} ({i}/{total_pages})...")
        
        try:
            # Extract content using unstructured.io
            page_content = extract_page_content_unstructured(
                pdf_path=str(pdf_path),
                page_number=pdf_page
            )
            
            results[pdf_page] = {
                "pdf_page": pdf_page,
                "content": page_content,
                "status": "success",
                "error": None
            }
            
            print(f"✓ Successfully extracted content from PDF page {pdf_page}")
            
        except Exception as e:
            error_msg = f"Failed to extract from PDF page {pdf_page}: {str(e)}"
            print(f"✗ {error_msg}", file=sys.stderr)
            
            results[pdf_page] = {
                "pdf_page": pdf_page,
                "content": None,
                "status": "error",
                "error": error_msg
            }
    
    # Save results if output directory specified
    if output_dir:
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save comprehensive results
        results_file = output_path / "text_extraction_results.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\nResults saved to: {results_file}")
    
    return results


def extract_from_pdf_pages(pdf_pages: List[int], pdf_path: str, output_dir: str = None) -> Dict[str, Any]:
    """Extract content from PDF pages directly."""
    
    print(f"Extracting from PDF pages: {pdf_pages}")
    
    # Extract text from PDF pages
    extraction_results = extract_text_content(
        pdf_path=pdf_path,
        pdf_pages=pdf_pages,
        output_dir=output_dir
    )
    
    return extraction_results


def main():
    parser = argparse.ArgumentParser(
        description="Extract text content from NCLEX 311 PDF pages",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract from PDF page 9
  python extract_text_cli.py --pdf-pages 9
  
  # Extract from PDF pages 9-11
  python extract_text_cli.py --pdf-pages 9-11
  
  # Extract with custom output directory
  python extract_text_cli.py --pdf-pages 9 --output ./extracted_content
  
  # Use custom PDF path
  python extract_text_cli.py --pdf-pages 9 --pdf ./custom_nclex.pdf
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
        help="Output directory for results (default: print to stdout)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        # Parse page range
        pdf_pages = parse_page_range(args.pdf_pages)
        
        if args.verbose:
            print(f"Processing PDF pages: {pdf_pages}")
            print(f"PDF file: {args.pdf}")
            if args.output:
                print(f"Output directory: {args.output}")
        
        # Process the pages
        results = extract_from_pdf_pages(
            pdf_pages=pdf_pages,
            pdf_path=args.pdf,
            output_dir=args.output
        )
        
        # Print summary
        success_count = sum(1 for r in results.values() if r["status"] == "success")
        error_count = len(results) - success_count
        
        print(f"\nExtraction Summary:")
        print(f"  Total PDF pages processed: {len(results)}")
        print(f"  Successful extractions: {success_count}")
        print(f"  Failed extractions: {error_count}")
        
        if error_count > 0:
            print("\nErrors:")
            for pdf_page, result in results.items():
                if result["status"] == "error":
                    print(f"  PDF page {pdf_page}: {result['error']}")
        
        # Output results as JSON to stdout if no output directory
        if not args.output:
            print("\nExtracted Content:")
            print(json.dumps(results, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()