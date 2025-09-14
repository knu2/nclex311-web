# NCLEX 311 Python Data Processing

This directory contains Python-based tools for extracting and analyzing content from the NCLEX 311 PDF educational materials. The primary workflow uses an AI-powered extraction agent (v3) with human validation to produce structured JSON files and associated medical images for database import.

## Directory Structure

```
python/
├── README.md                    # This file
├── pyproject.toml              # Python project configuration (uv)
├── uv.lock                     # Dependency lock file
├── requirements.txt            # Alternative dependency list
├── .python-version            # Python version specification
├── .venv/                     # Python virtual environment (uv managed)
├── prompts/                   # AI extraction agent system prompts
│   ├── nclex_extraction_agent_prompt.md      # Original system prompt
│   └── nclex_extraction_agent_v3_prompt.md   # Enhanced v3 system prompt
├── scripts/                   # CLI tools and extraction scripts
│   ├── extract_text_cli.py               # Text extraction CLI tool
│   ├── extract_images_cli.py             # Image extraction CLI tool
│   ├── analyze_page_cli.py               # Page analysis CLI tool
│   ├── extract_images_comprehensive.py   # Comprehensive image extraction
│   ├── analyze_extracted_images.py       # Image analysis and filtering
│   ├── enhanced_image_extraction.py      # Enhanced extraction (legacy)
│   ├── debug_image_extraction.py         # Debug utilities
│   ├── test_image_extraction.py         # Test scripts
│   ├── quick_start_extraction.py        # Quick start example
│   ├── verify_setup.py                  # Environment verification
│   ├── IMAGE_EXTRACTION_README.md       # Image extraction documentation
│   └── PDF_LAYOUT_NOTES.md              # PDF layout analysis notes
├── python/                    # Additional CLI tools documentation
│   └── CLI_TOOLS_STATUS.md             # CLI tools status and usage
├── extracted_content*/        # Text extraction outputs (gitignored)
├── extracted_images/          # Image extraction outputs (gitignored)
├── final_output/              # Final structured JSON files (gitignored)
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

### V3 Extraction Agent Workflow (Recommended)

The primary workflow uses the v3 extraction agent with interactive CLI tools:

```bash
# 1. Analyze PDF page structure
uv run python scripts/analyze_page_cli.py --pdf-page 78

# 2. Extract text content
uv run python scripts/extract_text_cli.py --pdf-pages 78 --output ./extracted_content_78

# 3. Extract images (if medical content is present)
uv run python scripts/extract_images_cli.py --pdf-pages 78 --output ./extracted_images_78

# 4. Use the v3 system prompt (prompts/nclex_extraction_agent_v3_prompt.md) with an AI agent
# to interactively create structured JSON files in final_output/
```

### Legacy Extraction Methods

```bash
# Direct comprehensive image extraction (legacy)
uv run python scripts/extract_images_comprehensive.py --pages 89-92

# Analyze extracted images
uv run python scripts/analyze_extracted_images.py
```

## Key Scripts

### V3 Extraction Agent CLI Tools

#### `extract_text_cli.py`
Structured text extraction using unstructured.io API:
- Extracts text elements with types and metadata
- Works directly with PDF page numbers
- Returns structured JSON for AI agent processing

#### `extract_images_cli.py`
Comprehensive image extraction with computer vision:
- Detects image regions and filters out text
- Analyzes medical content relevance
- Provides quality scores and metadata
- Organizes images with extraction confidence

#### `analyze_page_cli.py`
PDF page structure analysis:
- Analyzes text blocks and embedded images
- Detects medical terminology and concepts
- Recommends extraction strategy
- Provides page-level insights

### Legacy Scripts

#### `extract_images_comprehensive.py`
Direct image extraction using multiple techniques:
- Direct PDF image extraction (PyMuPDF)
- Computer vision-based region detection
- OCR text masking
- Quality assessment and scoring

#### `analyze_extracted_images.py`
Image analysis and filtering:
- Content quality assessment
- Visual complexity scoring
- Automatic categorization
- Filtered results generation

## Dependencies

The project uses `uv` for dependency management. Key dependencies:
- `unstructured[pdf]` - Structured text extraction API
- `pymupdf` - PDF processing and direct image extraction
- `opencv-python` - Computer vision and image processing
- `pytesseract` - OCR for text region detection
- `pdf2image` - PDF to image conversion
- `pillow` - Image analysis and processing
- `requests` - API calls to unstructured.io

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

## V3 Extraction Agent Workflow

The recommended workflow uses an AI agent with the v3 system prompt for interactive content extraction:

### Process Overview
1. **Human selects PDF page range** for extraction
2. **CLI tools extract raw content**:
   - `analyze_page_cli.py` - Understand page structure
   - `extract_text_cli.py` - Get structured text elements
   - `extract_images_cli.py` - Extract medical images (if present)
3. **AI agent processes content** using v3 system prompt:
   - Analyzes extracted text and images
   - Identifies nursing concepts and questions
   - Creates structured JSON with markdown formatting
   - Links images to relevant content
4. **Human validates and refines** the structured output
5. **Final JSON files** are saved to `final_output/` directory

### Output Format
- **Structured JSON files**: `book_page_XXX.json` with concepts, questions, and rationales
- **Medical images**: PNG files with metadata and quality scores
- **Complete metadata**: Extraction confidence, medical content descriptions

### Key Benefits
- **Human oversight**: Ensures accuracy of medical content
- **Flexible processing**: Handles various question types and content formats
- **Quality control**: AI agent validates completeness and formatting
- **Batch processing**: Can process multiple pages efficiently

## Integration with Main Application

### Data Flow
1. **PDF Processing**: Use CLI tools to extract raw text and images from NCLEX 311 PDF
2. **AI-Assisted Structuring**: V3 extraction agent creates structured JSON with human validation
3. **Database Import**: TypeScript script imports JSON files and uploads images to Vercel Blob Storage
4. **Application Integration**: Structured content is available to Next.js application through database

### File Paths
- **Source PDFs**: `../shared/pdfs/`
- **Extraction Scripts**: `python/scripts/`
- **V3 System Prompts**: `python/prompts/`
- **Raw Extraction Output**: `python/extracted_content*/` (gitignored)
- **Final Structured Content**: `python/final_output/` (gitignored)
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