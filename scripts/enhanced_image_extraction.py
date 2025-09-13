#!/usr/bin/env python3
"""
Enhanced NCLEX 311 PDF Extraction with Image Processing
Using unstructured.io API for comprehensive image extraction and association.

This version handles:
- Image extraction from PDF pages
- Base64 decoding and saving as files
- Association of images with specific topics/questions
- Enhanced validation including image presence
"""

import os
import sys
import json
import re
import base64
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import logging
from PIL import Image
import io

# Check if required packages are installed
def check_dependencies():
    """Check and install required dependencies"""
    missing = []
    try:
        import fitz
    except ImportError:
        missing.append("PyMuPDF")
    
    try:
        from unstructured_client import UnstructuredClient
        from unstructured_client.models import operations, shared
        from unstructured.staging.base import elements_from_dicts, elements_to_json
    except ImportError:
        missing.append("unstructured-client")
    
    try:
        from PIL import Image
    except ImportError:
        missing.append("pillow")
    
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print("\nInstall with:")
        print("pip install PyMuPDF unstructured-client pillow")
        return False
    return True

@dataclass
class ExtractedImage:
    """Represents an extracted image with metadata"""
    image_id: str
    filename: str
    base64_data: str
    element_type: str  # "Image" or "Table" 
    page_number: int
    bbox: Optional[List[float]] = None
    associated_topic_id: Optional[str] = None

@dataclass
class QuestionDetectionResult:
    question_type: str
    confidence: float
    extracted_options: List[str]
    correct_answer: Optional[str]
    rationale: Optional[str]
    associated_images: List[str] = None  # Image IDs

@dataclass
class QuestionBlock:
    question_type: str
    content: str
    options: List[str]
    correct_answer: Optional[str]
    rationale: Optional[str]
    subject: Optional[str]
    page_number: int
    confidence_score: float = 0.0
    images: List[ExtractedImage] = None  # Associated images
    topic_id: Optional[str] = None

