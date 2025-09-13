# NCLEX 311 Python Data Processing

This directory contains all Python-based data processing tools for extracting and analyzing content from the NCLEX 311 PDF educational materials.

## Directory Structure

```
python/
├── README.md                    # This file
├── pyproject.toml              # Python project configuration (uv)
├── uv.lock                     # Dependency lock file
├── requirements.txt            # Alternative dependency list
├── .python-version            # Python version specification
├── .venv/                     # Python virtual environment (uv managed)
├── scripts/                   # All Python scripts
│   ├── extract_images_comprehensive.py    # Main image extraction
│   ├── analyze_extracted_images.py        # Image analysis and filtering
│   ├── enhanced_image_extraction.py       # Enhanced extraction (legacy)
│   ├── debug_image_extraction.py          # Debug utilities
│   ├── test_image_extraction.py          # Test scripts
│   └── quick_start_extraction.py         # Quick start example
├── data/                      # All extraction results and outputs
│   ├── extracted_images_comprehensive/    # Main extraction results
│   ├── debug_extraction_results/          # Debug outputs
│   └── test_image_extraction_results/     # Test results
└── docs/                      # Python-specific documentation
    ├── research_pdf_extraction_alternatives.md
    ├── pdf_image_extraction_README.md
    └── image_extraction_report.md
```

## Quick Start

### Setup Environment
```bash
cd python
uv sync  # Install dependencies using uv
```

### Extract Images
```bash
# Extract from default PDF (pages 89-92)
uv run python scripts/extract_images_comprehensive.py

# Extract specific pages
uv run python scripts/extract_images_comprehensive.py --pages 89-95

# Extract with custom paths
uv run python scripts/extract_images_comprehensive.py \
  --pdf "../shared/pdfs/NCLEX 311 - 20240731.pdf" \
  --output "data/my_extraction" \
  --pages 89-92
```

### Analyze Results
```bash
# Analyze extracted images and create filtered results
uv run python scripts/analyze_extracted_images.py

# Custom analysis
uv run python scripts/analyze_extracted_images.py \
  --results "data/extracted_images_comprehensive/extraction_results.json" \
  --min-score 50
```

## Key Scripts

### `extract_images_comprehensive.py`
Main image extraction script using multiple techniques:
- Direct PDF image extraction (PyMuPDF)
- Computer vision-based region detection
- OCR text masking
- Quality assessment and scoring

### `analyze_extracted_images.py`
Image analysis and filtering:
- Content quality assessment
- Visual complexity scoring
- Automatic categorization
- Filtered results generation

### `enhanced_image_extraction.py`
Legacy enhanced extraction script with unstructured.io integration.

## Dependencies

The project uses `uv` for dependency management. Key dependencies:
- `pymupdf` - PDF processing and direct image extraction
- `opencv-python` - Computer vision and image processing
- `pytesseract` - OCR for text region detection
- `pdf2image` - PDF to image conversion
- `pillow` - Image analysis and processing

## System Requirements

- **Python 3.8+**
- **Poppler** (for pdf2image): `brew install poppler` on macOS
- **Tesseract** (for OCR): `brew install tesseract` on macOS

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```bash
UNSTRUCTURED_API_KEY=your_api_key_here  # For enhanced extraction
```

### Script Parameters
Common parameters can be adjusted in the scripts:
- `min_size`: Minimum region dimensions (default: 100)
- `max_ratio`: Maximum aspect ratio (default: 10)
- `confidence_threshold`: Minimum contour confidence (default: 0.3)
- `dpi`: Page rendering resolution (default: 200)

## Output Formats

### Extraction Results
- **JSON metadata**: Complete extraction details and statistics
- **PNG images**: Extracted visual regions
- **Quality scores**: Ranking by likelihood of visual content
- **Page screenshots**: Full page references

### Directory Structure
```
data/extracted_images_comprehensive/
├── extraction_results.json      # Complete metadata
├── direct_extraction/           # Direct PDF extraction (often empty)
├── detected_regions/            # All detected regions
├── page_screenshots/            # Full page images
└── filtered_images/             # High-quality candidates
    ├── manifest.json           # Filtered metadata
    └── score_XX_*.png          # Images sorted by score
```

## Integration with Main Application

### Data Flow
1. **PDF Processing**: Extract text and images from NCLEX 311 PDF
2. **Content Analysis**: Analyze and categorize extracted content
3. **Database Preparation**: Format data for application integration
4. **API Integration**: Provide processed content to Next.js application

### File Paths
- **Source PDFs**: `../shared/pdfs/`
- **Processed Data**: `python/data/`
- **Scripts**: `python/scripts/`
- **Documentation**: `python/docs/`

## Troubleshooting

### Common Issues
1. **Import errors**: Ensure you're in the python directory and using `uv run`
2. **Missing dependencies**: Run `uv sync` to install all dependencies
3. **PDF not found**: Check the path in `../shared/pdfs/`
4. **Poor extraction**: Adjust parameters in script files

### Getting Help
1. Check the detailed documentation in `docs/`
2. Review extraction logs for specific errors
3. Test with the provided example (pages 89-92)
4. Ensure all system dependencies are installed

## Development

### Adding New Scripts
1. Create script in `scripts/` directory
2. Add appropriate imports and error handling
3. Follow the existing patterns for argument parsing
4. Update this README with usage instructions

### Testing
```bash
# Run test extraction
uv run python scripts/test_image_extraction.py

# Debug extraction issues
uv run python scripts/debug_image_extraction.py
```

---

*This directory is part of the NCLEX 311 BMad project for processing educational PDF content.*