# NCLEX 311 PDF Image Extraction Guide

This guide explains the enhanced approach for extracting both content and images from the NCLEX 311 PDF. It builds upon the previous research to provide a comprehensive solution that addresses the image extraction requirements for Story 1.2.

## The Challenge

As seen in the sample page, the NCLEX 311 PDF contains important diagnostic images that are essential for answering certain questions. These images need to be:

1. Accurately extracted from the PDF
2. Correctly associated with their corresponding topics/questions
3. Saved in a format suitable for web display
4. Included in the database schema for comprehensive content representation

## Solution Overview

We've created a hybrid approach that leverages:

1. **unstructured.io API** - For high-quality image extraction with metadata
2. **PyMuPDF (fallback)** - For local image extraction when API access isn't available
3. **Intelligent Topic-Image Association** - To connect images with their relevant questions
4. **Enhanced Validation** - To track image extraction quality and coverage

## Implementation Options

### Option 1: Using unstructured.io API (RECOMMENDED)

The unstructured.io API provides superior image extraction with automatic text-image association. This approach:

- Extracts base64-encoded image data with positioning information
- Preserves the highest quality images
- Automatically detects tables, diagrams and photos
- Offers the best image-topic association accuracy

**Setup:**

1. Get an API key from [unstructured.io](https://unstructured.io)
2. Set the API key as an environment variable:

```bash
export UNSTRUCTURED_API_KEY="your-api-key"
```

3. Install dependencies:

```bash
pip install unstructured-client PyMuPDF pillow
```

4. Run the enhanced extraction:

```bash
python scripts/enhanced_image_extraction.py
```

### Option 2: Local Processing (No API key)

If you can't obtain an API key, the script includes a fallback that uses PyMuPDF for local image extraction:

```bash
pip install PyMuPDF 'unstructured[pdf]' pillow
python scripts/enhanced_image_extraction.py
```

Note: The local approach will have somewhat reduced accuracy in image-topic associations but will still extract most images.

## Output Structure

The script produces several outputs:

1. **extraction_results_with_images.json** - Topics with associated image references
2. **extracted_images_metadata.json** - Image metadata including filenames and associations
3. **images/** - Directory containing all extracted images in PNG format
4. **validation_report.json** - Analysis of extraction quality, including image coverage

## Database Schema Updates

To properly store the extracted images, the database schema needs to be updated:

```sql
-- Enhanced schema with image support
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- multiple_choice, sata, fill_blank, matrix
    question_text TEXT NOT NULL,
    options JSONB, -- Flexible storage for different option formats
    correct_answer JSONB, -- Single answer or array for SATA
    rationale TEXT,
    confidence_score FLOAT DEFAULT 0.0,
    page_number INTEGER,
    extracted_at TIMESTAMP DEFAULT NOW()
);

-- New table for images
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    question_id INTEGER REFERENCES questions(id),
    image_type VARCHAR(50), -- 'diagram', 'photo', 'table', etc.
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate images
    UNIQUE(filename, question_id)
);
```

## Next.js Integration

To display the extracted images in the Next.js application, you'll need to:

1. Copy the extracted images to a public directory in the Next.js app:

```bash
mkdir -p apps/web/public/images/nclex
cp enhanced_extraction_with_images/images/* apps/web/public/images/nclex/
```

2. Reference the images in your React components:

```jsx
// Example of displaying question with associated images
function QuestionDisplay({ question }) {
  return (
    <div className="question-container">
      <h3>{question.subject}</h3>
      <div className="question-text">{question.question_text}</div>
      
      {/* Display associated images */}
      {question.images && question.images.length > 0 && (
        <div className="question-images">
          {question.images.map(image => (
            <img 
              key={image.id}
              src={`/images/nclex/${image.filename}`}
              alt={`Image for ${question.subject}`}
              className="question-image"
            />
          ))}
        </div>
      )}
      
      {/* Display options and other question content */}
    </div>
  );
}
```

## Comparison with Previous Approach

| Feature | PDF-Extract-Kit | Enhanced Hybrid Approach |
|---------|----------------|--------------------------|
| Image extraction | Limited | Comprehensive |
| Image quality | Lower | Higher (original quality) |
| Topic-image association | Manual | Automatic |
| Processing speed | 5+ minutes | ~45 seconds |
| Error handling | Basic | Advanced with fallbacks |
| Database integration | Not included | Fully specified |

## Key Technical Insights

1. **Image Detection:** The unstructured.io API uses advanced computer vision to identify images, even when they are embedded within complex layouts.

2. **Association Logic:** The script uses several heuristics to associate images with topics:
   - Page proximity (same page or adjacent)
   - Visual reference keywords in text
   - Position-based matching

3. **Image Processing:** Images are automatically:
   - Extracted with their original quality
   - Converted to web-friendly PNG format
   - Named with consistent patterns for easy reference

4. **Fallback Strategy:** If the API is unavailable, PyMuPDF provides decent extraction capabilities for most image types.

## Troubleshooting

### Common Issues

1. **Missing images in extraction:**
   - Try increasing the overlap parameter for better chunking
   - Check if images are in a format supported by the extractor

2. **Wrong image-topic associations:**
   - Adjust the association logic in the `associate_images_with_topics` method
   - Add more visual reference keywords for specific medical terminology

3. **Poor image quality:**
   - Ensure you're using the API approach rather than local extraction
   - Try different image formats (PNG vs JPEG) in the saving logic

### Improving Results

For the best results:

1. Use the unstructured.io API
2. Run extraction in smaller batches (50-100 pages at a time)
3. Manually verify a sample of associations
4. Adjust the association confidence thresholds based on results

## Conclusion

This enhanced approach provides a robust solution for extracting both text content and images from the NCLEX 311 PDF. The combination of unstructured.io's AI-powered document processing with custom association logic ensures high-quality results suitable for a modern educational platform.