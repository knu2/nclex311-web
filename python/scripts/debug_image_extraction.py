#!/usr/bin/env python3
"""
Debug script to investigate why images aren't being extracted
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def debug_api_response(pdf_path: str, page_range: tuple = (88, 90)):
    """Debug the API response to see what elements are being returned"""
    
    print("🔍 Debugging Image Extraction API Response")
    print("=" * 50)
    
    try:
        from unstructured_client import UnstructuredClient
        from unstructured_client.models import operations, shared
        
        client = UnstructuredClient(api_key_auth=os.getenv("UNSTRUCTURED_API_KEY"))
        
        with open(pdf_path, "rb") as f:
            files = shared.Files(
                content=f.read(),
                file_name=str(Path(pdf_path).name)
            )
        
        print(f"📄 Processing PDF pages {page_range[0]}-{page_range[1]}...")
        
        # Make API request with detailed image extraction
        request = operations.PartitionRequest(
            partition_parameters=shared.PartitionParameters(
                files=files,
                split_pdf_page=True,
                split_pdf_allow_failed=True,
                split_pdf_concurrency_level=15,
                # Extract images and tables with detailed settings
                extract_image_block_types=["Image", "Table", "FigureCaption"],
                # Additional parameters
                chunking_strategy="by_title",
                max_characters=4000,
                new_after_n_chars=3800,
                overlap=200
            )
        )
        
        result = client.general.partition(request=request)
        
        print(f"✅ API request successful! Got {len(result.elements)} elements")
        
        # Analyze the response
        element_types = {}
        elements_with_images = 0
        elements_with_metadata = 0
        
        for i, element in enumerate(result.elements):
            # Count element types
            element_type = element.get("type", "unknown")
            element_types[element_type] = element_types.get(element_type, 0) + 1
            
            # Check for image metadata
            metadata = element.get("metadata", {})
            if metadata:
                elements_with_metadata += 1
                
                # Check if this element has image data
                if "image_base64" in metadata:
                    elements_with_images += 1
                    print(f"🖼️  Found image in element {i} (type: {element_type})")
                    print(f"   Page: {metadata.get('page_number', 'unknown')}")
                    print(f"   Image data length: {len(metadata['image_base64'])} chars")
                    
                    # Check for coordinates
                    if "coordinates" in metadata:
                        print(f"   Has coordinates: Yes")
                    else:
                        print(f"   Has coordinates: No")
                    print()
        
        # Print summary
        print("\n" + "="*50)
        print("📊 ANALYSIS SUMMARY")
        print("="*50)
        print(f"Total Elements: {len(result.elements)}")
        print(f"Elements with Metadata: {elements_with_metadata}")
        print(f"Elements with Images: {elements_with_images}")
        print(f"Image Success Rate: {elements_with_images / len(result.elements) * 100:.1f}%")
        
        print(f"\n📋 Element Types:")
        for elem_type, count in sorted(element_types.items()):
            print(f"  {elem_type}: {count}")
        
        # Filter to our target pages
        target_elements = []
        for element in result.elements:
            page_num = element.get("metadata", {}).get("page_number", 0)
            if page_range[0] <= page_num <= page_range[1]:
                target_elements.append(element)
        
        target_with_images = sum(1 for e in target_elements if "image_base64" in e.get("metadata", {}))
        
        print(f"\n🎯 TARGET PAGES ({page_range[0]}-{page_range[1]}):")
        print(f"Elements on target pages: {len(target_elements)}")
        print(f"Images on target pages: {target_with_images}")
        
        # Save raw response for inspection
        debug_dir = Path("debug_extraction_results")
        debug_dir.mkdir(exist_ok=True)
        
        with open(debug_dir / "raw_api_response.json", 'w') as f:
            json.dump(result.elements, f, indent=2, default=str)
        
        print(f"\n💾 Raw API response saved to: {debug_dir / 'raw_api_response.json'}")
        
        if target_with_images == 0:
            print("\n❌ NO IMAGES FOUND ON TARGET PAGES")
            print("Possible issues:")
            print("1. Images might be on different pages than expected")
            print("2. Images might be embedded differently in the PDF")
            print("3. API parameters might need adjustment")
        else:
            print(f"\n✅ Found {target_with_images} images on target pages!")
            
        return len(target_elements), target_with_images
        
    except Exception as e:
        print(f"❌ Debug failed: {str(e)}")
        return 0, 0

def main():
    """Run the debug analysis"""
    
    pdf_path = "docs/scratchpad/NCLEX 311 - 20240731.pdf"
    
    if not Path(pdf_path).exists():
        print(f"❌ PDF file not found: {pdf_path}")
        return 1
    
    api_key = os.getenv("UNSTRUCTURED_API_KEY")
    if not api_key:
        print("❌ No UNSTRUCTURED_API_KEY found")
        return 1
    
    elements, images = debug_api_response(pdf_path)
    
    if images > 0:
        print("\n🎉 Images detected! The extraction logic needs debugging.")
    else:
        print("\n🔬 No images detected. This might be a PDF structure issue.")
        print("\nNext steps:")
        print("1. Check if images are actually embedded in the PDF")
        print("2. Try different extraction parameters")
        print("3. Manual inspection of the raw API response")
    
    return 0

if __name__ == "__main__":
    exit(main())