class EnhancedQuestionClassifier:
    """Enhanced question classifier with image awareness"""
    
    def __init__(self):
        self.patterns = {
            'multiple_choice': [
                (r'[A-D]\.\s+[A-Z]', 0.9),
                (r'\([A-D]\)\s+[A-Z]', 0.8),
                (r'(?i)which.*following', 0.3),
                (r'(?i)choose.*correct', 0.3)
            ],
            'sata': [
                (r'(?i)select all that apply', 1.0),
                (r'(?i)choose all.*correct', 0.9),
                (r'(?i)mark all.*appropriate', 0.8),
                (r'☐|□|\[\s*\]', 0.7)
            ],
            'fill_blank': [
                (r'_{3,}', 0.9),
                (r'\[.*?\]', 0.8),
                (r'\(.*?\)', 0.3)
            ],
            'matrix': [
                (r'(?i)match.*column', 0.9),
                (r'(?i)drag.*drop', 0.8),
                (r'(?i)grid', 0.7),
                (r'(?i)table', 0.3)
            ]
        }
        
        # Image-related keywords that boost confidence
        self.image_indicators = [
            r'(?i)shown.*image',
            r'(?i)picture.*shows',
            r'(?i)photograph.*demonstrates',
            r'(?i)figure.*illustrates',
            r'(?i)see.*image',
            r'(?i)observe.*condition',
            r'(?i)visual.*examination'
        ]
    
    def classify(self, text: str, has_images: bool = False) -> QuestionDetectionResult:
        """Enhanced classification with image awareness"""
        best_type = 'unknown'
        best_confidence = 0.0
        options = []
        associated_images = []
        
        for q_type, patterns in self.patterns.items():
            confidence = 0.0
            for pattern, weight in patterns:
                if re.search(pattern, text, re.IGNORECASE | re.MULTILINE):
                    confidence += weight
            
            # Boost confidence if images are present and text references visuals
            if has_images:
                for img_pattern in self.image_indicators:
                    if re.search(img_pattern, text):
                        confidence += 0.3
                        break
            
            if confidence > best_confidence:
                best_confidence = confidence
                best_type = q_type
        
        # Extract options for multiple choice and SATA
        if best_type in ['multiple_choice', 'sata']:
            option_patterns = [r'[A-F]\.\s+([^\n]+)', r'\([A-F]\)\s+([^\n]+)']
            for pattern in option_patterns:
                matches = re.findall(pattern, text, re.MULTILINE)
                if matches:
                    options.extend(matches)
                    break
        
        return QuestionDetectionResult(
            question_type=best_type,
            confidence=min(best_confidence, 1.0),
            extracted_options=options,
            correct_answer=self._extract_answer(text),
            rationale=self._extract_rationale(text),
            associated_images=associated_images
        )
    
    def _extract_answer(self, text: str) -> Optional[str]:
        """Extract correct answer"""
        patterns = [
            r'(?i)correct answer:?\s*([A-F])',
            r'(?i)answer:?\s*([A-F])',
            r'(?i)the answer is\s*([A-F])'
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).upper()
        return None
    
    def _extract_rationale(self, text: str) -> Optional[str]:
        """Extract rationale/explanation"""
        patterns = [
            r'(?i)rationale:?\s*([^.]+\.)',
            r'(?i)explanation:?\s*([^.]+\.)',
            r'(?i)because:?\s*([^.]+\.)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                return match.group(1).strip()
        return None

class ImageExtractor:
    """Handles image extraction and processing"""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.images_dir = output_dir / "images"
        self.images_dir.mkdir(exist_ok=True)
        
    def extract_and_save_image(self, element: Dict, image_counter: int) -> Optional[ExtractedImage]:
        """Extract image from element and save to disk"""
        if "image_base64" not in element.get("metadata", {}):
            return None
            
        try:
            # Generate unique image ID and filename
            image_id = f"img_{image_counter:04d}"
            filename = f"{image_id}.png"
            filepath = self.images_dir / filename
            
            # Decode and save image
            image_data = base64.b64decode(element["metadata"]["image_base64"])
            image = Image.open(io.BytesIO(image_data))
            image.save(filepath, "PNG")
            
            # Get element metadata
            page_number = element.get("metadata", {}).get("page_number", 0)
            element_type = element.get("type", "Image")
            
            # Try to extract bounding box if available
            bbox = None
            if "coordinates" in element.get("metadata", {}):
                coords = element["metadata"]["coordinates"]
                if coords:
                    bbox = [coords.get("top_left", {}).get("x", 0),
                           coords.get("top_left", {}).get("y", 0),
                           coords.get("bottom_right", {}).get("x", 0),
                           coords.get("bottom_right", {}).get("y", 0)]
            
            extracted_image = ExtractedImage(
                image_id=image_id,
                filename=filename,
                base64_data=element["metadata"]["image_base64"],
                element_type=element_type,
                page_number=page_number,
                bbox=bbox
            )
            
            return extracted_image
            
        except Exception as e:
            logging.warning(f"Failed to extract image: {e}")
            return None
    
    def associate_images_with_topics(self, topics: List[QuestionBlock], images: List[ExtractedImage]) -> List[QuestionBlock]:
        """Associate images with topics based on page proximity and content analysis"""
        
        for topic in topics:
            topic_images = []
            topic_page = topic.page_number
            
            # Find images on the same page or adjacent pages
            for image in images:
                page_distance = abs(image.page_number - topic_page)
                
                # Images on same page get highest priority
                if page_distance == 0:
                    topic_images.append(image)
                    image.associated_topic_id = topic.topic_id
                
                # Images on adjacent pages if topic mentions visual elements
                elif page_distance == 1 and self._topic_mentions_visuals(topic.content):
                    topic_images.append(image)
                    image.associated_topic_id = topic.topic_id
            
            topic.images = topic_images
        
        return topics
    
    def _topic_mentions_visuals(self, content: str) -> bool:
        """Check if topic content mentions visual elements"""
        visual_keywords = [
            'image', 'picture', 'photograph', 'figure', 'shown',
            'observe', 'see', 'visual', 'appears', 'demonstrates',
            'lesion', 'rash', 'condition', 'skin', 'wound'
        ]
        
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in visual_keywords)

