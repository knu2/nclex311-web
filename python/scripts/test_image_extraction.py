#!/usr/bin/env python3
"""
Quick test script for validating image extraction approach
Tests on a limited page range to quickly verify functionality.
"""

import os
import sys
from pathlib import Path
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import the enhanced extractor
try:
    from enhanced_image_extraction import EnhancedPDFExtractor, enhanced_validation
except ImportError:
    print("❌ Cannot import enhanced_image_extraction. Make sure the file is in the same directory.")
    sys.exit(1)

def test_sample_pages(pdf_path: str, start_page: int = 88, end_page: int = 90):
    """Test image extraction on sample pages (pages with known images)"""
    
    print("🧪 Testing Image Extraction on Sample Pages")
    print("=" * 50)
    print(f"Testing PDF pages {start_page}-{end_page} (book pages 176-177 with Herpes Zoster images)")
    print("Note: PDF uses two-page spread layout - each PDF page contains 2 book pages side by side")
    
    # Check for API key
    api_key = os.getenv("UNSTRUCTURED_API_KEY")
    if api_key:
        print("✅ Using unstructured.io API for best results")
    else:
        print("⚠️  No API key found - using local extraction")
    
    # Set up test directory
    test_dir = Path("test_image_extraction_results")
    test_dir.mkdir(exist_ok=True)
    
    try:
        # Initialize extractor
        extractor = EnhancedPDFExtractor(api_key=api_key, output_dir=str(test_dir))
        
        # For testing, we'll modify the approach to focus on specific pages
        # This is a simplified version that processes a smaller range
        
        if api_key:
            # Test with API (can specify page ranges)
            print(f"📄 Processing PDF pages {start_page}-{end_page} with API...")
            topics, images = test_api_extraction(extractor, pdf_path, start_page, end_page)
        else:
            # Test with local processing (full document, but we'll filter results)
            print(f"📄 Processing full PDF locally and filtering pages {start_page}-{end_page}...")
            topics, images = extractor.extract_content_with_images(pdf_path)
            
            # Filter to test pages
            topics = [t for t in topics if start_page <= t.page_number <= end_page]
            images = [i for i in images if start_page <= i.page_number <= end_page]
        
        # Validate results
        validation_report = enhanced_validation(topics, images)
        
        # Print test results
        print_test_results(validation_report, topics, images, start_page, end_page)
        
        return validation_report['success_rate'] > 0.5 and len(images) > 0
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

def test_api_extraction(extractor, pdf_path: str, start_page: int, end_page: int):
    """Test API extraction with page range (simplified)"""
    
    # For this test, we'll process the full document but focus on the results
    # In a production version, you could implement page-range specific processing
    
    topics, images = extractor.extract_content_with_images(pdf_path)
    
    # Filter to test pages
    test_topics = [t for t in topics if start_page <= t.page_number <= end_page]
    test_images = [i for i in images if start_page <= i.page_number <= end_page]
    
    return test_topics, test_images

def print_test_results(validation_report, topics, images, start_page, end_page):
    """Print detailed test results"""
    
    print("\n" + "="*50)
    print("🧪 TEST RESULTS")
    print("="*50)
    
    print(f"Page Range: {start_page}-{end_page}")
    print(f"Topics Found: {len(topics)}")
    print(f"Images Found: {len(images)}")
    
    if validation_report.get('error'):
        print(f"❌ Error: {validation_report['error']}")
        return
    
    print(f"Success Rate: {validation_report['success_rate']:.1%}")
    print(f"Image Coverage: {validation_report['image_coverage']:.1%}")
    print(f"Average Confidence: {validation_report['average_confidence']:.2f}")
    
    print("\n📋 Question Types Found:")
    for q_type, count in validation_report['question_type_distribution'].items():
        print(f"  {q_type}: {count}")
    
    print(f"\n📸 Images Found:")
    for i, image in enumerate(images):
        print(f"  {i+1}. {image.filename} (Page {image.page_number}, Type: {image.element_type})")
    
    print(f"\n📝 Topics Summary:")
    for i, topic in enumerate(topics[:3]):  # Show first 3 topics
        subject = topic.subject or "Unknown Subject"
        image_count = len(topic.images) if topic.images else 0
        print(f"  {i+1}. {subject} (Page {topic.page_number}, Images: {image_count})")
    
    if len(topics) > 3:
        print(f"  ... and {len(topics) - 3} more topics")
    
    # Specific validation for expected content
    print("\n🎯 Expected Content Validation:")
    
    # Look for Herpes Zoster content
    herpes_topics = [t for t in topics if 'herpes' in t.content.lower() or 'zoster' in t.content.lower()]
    if herpes_topics:
        print(f"  ✅ Found {len(herpes_topics)} Herpes Zoster topic(s)")
        
        herpes_images = sum(len(t.images) if t.images else 0 for t in herpes_topics)
        if herpes_images > 0:
            print(f"  ✅ Found {herpes_images} image(s) associated with Herpes Zoster")
        else:
            print(f"  ⚠️  No images associated with Herpes Zoster topics")
    else:
        print(f"  ⚠️  No Herpes Zoster topics found")
    
    # Look for Fifth's Disease content
    fifths_topics = [t for t in topics if 'fifth' in t.content.lower()]
    if fifths_topics:
        print(f"  ✅ Found {len(fifths_topics)} Fifth's Disease topic(s)")
    else:
        print(f"  ⚠️  No Fifth's Disease topics found")

def main():
    """Run the image extraction test"""
    
    # Check if PDF exists
    pdf_path = "docs/scratchpad/NCLEX 311 - 20240731.pdf"
    if not Path(pdf_path).exists():
        print(f"❌ PDF file not found: {pdf_path}")
        print("Please ensure the NCLEX 311 PDF is in the correct location.")
        return 1
    
    # Run test
    success = test_sample_pages(pdf_path)
    
    if success:
        print("\n🎉 Test PASSED! Image extraction is working correctly.")
        print("\nNext steps:")
        print("1. Run full extraction: python scripts/enhanced_image_extraction.py")
        print("2. Review extracted images in test_image_extraction_results/images/")
        print("3. Validate image-topic associations manually")
        return 0
    else:
        print("\n❌ Test FAILED! Please review the errors above.")
        print("\nTroubleshooting:")
        print("1. Check if unstructured.io API key is set correctly")
        print("2. Ensure all dependencies are installed")
        print("3. Verify the PDF file is accessible")
        return 1

if __name__ == "__main__":
    exit(main())