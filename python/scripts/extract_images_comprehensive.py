#!/usr/bin/env python3
"""
Enhanced PDF Image Extraction Script

This script uses multiple techniques to extract images from the NCLEX 311 PDF:
1. PyMuPDF (fitz) for direct image extraction
2. pdf2image for converting pages to images and detecting image regions  
3. Pillow for image processing and cropping
4. OCR for text detection to separate text from image content

Usage:
    python scripts/extract_images_comprehensive.py
"""

import os
import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import argparse

import fitz  # PyMuPDF
import cv2
import numpy as np
from PIL import Image, ImageDraw
import pytesseract
from pdf2image import convert_from_path
import hashlib

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFImageExtractor:
    def __init__(self, pdf_path: str, output_dir: str = "extracted_images"):
        self.pdf_path = pdf_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.output_dir / "direct_extraction").mkdir(exist_ok=True)
        (self.output_dir / "detected_regions").mkdir(exist_ok=True)
        (self.output_dir / "page_screenshots").mkdir(exist_ok=True)
        
        self.doc = fitz.open(pdf_path)
        self.extracted_images = []
        
    def extract_direct_images(self, page_range: Tuple[int, int] = None) -> List[Dict]:
        """Extract images directly embedded in PDF using PyMuPDF"""
        logger.info("Extracting direct images from PDF...")
        
        start_page = page_range[0] if page_range else 0
        end_page = page_range[1] if page_range else len(self.doc)
        
        images = []
        
        for page_num in range(start_page, min(end_page, len(self.doc))):
            page = self.doc[page_num]
            image_list = page.get_images()
            
            logger.info(f"Page {page_num + 1}: Found {len(image_list)} direct images")
            
            for img_index, img in enumerate(image_list):
                try:
                    # Get the XREF of the image
                    xref = img[0]
                    
                    # Extract the image
                    pix = fitz.Pixmap(self.doc, xref)
                    
                    if pix.n - pix.alpha < 4:  # GRAY or RGB
                        img_data = pix.tobytes("png")
                        
                        # Generate filename
                        img_hash = hashlib.md5(img_data).hexdigest()[:8]
                        filename = f"page_{page_num + 1}_img_{img_index + 1}_{img_hash}.png"
                        filepath = self.output_dir / "direct_extraction" / filename
                        
                        # Save image
                        with open(filepath, "wb") as f:
                            f.write(img_data)
                        
                        # Get image info
                        pil_img = Image.open(filepath)
                        width, height = pil_img.size
                        
                        image_info = {
                            "source": "direct_extraction",
                            "page": page_num + 1,
                            "index": img_index + 1,
                            "filename": filename,
                            "filepath": str(filepath),
                            "width": width,
                            "height": height,
                            "size_bytes": len(img_data),
                            "hash": img_hash
                        }
                        
                        images.append(image_info)
                        logger.info(f"  Extracted: {filename} ({width}x{height})")
                        
                    pix = None  # free Pixmap resources
                    
                except Exception as e:
                    logger.warning(f"  Failed to extract image {img_index + 1} from page {page_num + 1}: {e}")
        
        return images
    
    def detect_image_regions(self, page_range: Tuple[int, int] = None) -> List[Dict]:
        """Detect potential image regions using computer vision techniques"""
        logger.info("Detecting image regions using computer vision...")
        
        start_page = page_range[0] if page_range else 0
        end_page = page_range[1] if page_range else len(self.doc)
        
        # Convert PDF pages to images
        pages = convert_from_path(
            self.pdf_path, 
            first_page=start_page + 1, 
            last_page=min(end_page, len(self.doc)),
            dpi=200  # High DPI for better detail
        )
        
        detected_regions = []
        
        for i, page_img in enumerate(pages):
            page_num = start_page + i
            logger.info(f"Processing page {page_num + 1} for image regions...")
            
            # Convert PIL to OpenCV format
            opencv_img = cv2.cvtColor(np.array(page_img), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(opencv_img, cv2.COLOR_BGR2GRAY)
            
            # Save page screenshot
            page_filename = f"page_{page_num + 1}_screenshot.png"
            page_filepath = self.output_dir / "page_screenshots" / page_filename
            page_img.save(page_filepath)
            
            # Detect text regions using OCR
            text_boxes = self._detect_text_regions(gray)
            
            # Create mask to exclude text regions
            text_mask = self._create_text_mask(gray.shape, text_boxes)
            
            # Detect image-like regions
            image_regions = self._detect_image_like_regions(gray, text_mask)
            
            # Process detected regions
            for region_idx, (x, y, w, h, confidence) in enumerate(image_regions):
                # Crop the region
                region_img = page_img.crop((x, y, x + w, y + h))
                
                # Generate filename
                region_hash = hashlib.md5(region_img.tobytes()).hexdigest()[:8]
                filename = f"page_{page_num + 1}_region_{region_idx + 1}_{region_hash}.png"
                filepath = self.output_dir / "detected_regions" / filename
                
                # Save region
                region_img.save(filepath)
                
                region_info = {
                    "source": "detected_region",
                    "page": page_num + 1,
                    "region_index": region_idx + 1,
                    "filename": filename,
                    "filepath": str(filepath),
                    "bbox": [x, y, x + w, y + h],
                    "width": w,
                    "height": h,
                    "confidence": confidence,
                    "hash": region_hash
                }
                
                detected_regions.append(region_info)
                logger.info(f"  Detected region: {filename} ({w}x{h}, confidence: {confidence:.2f})")
        
        return detected_regions
    
    def _detect_text_regions(self, gray_img: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect text regions using OCR"""
        try:
            # Use pytesseract to get bounding boxes of text
            data = pytesseract.image_to_data(gray_img, output_type=pytesseract.Output.DICT)
            
            text_boxes = []
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 30:  # Filter out low-confidence detections
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    if w > 10 and h > 10:  # Filter out very small detections
                        text_boxes.append((x, y, w, h))
            
            return text_boxes
        except Exception as e:
            logger.warning(f"Text detection failed: {e}")
            return []
    
    def _create_text_mask(self, img_shape: Tuple[int, int], text_boxes: List[Tuple[int, int, int, int]]) -> np.ndarray:
        """Create a mask to exclude text regions"""
        mask = np.ones(img_shape, dtype=np.uint8) * 255
        
        for x, y, w, h in text_boxes:
            # Expand text boxes slightly to ensure complete coverage
            padding = 5
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(img_shape[1], x + w + padding)
            y2 = min(img_shape[0], y + h + padding)
            
            mask[y1:y2, x1:x2] = 0
        
        return mask
    
    def _detect_image_like_regions(self, gray_img: np.ndarray, text_mask: np.ndarray) -> List[Tuple[int, int, int, int, float]]:
        """Detect regions that look like images (non-text content)"""
        
        # Apply text mask
        masked_img = cv2.bitwise_and(gray_img, text_mask)
        
        # Detect edges
        edges = cv2.Canny(masked_img, 50, 150)
        
        # Morphological operations to connect edge components
        kernel = np.ones((5, 5), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=2)
        edges = cv2.erode(edges, kernel, iterations=1)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        image_regions = []
        
        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter based on size
            min_size = 100  # Minimum width or height
            max_ratio = 10  # Maximum aspect ratio
            
            if w >= min_size and h >= min_size:
                aspect_ratio = max(w/h, h/w)
                if aspect_ratio <= max_ratio:
                    # Calculate confidence based on contour properties
                    area = cv2.contourArea(contour)
                    bbox_area = w * h
                    
                    if bbox_area > 0:
                        confidence = area / bbox_area
                        if confidence >= 0.3:  # Minimum confidence threshold
                            image_regions.append((x, y, w, h, confidence))
        
        # Sort by confidence and take top candidates
        image_regions.sort(key=lambda x: x[4], reverse=True)
        return image_regions[:10]  # Limit to top 10 candidates per page
    
    def analyze_pdf_structure(self) -> Dict[str, Any]:
        """Analyze the PDF structure to understand how content is organized"""
        logger.info("Analyzing PDF structure...")
        
        structure_info = {
            "total_pages": len(self.doc),
            "page_analysis": []
        }
        
        for page_num in range(min(5, len(self.doc))):  # Analyze first 5 pages
            page = self.doc[page_num]
            
            # Get page dimensions
            rect = page.rect
            
            # Get text blocks
            text_blocks = page.get_text("dict")
            
            # Get drawing commands (could indicate images/graphics)
            drawings = page.get_drawings()
            
            # Get embedded images
            images = page.get_images()
            
            page_info = {
                "page": page_num + 1,
                "dimensions": {"width": rect.width, "height": rect.height},
                "text_blocks": len(text_blocks.get("blocks", [])),
                "drawings": len(drawings),
                "embedded_images": len(images),
                "has_complex_content": len(drawings) > 0 or len(images) > 0
            }
            
            structure_info["page_analysis"].append(page_info)
        
        return structure_info
    
    def extract_all_images(self, page_range: Tuple[int, int] = None) -> Dict[str, Any]:
        """Extract images using all available methods"""
        logger.info("Starting comprehensive image extraction...")
        
        results = {
            "pdf_path": self.pdf_path,
            "extraction_methods": {
                "direct_extraction": [],
                "detected_regions": []
            },
            "structure_analysis": {},
            "summary": {}
        }
        
        try:
            # Analyze PDF structure
            results["structure_analysis"] = self.analyze_pdf_structure()
            
            # Method 1: Direct image extraction
            results["extraction_methods"]["direct_extraction"] = self.extract_direct_images(page_range)
            
            # Method 2: Computer vision-based region detection
            results["extraction_methods"]["detected_regions"] = self.detect_image_regions(page_range)
            
            # Generate summary
            total_direct = len(results["extraction_methods"]["direct_extraction"])
            total_regions = len(results["extraction_methods"]["detected_regions"])
            
            results["summary"] = {
                "total_images_extracted": total_direct + total_regions,
                "direct_extraction_count": total_direct,
                "detected_regions_count": total_regions,
                "output_directory": str(self.output_dir)
            }
            
            logger.info(f"Extraction complete! Found {total_direct} direct images and {total_regions} detected regions")
            
        except Exception as e:
            logger.error(f"Error during extraction: {e}")
            raise
        
        finally:
            if hasattr(self, 'doc'):
                self.doc.close()
        
        return results
    
    def save_results(self, results: Dict[str, Any], output_file: str = "extraction_results.json"):
        """Save extraction results to JSON file"""
        output_path = self.output_dir / output_file
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Results saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Extract images from PDF using multiple techniques")
    parser.add_argument("--pdf", default="../shared/pdfs/NCLEX 311 - 20240731.pdf", help="Path to PDF file")
    parser.add_argument("--output", default="../python/data/extracted_images_comprehensive", help="Output directory")
    parser.add_argument("--pages", help="Page range (e.g., '88-92')")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Parse page range
    page_range = None
    if args.pages:
        try:
            start, end = map(int, args.pages.split('-'))
            page_range = (start - 1, end)  # Convert to 0-based indexing
        except ValueError:
            logger.error("Invalid page range format. Use 'start-end' (e.g., '88-92')")
            return 1
    
    if not os.path.exists(args.pdf):
        logger.error(f"PDF file not found: {args.pdf}")
        return 1
    
    try:
        # Create extractor
        extractor = PDFImageExtractor(args.pdf, args.output)
        
        # Extract images
        results = extractor.extract_all_images(page_range)
        
        # Save results
        extractor.save_results(results)
        
        # Print summary
        print("\n" + "="*50)
        print("EXTRACTION SUMMARY")
        print("="*50)
        print(f"Total images extracted: {results['summary']['total_images_extracted']}")
        print(f"Direct extraction: {results['summary']['direct_extraction_count']}")
        print(f"Detected regions: {results['summary']['detected_regions_count']}")
        print(f"Output directory: {results['summary']['output_directory']}")
        print("\nCheck the output directory for extracted images and detailed results.")
        
        return 0
        
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main())