class EnhancedPDFExtractor:
    """Enhanced PDF extraction with unstructured.io API and image processing"""
    
    def __init__(self, api_key: Optional[str] = None, output_dir: str = "enhanced_extraction_results"):
        self.api_key = api_key or os.getenv("UNSTRUCTURED_API_KEY")
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.classifier = EnhancedQuestionClassifier()
        self.image_extractor = ImageExtractor(self.output_dir)
        self.logger = self._setup_logger()
        
        if not self.api_key:
            self.logger.warning("No Unstructured API key provided. Falling back to local processing.")
    
    def _setup_logger(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.output_dir / 'extraction.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    def extract_content_with_images(self, pdf_path: str) -> Tuple[List[QuestionBlock], List[ExtractedImage]]:
        """Extract content and images using unstructured.io API"""
        self.logger.info(f"Starting enhanced extraction with images from: {pdf_path}")
        
        if not Path(pdf_path).exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        try:
            if self.api_key:
                elements, images = self._extract_with_api(pdf_path)
            else:
                elements, images = self._extract_with_local(pdf_path)
            
            # Convert elements to question blocks
            topics = self._elements_to_topics(elements, images)
            
            # Associate images with topics
            topics = self.image_extractor.associate_images_with_topics(topics, images)
            
            self.logger.info(f"Extracted {len(topics)} topics with {len(images)} images")
            return topics, images
            
        except Exception as e:
            self.logger.error(f"Enhanced extraction failed: {str(e)}")
            raise
    
    def _extract_with_api(self, pdf_path: str) -> Tuple[List, List[ExtractedImage]]:
        """Extract using unstructured.io API with image processing"""
        from unstructured_client import UnstructuredClient
        from unstructured_client.models import operations, shared
        from unstructured.staging.base import elements_from_dicts
        
        client = UnstructuredClient(api_key_auth=self.api_key)
        
        with open(pdf_path, "rb") as f:
            files = shared.Files(
                content=f.read(),
                file_name=str(Path(pdf_path).name)
            )
        
        request = operations.PartitionRequest(
            shared.PartitionParameters(
                files=files,
                split_pdf_page=True,
                split_pdf_allow_failed=True,
                split_pdf_concurrency_level=15,
                # Extract images and tables
                extract_image_block_types=["Image", "Table"],
                # Additional parameters for better extraction
                chunking_strategy="by_title",
                max_characters=4000,
                new_after_n_chars=3800,
                overlap=200
            )
        )
        
        result = client.general.partition(request=request)
        
        # Process images
        images = []
        image_counter = 1
        
        for element in result.elements:
            if "image_base64" in element.get("metadata", {}):
                extracted_image = self.image_extractor.extract_and_save_image(element, image_counter)
                if extracted_image:
                    images.append(extracted_image)
                    image_counter += 1
        
        # Convert to unstructured elements format
        elements = elements_from_dicts(element_dicts=result.elements)
        
        return elements, images
    
    def _extract_with_local(self, pdf_path: str) -> Tuple[List, List[ExtractedImage]]:
        """Fallback to local extraction (without API)"""
        from unstructured.partition.pdf import partition_pdf
        import fitz
        
        self.logger.info("Using local extraction (no API key)")
        
        # Extract text elements
        elements = partition_pdf(
            filename=pdf_path,
            strategy="hi_res",
            infer_table_structure=True,
            extract_images_in_pdf=True,
            chunking_strategy="by_title",
            max_characters=4000,
            new_after_n_chars=3800,
            overlap=200
        )
        
        # Extract images manually using PyMuPDF
        images = self._extract_images_with_pymupdf(pdf_path)
        
        return elements, images
    
    def _extract_images_with_pymupdf(self, pdf_path: str) -> List[ExtractedImage]:
        """Extract images using PyMuPDF as fallback"""
        import fitz
        
        doc = fitz.open(pdf_path)
        images = []
        image_counter = 1
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    
                    if pix.n - pix.alpha < 4:  # Skip complex color spaces
                        # Save image
                        image_id = f"img_{image_counter:04d}"
                        filename = f"{image_id}.png"
                        filepath = self.images_dir / filename
                        
                        pix.save(str(filepath))
                        
                        # Create image object (no base64 for local extraction)
                        extracted_image = ExtractedImage(
                            image_id=image_id,
                            filename=filename,
                            base64_data="",  # Not available in local mode
                            element_type="Image",
                            page_number=page_num,
                            bbox=None  # Could extract from image metadata if needed
                        )
                        
                        images.append(extracted_image)
                        image_counter += 1
                    
                    pix = None
                    
                except Exception as e:
                    self.logger.warning(f"Failed to extract image on page {page_num}: {e}")
                    continue
        
        doc.close()
        return images
    
    def _elements_to_topics(self, elements, images: List[ExtractedImage]) -> List[QuestionBlock]:
        """Convert extracted elements to structured topics"""
        topics = []
        topic_counter = 1
        
        for element in elements:
            try:
                element_text = str(element)
                
                # Skip very short elements
                if len(element_text.strip()) < 50:
                    continue
                
                # Get page number
                page_num = getattr(element.metadata, 'page_number', 0) if hasattr(element, 'metadata') else 0
                
                # Check if this element has associated images
                page_images = [img for img in images if img.page_number == page_num]
                has_images = len(page_images) > 0
                
                # Classify question with image awareness
                classification = self.classifier.classify(element_text, has_images)
                
                # Extract subject
                subject = self._extract_subject(element_text)
                
                # Create topic ID
                topic_id = f"topic_{topic_counter:04d}"
                
                # Create enhanced topic
                topic = QuestionBlock(
                    question_type=classification.question_type,
                    content=element_text,
                    options=classification.extracted_options,
                    correct_answer=classification.correct_answer,
                    rationale=classification.rationale,
                    subject=subject,
                    page_number=page_num,
                    confidence_score=classification.confidence,
                    images=[],  # Will be populated by association logic
                    topic_id=topic_id
                )
                
                topics.append(topic)
                topic_counter += 1
                
            except Exception as e:
                self.logger.warning(f"Failed to process element: {e}")
                continue
        
        return topics
    
    def _extract_subject(self, text: str) -> Optional[str]:
        """Extract subject from text"""
        subject_patterns = [
            r'SUBJECT[:\s]+([^\n]+)',
            r'(?i)subject[:\s]+([^\n]+)',
            r'^([A-Z][A-Z\s]{5,50}):',  # ALL CAPS subjects
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                subject = match.group(1).strip()
                # Clean up subject text
                subject = re.sub(r'[^\w\s\'-]', '', subject)
                if len(subject) > 5:  # Valid subject should be reasonable length
                    return subject
        return None

def enhanced_validation(topics: List[QuestionBlock], images: List[ExtractedImage]) -> Dict[str, Any]:
    """Enhanced validation including image analysis"""
    total_topics = len(topics)
    total_images = len(images)
    
    if total_topics == 0:
        return {'error': 'No topics extracted'}
    
    # Count by question type
    type_counts = {}
    confidence_scores = []
    valid_topics = 0
    topics_with_images = 0
    image_associations = 0
    
    for topic in topics:
        # Count question types
        q_type = topic.question_type
        type_counts[q_type] = type_counts.get(q_type, 0) + 1
        
        # Track confidence
        confidence_scores.append(topic.confidence_score)
        
        # Count valid topics
        if topic.subject and topic.confidence_score > 0.3:
            valid_topics += 1
        
        # Count topics with images
        if topic.images and len(topic.images) > 0:
            topics_with_images += 1
            image_associations += len(topic.images)
    
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    
    return {
        'total_topics': total_topics,
        'total_images': total_images,
        'valid_topics': valid_topics,
        'topics_with_images': topics_with_images,
        'image_associations': image_associations,
        'success_rate': valid_topics / total_topics if total_topics > 0 else 0,
        'image_coverage': topics_with_images / total_topics if total_topics > 0 else 0,
        'question_type_distribution': type_counts,
        'average_confidence': avg_confidence,
        'confidence_range': {
            'min': min(confidence_scores) if confidence_scores else 0,
            'max': max(confidence_scores) if confidence_scores else 0
        }
    }

def main():
    """Main execution function with image processing"""
    print("🏗️ Enhanced NCLEX 311 PDF Extraction with Image Processing")
    print("=" * 70)
    
    # Check dependencies
    if not check_dependencies():
        return 1
    
    # Check for API key
    api_key = os.getenv("UNSTRUCTURED_API_KEY")
    if not api_key:
        print("⚠️  No UNSTRUCTURED_API_KEY found. Using local processing (limited image extraction).")
        print("   For best results, get an API key from https://unstructured.io")
        print()
    
    # Set up paths
    pdf_path = "docs/scratchpad/NCLEX 311 - 20240731.pdf"
    output_dir = Path("enhanced_extraction_with_images")
    output_dir.mkdir(exist_ok=True)
    
    # Check if PDF exists
    if not Path(pdf_path).exists():
        print(f"❌ PDF file not found: {pdf_path}")
        print("Please ensure the NCLEX 311 PDF is in the correct location.")
        return 1
    
    try:
        # Initialize extractor
        extractor = EnhancedPDFExtractor(api_key=api_key, output_dir=str(output_dir))
        
        # Extract content with images
        print(f"📄 Processing PDF with image extraction: {pdf_path}")
        topics, images = extractor.extract_content_with_images(pdf_path)
        
        # Enhanced validation
        print("✅ Validating extraction results with image analysis...")
        validation_report = enhanced_validation(topics, images)
        
        # Save results
        results_file = output_dir / "extraction_results_with_images.json"
        with open(results_file, 'w') as f:
            json.dump([asdict(topic) for topic in topics], f, indent=2, default=str)
        
        images_file = output_dir / "extracted_images_metadata.json"
        with open(images_file, 'w') as f:
            json.dump([asdict(image) for image in images], f, indent=2, default=str)
        
        validation_file = output_dir / "validation_report.json"
        with open(validation_file, 'w') as f:
            json.dump(validation_report, f, indent=2)
        
        # Print enhanced summary
        print("\n" + "="*70)
        print("📊 ENHANCED EXTRACTION SUMMARY")
        print("="*70)
        print(f"Total Topics Extracted: {validation_report['total_topics']}")
        print(f"Total Images Extracted: {validation_report['total_images']}")
        print(f"Valid Topics: {validation_report['valid_topics']}")
        print(f"Topics with Images: {validation_report['topics_with_images']}")
        print(f"Success Rate: {validation_report['success_rate']:.1%}")
        print(f"Image Coverage: {validation_report['image_coverage']:.1%}")
        print(f"Average Confidence: {validation_report['average_confidence']:.2f}")
        
        print("\n📋 Question Type Distribution:")
        for q_type, count in validation_report['question_type_distribution'].items():
            print(f"  {q_type}: {count}")
        
        print(f"\n💾 Results saved to:")
        print(f"  - Topics: {results_file}")
        print(f"  - Images: {images_file}")
        print(f"  - Images folder: {output_dir / 'images'}")
        print(f"  - Validation: {validation_file}")
        
        if validation_report['success_rate'] > 0.8 and validation_report['image_coverage'] > 0.3:
            print("\n🎉 Enhanced extraction successful! Topics and images ready for database import.")
        elif validation_report['success_rate'] > 0.8:
            print("\n✅ Text extraction successful! Image coverage could be improved.")
        else:
            print("\n⚠️ Extraction quality below optimal. Consider manual review.")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Enhanced extraction failed: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())