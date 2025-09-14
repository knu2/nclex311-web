#!/usr/bin/env python3
"""
NCLEX 311 Page Analysis CLI Tool

Analyze page structure and content layout to guide extraction strategy.
Provides insights into content boundaries and page organization.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add the parent directory to the path to import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from unstructured.partition.pdf import partition_pdf
    import fitz  # PyMuPDF
except ImportError as e:
    print(f"Error: Could not import required modules: {e}", file=sys.stderr)
    print("Please install dependencies: pip install PyMuPDF 'unstructured[pdf]'", file=sys.stderr)
    sys.exit(1)


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


# Removed incorrect book_to_pdf_page conversion function
# We now ask users to provide PDF page directly


def analyze_pdf_structure(pdf_path: str, pdf_page: int) -> Dict[str, Any]:
    """Analyze the basic structure of a PDF page."""
    
    try:
        doc = fitz.open(pdf_path)
        page = doc.load_page(pdf_page - 1)  # fitz uses 0-based indexing
        
        # Get page dimensions
        rect = page.rect
        page_info = {
            "pdf_page": pdf_page,
            "width": rect.width,
            "height": rect.height,
            "area": rect.width * rect.height
        }
        
        # Extract text blocks to analyze layout
        text_blocks = page.get_text("dict")
        
        # Analyze text distribution
        blocks = text_blocks.get("blocks", [])
        text_blocks_info = []
        
        for block in blocks:
            if "lines" in block:  # Text block
                block_rect = fitz.Rect(block["bbox"])
                text_content = ""
                for line in block["lines"]:
                    for span in line["spans"]:
                        text_content += span["text"] + " "
                
                text_blocks_info.append({
                    "bbox": block["bbox"],
                    "width": block_rect.width,
                    "height": block_rect.height,
                    "text_preview": text_content[:100].strip(),
                    "text_length": len(text_content.strip())
                })
        
        page_info["text_blocks"] = text_blocks_info
        page_info["total_text_blocks"] = len(text_blocks_info)
        
        # Check for images
        image_list = page.get_images()
        page_info["embedded_images"] = len(image_list)
        
        # Analyze left/right split (assuming side-by-side layout)
        mid_x = rect.width / 2
        left_blocks = [b for b in text_blocks_info if b["bbox"][0] < mid_x]
        right_blocks = [b for b in text_blocks_info if b["bbox"][0] >= mid_x]
        
        page_info["layout_analysis"] = {
            "left_side_blocks": len(left_blocks),
            "right_side_blocks": len(right_blocks),
            "left_side_text": sum(b["text_length"] for b in left_blocks),
            "right_side_text": sum(b["text_length"] for b in right_blocks)
        }
        
        doc.close()
        return page_info
        
    except Exception as e:
        return {
            "pdf_page": pdf_page,
            "error": f"Failed to analyze PDF structure: {str(e)}",
            "width": None,
            "height": None
        }


def analyze_content_structure(pdf_path: str, pdf_page: int) -> Dict[str, Any]:
    """Analyze content structure using unstructured.io."""
    
    try:
        # Extract structured content
        content = extract_page_content_unstructured(pdf_path, pdf_page)
        
        if not content:
            return {
                "pdf_page": pdf_page,
                "error": "No content extracted",
                "content_analysis": None
            }
        
        # Analyze different types of content
        analysis = {
            "pdf_page": pdf_page,
            "total_elements": len(content),
            "content_types": {},
            "potential_concepts": [],
            "potential_questions": [],
            "medical_terms": []
        }
        
        # Count content types
        for element in content:
            element_type = element.get("type", "unknown")
            if element_type not in analysis["content_types"]:
                analysis["content_types"][element_type] = 0
            analysis["content_types"][element_type] += 1
        
        # Look for potential concepts and questions
        for element in content:
            text = element.get("text", "").strip()
            element_type = element.get("type", "")
            
            if not text:
                continue
            
            # Identify potential concepts (titles, headers)
            if element_type in ["Title", "Header", "NarrativeText"] and len(text) < 200:
                if any(keyword in text.lower() for keyword in ["concept", "disorder", "disease", "syndrome", "condition"]):
                    analysis["potential_concepts"].append({
                        "text": text,
                        "type": element_type,
                        "confidence": "medium"
                    })
            
            # Identify potential questions
            if "?" in text or text.strip().endswith(":"):
                if len(text) > 20 and len(text) < 500:  # Reasonable question length
                    analysis["potential_questions"].append({
                        "text": text[:200] + "..." if len(text) > 200 else text,
                        "type": element_type,
                        "confidence": "medium"
                    })
            
            # Look for medical terminology (basic heuristic)
            medical_keywords = [
                "patient", "diagnosis", "treatment", "symptom", "medication", 
                "nursing", "assessment", "intervention", "outcome", "care plan",
                "laboratory", "vital signs", "blood pressure", "heart rate",
                "respiratory", "cardiac", "neurological", "gastrointestinal"
            ]
            
            text_lower = text.lower()
            for keyword in medical_keywords:
                if keyword in text_lower and keyword not in analysis["medical_terms"]:
                    analysis["medical_terms"].append(keyword)
        
        return analysis
        
    except Exception as e:
        return {
            "pdf_page": pdf_page,
            "error": f"Failed to analyze content structure: {str(e)}",
            "content_analysis": None
        }


def determine_extraction_strategy(pdf_analysis: Dict[str, Any], content_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Determine the best extraction strategy based on analysis results."""
    
    strategy = {
        "recommended_approach": "standard",
        "confidence": "medium",
        "reasons": [],
        "special_handling": [],
        "estimated_complexity": "medium"
    }
    
    # Analyze PDF structure
    if "layout_analysis" in pdf_analysis:
        layout = pdf_analysis["layout_analysis"]
        left_text = layout.get("left_side_text", 0)
        right_text = layout.get("right_side_text", 0)
        
        # Check for balanced content
        if left_text > 0 and right_text > 0:
            ratio = min(left_text, right_text) / max(left_text, right_text)
            if ratio > 0.3:  # Both sides have substantial content
                strategy["special_handling"].append("Split extraction needed for left/right pages")
                strategy["estimated_complexity"] = "high"
        
        # Check for image-heavy pages
        if pdf_analysis.get("embedded_images", 0) > 3:
            strategy["special_handling"].append("Image-heavy page - use comprehensive image extraction")
            strategy["recommended_approach"] = "image_focused"
    
    # Analyze content structure
    if content_analysis and "content_analysis" not in content_analysis:
        # Good structured extraction
        if content_analysis.get("total_elements", 0) > 10:
            strategy["reasons"].append("Rich structured content available")
            strategy["confidence"] = "high"
        
        # Check for questions
        questions = content_analysis.get("potential_questions", [])
        if len(questions) > 2:
            strategy["special_handling"].append(f"Multiple questions detected ({len(questions)})")
            strategy["recommended_approach"] = "question_focused"
        
        # Check for medical content
        medical_terms = content_analysis.get("medical_terms", [])
        if len(medical_terms) > 5:
            strategy["reasons"].append("High medical terminology density")
            strategy["confidence"] = "high"
    
    # Set overall complexity
    special_count = len(strategy["special_handling"])
    if special_count == 0:
        strategy["estimated_complexity"] = "low"
    elif special_count > 2:
        strategy["estimated_complexity"] = "high"
    
    return strategy


