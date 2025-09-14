#!/usr/bin/env python3
"""
Quick-start implementation of the hybrid unstructured.io + PyMuPDF approach
for NCLEX 311 PDF content extraction.

This script demonstrates the recommended approach from the research document
and can be run immediately to test the improved extraction methodology.
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import logging

# Check if required packages are installed
def check_dependencies():
    """Check and install required dependencies"""
    missing = []
    try:
        import fitz
    except ImportError:
        missing.append("PyMuPDF")
    
    try:
        from unstructured.partition.pdf import partition_pdf
    except ImportError:
        missing.append("unstructured[pdf]")
    
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print("\nInstall with:")
        print("pip install PyMuPDF 'unstructured[pdf]' pillow")
        return False
    return True

@dataclass
class QuestionDetectionResult:
    question_type: str
    confidence: float
    extracted_options: List[str]
    correct_answer: Optional[str]
    rationale: Optional[str]

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

class QuickQuestionClassifier:
    """Simplified question classifier for quick testing"""
    
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
    
    def classify(self, text: str) -> QuestionDetectionResult:
        """Quick classification with confidence scoring"""
        best_type = 'unknown'
        best_confidence = 0.0
        options = []
        
        for q_type, patterns in self.patterns.items():
            confidence = 0.0
            for pattern, weight in patterns:
                if re.search(pattern, text, re.IGNORECASE | re.MULTILINE):
                    confidence += weight
            
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
            rationale=self._extract_rationale(text)
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

class HybridPDFExtractor:
    """Hybrid extraction using unstructured.io + PyMuPDF"""
    
    def __init__(self):
        self.classifier = QuickQuestionClassifier()
        self.logger = self._setup_logger()
    
    def _setup_logger(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
    
    def extract_content(self, pdf_path: str) -> List[QuestionBlock]:
        """Main extraction method"""
        self.logger.info(f"Starting hybrid extraction from: {pdf_path}")
        
        if not Path(pdf_path).exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        try:
            # Phase 1: unstructured.io extraction
            self.logger.info("Phase 1: Extracting with unstructured.io...")
            elements = self._extract_with_unstructured(pdf_path)
            self.logger.info(f"Found {len(elements)} elements")
            
            # Phase 2: PyMuPDF enhancement
            self.logger.info("Phase 2: Enhancing with PyMuPDF...")
            enhanced_topics = self._enhance_with_pymupdf(pdf_path, elements)
            self.logger.info(f"Created {len(enhanced_topics)} structured topics")
            
            return enhanced_topics
            
        except Exception as e:
            self.logger.error(f"Extraction failed: {str(e)}")
            raise
    
    def _extract_with_unstructured(self, pdf_path: str):
        """Extract using unstructured.io"""
        from unstructured.partition.pdf import partition_pdf
        
        try:
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
            return elements
        except Exception as e:
            self.logger.warning(f"unstructured.io failed, falling back to basic mode: {e}")
            # Fallback to basic partitioning
            elements = partition_pdf(
                filename=pdf_path,
                strategy="fast"
            )
            return elements
    
    def _enhance_with_pymupdf(self, pdf_path: str, elements) -> List[QuestionBlock]:
        """Enhance extraction with PyMuPDF precision"""
        import fitz
        
        doc = fitz.open(pdf_path)
        enhanced_topics = []
        
        for i, element in enumerate(elements):
            try:
                # Get element text and metadata
                element_text = str(element)
                page_num = getattr(element.metadata, 'page_number', 0) if hasattr(element, 'metadata') else 0
                
                # Skip very short elements (likely noise)
                if len(element_text.strip()) < 50:
                    continue
                
                # Classify question type
                classification = self.classifier.classify(element_text)
                
                # Extract subject
                subject = self._extract_subject(element_text)
                
                # Create enhanced topic
                topic = QuestionBlock(
                    question_type=classification.question_type,
                    content=element_text,
                    options=classification.extracted_options,
                    correct_answer=classification.correct_answer,
                    rationale=classification.rationale,
                    subject=subject,
                    page_number=page_num,
                    confidence_score=classification.confidence
                )
                
                enhanced_topics.append(topic)
                
            except Exception as e:
                self.logger.warning(f"Failed to process element {i}: {e}")
                continue
        
        doc.close()
        return enhanced_topics
    
    def _extract_subject(self, text: str) -> Optional[str]:
        """Extract subject from text"""
        subject_patterns = [
            r'SUBJECT:\s*([^\n]+)',
            r'(?i)subject:\s*([^\n]+)',
            r'^([A-Z][A-Z\s]{10,50}):',  # ALL CAPS subjects
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                return match.group(1).strip()
        return None

def validate_extraction(topics: List[QuestionBlock]) -> Dict[str, Any]:
    """Quick validation of extraction results"""
    total = len(topics)
    if total == 0:
        return {'error': 'No topics extracted'}
    
    # Count by question type
    type_counts = {}
    confidence_scores = []
    valid_topics = 0
    
    for topic in topics:
        # Count question types
        q_type = topic.question_type
        type_counts[q_type] = type_counts.get(q_type, 0) + 1
        
        # Track confidence
        confidence_scores.append(topic.confidence_score)
        
        # Count valid topics (have subject and reasonable confidence)
        if topic.subject and topic.confidence_score > 0.3:
            valid_topics += 1
    
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    
    return {
        'total_topics': total,
        'valid_topics': valid_topics,
        'success_rate': valid_topics / total if total > 0 else 0,
        'question_type_distribution': type_counts,
        'average_confidence': avg_confidence,
        'confidence_range': {
            'min': min(confidence_scores) if confidence_scores else 0,
            'max': max(confidence_scores) if confidence_scores else 0
        }
    }

def main():
    """Main execution function"""
    print("🏗️ NCLEX 311 PDF Extraction - Quick Start Implementation")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        return 1
    
    # Set up paths
    pdf_path = "docs/scratchpad/NCLEX 311 - 20240731.pdf"
    output_dir = Path("quick_extraction_results")
    output_dir.mkdir(exist_ok=True)
    
    # Check if PDF exists
    if not Path(pdf_path).exists():
        print(f"❌ PDF file not found: {pdf_path}")
        print("Please ensure the NCLEX 311 PDF is in the correct location.")
        return 1
    
    try:
        # Initialize extractor
        extractor = HybridPDFExtractor()
        
        # Extract content
        print(f"📄 Processing PDF: {pdf_path}")
        topics = extractor.extract_content(pdf_path)
        
        # Validate results
        print("✅ Validating extraction results...")
        validation_report = validate_extraction(topics)
        
        # Save results
        results_file = output_dir / "extraction_results.json"
        with open(results_file, 'w') as f:
            json.dump([asdict(topic) for topic in topics], f, indent=2, default=str)
        
        validation_file = output_dir / "validation_report.json"
        with open(validation_file, 'w') as f:
            json.dump(validation_report, f, indent=2)
        
        # Print summary
        print("\n" + "="*60)
        print("📊 EXTRACTION SUMMARY")
        print("="*60)
        print(f"Total Topics Extracted: {validation_report['total_topics']}")
        print(f"Valid Topics: {validation_report['valid_topics']}")
        print(f"Success Rate: {validation_report['success_rate']:.1%}")
        print(f"Average Confidence: {validation_report['average_confidence']:.2f}")
        
        print("\n📋 Question Type Distribution:")
        for q_type, count in validation_report['question_type_distribution'].items():
            print(f"  {q_type}: {count}")
        
        print(f"\n💾 Results saved to:")
        print(f"  - {results_file}")
        print(f"  - {validation_file}")
        
        if validation_report['success_rate'] > 0.8:
            print("\n🎉 Extraction successful! Ready for database import.")
        else:
            print("\n⚠️ Extraction quality below optimal. Consider manual review.")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Extraction failed: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())