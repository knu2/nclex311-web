#!/usr/bin/env python3
"""
Analyze and categorize extracted images from the comprehensive extraction.

This script examines the extracted images and tries to identify which ones
are likely to be medical diagrams, illustrations, or other relevant images
vs. text regions, headers, footers, etc.
"""

import json
import os
from pathlib import Path
from PIL import Image, ImageStat
import argparse

def analyze_image_content(image_path):
    """Analyze an image to determine if it's likely to contain meaningful visual content."""
    try:
        img = Image.open(image_path)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get basic stats
        width, height = img.size
        area = width * height
        
        # Calculate color variance (higher variance = more complex/interesting content)
        stat = ImageStat.Stat(img)
        
        # Calculate average variance across RGB channels
        variance = sum(stat.var) / len(stat.var)
        
        # Calculate brightness (lower = darker, potentially more content)
        brightness = sum(stat.mean) / len(stat.mean)
        
        # Aspect ratio analysis
        aspect_ratio = max(width, height) / min(width, height)
        
        # Score the image based on various factors
        score = 0
        
        # Size scoring (prefer medium to large images)
        if area > 50000:  # Larger images often contain more content
            score += 30
        elif area > 20000:
            score += 20
        elif area > 10000:
            score += 10
        
        # Variance scoring (higher variance = more visual content)
        if variance > 2000:
            score += 25
        elif variance > 1000:
            score += 15
        elif variance > 500:
            score += 10
        
        # Aspect ratio scoring (avoid very long/thin regions which are often text)
        if aspect_ratio < 3:
            score += 15
        elif aspect_ratio < 5:
            score += 10
        
        # Brightness scoring (images often have varied brightness)
        if 50 < brightness < 200:  # Not too bright or too dark
            score += 10
        
        return {
            'width': width,
            'height': height,
            'area': area,
            'variance': variance,
            'brightness': brightness,
            'aspect_ratio': aspect_ratio,
            'score': score,
            'likely_image': score > 40  # Threshold for "likely contains visual content"
        }
        
    except Exception as e:
        return {'error': str(e), 'likely_image': False}

def analyze_extraction_results(results_file):
    """Analyze the extraction results and categorize images."""
    
    with open(results_file, 'r') as f:
        data = json.load(f)
    
    print("="*60)
    print("IMAGE EXTRACTION ANALYSIS")
    print("="*60)
    
    # Analyze detected regions
    detected_regions = data['extraction_methods']['detected_regions']
    
    print(f"\nAnalyzing {len(detected_regions)} detected regions...")
    
    likely_images = []
    likely_text = []
    errors = []
    
    for region in detected_regions:
        image_path = region['filepath']
        
        if os.path.exists(image_path):
            analysis = analyze_image_content(image_path)
            
            if 'error' in analysis:
                errors.append((region, analysis))
            elif analysis['likely_image']:
                likely_images.append((region, analysis))
            else:
                likely_text.append((region, analysis))
        else:
            errors.append((region, {'error': 'File not found'}))
    
    # Sort by score (descending)
    likely_images.sort(key=lambda x: x[1]['score'], reverse=True)
    likely_text.sort(key=lambda x: x[1].get('score', 0), reverse=True)
    
    print(f"\n📊 SUMMARY:")
    print(f"   Likely images/diagrams: {len(likely_images)}")
    print(f"   Likely text regions: {len(likely_text)}")
    print(f"   Errors: {len(errors)}")
    
    print(f"\n🎯 TOP CANDIDATES FOR MEDICAL IMAGES/DIAGRAMS:")
    print("-" * 60)
    
    for i, (region, analysis) in enumerate(likely_images[:10], 1):
        print(f"{i:2d}. {region['filename']}")
        print(f"    Page {region['page']}, Region {region['region_index']}")
        print(f"    Size: {analysis['width']}x{analysis['height']}")
        print(f"    Score: {analysis['score']:.1f}")
        print(f"    Variance: {analysis['variance']:.1f}")
        print(f"    Aspect Ratio: {analysis['aspect_ratio']:.1f}")
        print()
    
    if likely_text:
        print(f"\n📝 LIKELY TEXT REGIONS (showing top 5):")
        print("-" * 60)
        
        for i, (region, analysis) in enumerate(likely_text[:5], 1):
            print(f"{i:2d}. {region['filename']}")
            print(f"    Page {region['page']}, Size: {analysis['width']}x{analysis['height']}")
            print(f"    Score: {analysis['score']:.1f}")
            print()
    
    if errors:
        print(f"\n❌ ERRORS:")
        print("-" * 60)
        for region, error in errors:
            print(f"   {region['filename']}: {error.get('error', 'Unknown error')}")
    
    # Page-by-page breakdown
    print(f"\n📄 PAGE-BY-PAGE BREAKDOWN:")
    print("-" * 60)
    
    pages = {}
    for region, analysis in likely_images + likely_text:
        page = region['page']
        if page not in pages:
            pages[page] = {'images': 0, 'text': 0}
        
        if (region, analysis) in likely_images:
            pages[page]['images'] += 1
        else:
            pages[page]['text'] += 1
    
    for page in sorted(pages.keys()):
        stats = pages[page]
        print(f"Page {page}: {stats['images']} likely images, {stats['text']} likely text regions")
    
    return {
        'likely_images': likely_images,
        'likely_text': likely_text,
        'errors': errors,
        'pages': pages
    }