def analyze_pdf_page(pdf_page: int, pdf_path: str) -> Dict[str, Any]:
    """Perform comprehensive analysis of a PDF page."""
    
    analysis_result = {
        "pdf_page": pdf_page,
        "timestamp": None
    }
    
    print(f"Analyzing PDF page {pdf_page}...")
    
    # Analyze PDF structure
    print("  Analyzing PDF structure...")
    pdf_analysis = analyze_pdf_structure(pdf_path, pdf_page)
    analysis_result["pdf_structure"] = pdf_analysis
    
    # Analyze content structure
    print("  Analyzing content structure...")
    content_analysis = analyze_content_structure(pdf_path, pdf_page)
    analysis_result["content_structure"] = content_analysis
    
    # Determine extraction strategy
    print("  Determining extraction strategy...")
    strategy = determine_extraction_strategy(pdf_analysis, content_analysis)
    analysis_result["extraction_strategy"] = strategy
    
    return analysis_result


def main():
    parser = argparse.ArgumentParser(
        description="Analyze NCLEX 311 page structure and content",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze PDF page 9
  python analyze_page_cli.py --pdf-page 9
  
  # Analyze with custom PDF path
  python analyze_page_cli.py --pdf-page 9 --pdf ./custom_nclex.pdf
  
  # Save analysis results to file
  python analyze_page_cli.py --pdf-page 9 --output ./analysis_results.json

This tool helps determine the best extraction approach for each PDF page.
        """
    )
    
    parser.add_argument(
        "--pdf-page",
        type=int,
        required=True,
        help="PDF page number to analyze (1-indexed)"
    )
    
    parser.add_argument(
        "--pdf",
        default="../shared/pdfs/NCLEX 311 - 20240731.pdf",
        help="Path to the NCLEX 311 PDF file (default: ../shared/pdfs/NCLEX 311 - 20240731.pdf)"
    )
    
    parser.add_argument(
        "--output",
        help="Output file for analysis results (JSON format)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        # Check if PDF exists
        pdf_path = Path(args.pdf)
        if not pdf_path.exists():
            print(f"Error: PDF file not found: {pdf_path}", file=sys.stderr)
            sys.exit(1)
        
        # Perform analysis
        analysis = analyze_pdf_page(args.pdf_page, str(pdf_path))
        
        # Add timestamp
        from datetime import datetime
        analysis["timestamp"] = datetime.now().isoformat()
        
        # Save to file if requested
        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                json.dump(analysis, f, indent=2)
            print(f"\nAnalysis saved to: {output_path}")
        
        # Print summary
        print(f"\nPDF Page Analysis Summary:")
        print(f"  PDF page: {analysis['pdf_page']}")
        
        # PDF structure summary
        pdf_struct = analysis["pdf_structure"]
        if "error" not in pdf_struct:
            print(f"  Page dimensions: {pdf_struct['width']:.0f} x {pdf_struct['height']:.0f}")
            print(f"  Text blocks: {pdf_struct['total_text_blocks']}")
            print(f"  Embedded images: {pdf_struct['embedded_images']}")
            
            layout = pdf_struct.get("layout_analysis", {})
            print(f"  Left side: {layout.get('left_side_blocks', 0)} blocks, {layout.get('left_side_text', 0)} chars")
            print(f"  Right side: {layout.get('right_side_blocks', 0)} blocks, {layout.get('right_side_text', 0)} chars")
        
        # Content structure summary
        content_struct = analysis["content_structure"]
        if "error" not in content_struct:
            print(f"  Total elements: {content_struct['total_elements']}")
            print(f"  Content types: {list(content_struct['content_types'].keys())}")
            print(f"  Potential concepts: {len(content_struct['potential_concepts'])}")
            print(f"  Potential questions: {len(content_struct['potential_questions'])}")
            print(f"  Medical terms found: {len(content_struct['medical_terms'])}")
        
        # Extraction strategy
        strategy = analysis["extraction_strategy"]
        print(f"\nRecommended Extraction Strategy:")
        print(f"  Approach: {strategy['recommended_approach']}")
        print(f"  Complexity: {strategy['estimated_complexity']}")
        print(f"  Confidence: {strategy['confidence']}")
        
        if strategy["reasons"]:
            print(f"  Reasons: {'; '.join(strategy['reasons'])}")
        
        if strategy["special_handling"]:
            print(f"  Special handling:")
            for item in strategy["special_handling"]:
                print(f"    - {item}")
        
        # Print full analysis if verbose
        if args.verbose:
            print(f"\nFull Analysis:")
            print(json.dumps(analysis, indent=2))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()