def create_filtered_results(analysis_results, output_dir, min_score=40):
    """Create a filtered directory with only the most promising images."""
    
    filtered_dir = Path(output_dir) / "filtered_images"
    filtered_dir.mkdir(exist_ok=True)
    
    likely_images = analysis_results['likely_images']
    
    print(f"\n🔍 Copying {len([img for img, anal in likely_images if anal['score'] >= min_score])} high-scoring images to filtered directory...")
    
    filtered_manifest = []
    
    for region, analysis in likely_images:
        if analysis['score'] >= min_score:
            source_path = Path(region['filepath'])
            dest_path = filtered_dir / f"score_{analysis['score']:.0f}_{source_path.name}"
            
            # Copy the image
            import shutil
            shutil.copy2(source_path, dest_path)
            
            # Add to manifest
            filtered_manifest.append({
                'filename': dest_path.name,
                'original_filename': region['filename'],
                'page': region['page'],
                'score': analysis['score'],
                'dimensions': f"{analysis['width']}x{analysis['height']}",
                'description': f"Page {region['page']}, Region {region['region_index']}"
            })
    
    # Save manifest
    manifest_path = filtered_dir / "manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump({
            'filter_criteria': f"Score >= {min_score}",
            'total_images': len(filtered_manifest),
            'images': filtered_manifest
        }, f, indent=2)
    
    print(f"   Saved to: {filtered_dir}")
    print(f"   Manifest: {manifest_path}")
    
    return filtered_dir

def main():
    parser = argparse.ArgumentParser(description="Analyze extracted images")
    parser.add_argument("--results", default="../python/data/extracted_images_comprehensive/extraction_results.json", 
                       help="Path to extraction results JSON")
    parser.add_argument("--output", default="../python/data/extracted_images_comprehensive",
                       help="Output directory")
    parser.add_argument("--min-score", type=int, default=40,
                       help="Minimum score for filtered images")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.results):
        print(f"Error: Results file not found: {args.results}")
        return 1
    
    # Analyze the results
    analysis = analyze_extraction_results(args.results)
    
    # Create filtered results
    filtered_dir = create_filtered_results(analysis, args.output, args.min_score)
    
    print(f"\n✅ Analysis complete!")
    print(f"   Check {filtered_dir} for the most promising image candidates.")
    
    return 0

if __name__ == "__main__":
    exit(main())