# NCLEX311 Import System Documentation

## Overview

The NCLEX311 Import System is a comprehensive TypeScript-based toolchain for importing pre-extracted JSON files and medical images from the NCLEX311 book into the PostgreSQL database via Supabase. The system includes data validation, error handling, progress tracking, and rollback capabilities.

## Architecture

### Components

1. **Import Script** (`scripts/import-content.ts`) - Main import engine
2. **Validation Script** (`scripts/validate-import.ts`) - Post-import verification
3. **Rollback Script** (`scripts/rollback-import.ts`) - Import cleanup
4. **Database Schema** - PostgreSQL schema with proper relationships
5. **Test Suite** - Comprehensive unit tests

### Data Flow

```
JSON Files + Images → Import Script → Supabase DB + Vercel Blob Storage
                          ↓
                  Validation Script ← → Verification Reports
                          ↓
                 Rollback Script (if needed)
```

## Quick Start

### Prerequisites

- Node.js ≥18.0.0
- TypeScript environment configured
- Supabase database with proper schema
- Vercel Blob Storage configured
- Environment variables set up

### Basic Usage

```bash
# Run dry-run to simulate import
npm run import:dry-run

# Run actual import
npm run import

# Validate imported data
npm run validate-import

# Rollback if needed
npm run rollback-import
```

## Data Format Requirements

### JSON File Structure

The import system expects JSON files following this structure:

```typescript
interface BookPageData {
  book_page: number;
  pdf_page: number;
  content: {
    main_concept: string;
    key_points: string;
    questions: BookQuestion[];
    images: BookImage[];
  };
  extraction_metadata: {
    timestamp: string;
    extraction_confidence: 'high' | 'medium' | 'low';
    human_validated: boolean;
    notes: string;
    category: string; // Chapter name
    reference: string;
  };
}
```

### Question Format

```typescript
interface BookQuestion {
  id: number;
  type: 'SATA' | 'MC' | 'FITB' | 'MATRIX';
  question_text: string;
  options: string[];
  correct_answer: string; // "1,3" for multiple correct
  rationale: string;
}
```

### Image Format

```typescript
interface BookImage {
  filename: string;
  description: string;
  medical_relevance: 'high' | 'medium' | 'low';
  content_type: string;
  context: string;
}
```

## Chapter Mapping

The system automatically maps extraction metadata categories to predefined chapters:

| Chapter # | Title                                    | Pages      |
| --------- | ---------------------------------------- | ---------- |
| 1         | Management of Care                       | 16 to 47   |
| 2         | Safety and Infection Control             | 50 to 62   |
| 3         | Psychosocial Integrity                   | 66 to 82   |
| 4         | Pharmacological and Parenteral Therapies | 86 to 149  |
| 5         | Physiological Adaptation                 | 152 to 245 |
| 6         | Reduction of Risk Potential              | 248 to 294 |
| 7         | Health Promotion and Maintenance         | 299 to 332 |
| 8         | Basic Care and Comfort                   | 336 to 365 |

## Import Process

### 1. Environment Validation

- Verifies data and images directories exist
- Tests database connectivity
- Validates Supabase configuration

### 2. Chapter Creation

- Creates all 8 chapters with proper slugs
- Handles existing chapters gracefully
- Maps categories to chapter IDs

### 3. Content Processing

- Processes JSON files in page order
- Creates concepts from main_concept + key_points
- Imports questions with type mapping:
  - `SATA` → `SELECT_ALL_THAT_APPLY`
  - `MC` → `MULTIPLE_CHOICE`
  - `FITB` → `FILL_IN_THE_BLANK`
  - `MATRIX` → `MATRIX_GRID`

### 4. Image Upload

- Uploads images to Vercel Blob Storage
- Extracts actual dimensions using Sharp
- Associates images with concepts/questions
- Preserves all metadata

### 5. Progress Tracking

- Real-time progress reporting
- Comprehensive error collection
- Detailed final statistics

## CLI Reference

### Import Script

```bash
npx tsx scripts/import-content.ts [options]

Options:
  -d, --data-dir <path>     Directory containing JSON files (default: python/final_output)
  -i, --images-dir <path>   Directory containing images (default: python/final_output/images)
  --dry-run                 Simulate without database changes
  --help                    Show help
```

### Validation Script

```bash
npx tsx scripts/validate-import.ts [options]

Options:
  -s, --spot-check <count>  Number of records to spot check (default: 5)
  -f, --full-report         Show detailed issues and spot checks
  --help                    Show help
```

### Rollback Script

```bash
npx tsx scripts/rollback-import.ts [options]

Options:
  --confirm     Actually delete data (DESTRUCTIVE!)
  --dry-run     Simulate rollback
  --help        Show help
```

## NPM Scripts

```json
{
  "import": "Import with default paths",
  "import:dry-run": "Simulate import",
  "validate-import": "Quick validation report",
  "validate-import:full": "Detailed validation with 10 spot checks",
  "rollback-import": "Simulate rollback",
  "rollback-import:confirm": "Actually rollback (DESTRUCTIVE!)"
}
```

## Error Handling

### Common Errors

1. **JSON Parse Errors**: Invalid or malformed JSON files
   - **Solution**: Fix JSON syntax in source files

2. **Database Connection**: Missing environment variables
   - **Solution**: Ensure `.env.local` has Supabase credentials

3. **Image Upload Failures**: Network or Vercel Blob issues
   - **Solution**: Check network connectivity and Vercel configuration

4. **Foreign Key Violations**: Orphaned records
   - **Solution**: Use rollback script and fix data relationships

### Error Recovery

1. Review error report from import
2. Fix underlying issues
3. Use rollback script if needed
4. Re-run import with fixes

## Validation System

The validation system performs comprehensive checks:

### Data Integrity Checks

- Questions have correct answers
- Concepts have questions
- No orphaned records
- Proper foreign key relationships

### Relationship Validation

- Chapter-concept linkages
- Concept-question associations
- Image-content connections

### Spot Checks

- Random sampling of records
- Field completeness validation
- Data quality verification

### Image Validation

- Blob URL accessibility (sample check)
- Metadata completeness
- Association validation

## Database Schema

### Core Tables

- **chapters**: Course chapters with titles and slugs
- **concepts**: Learning concepts with Markdown content
- **questions**: Quiz questions with types and rationales
- **options**: Answer choices with correct flags
- **images**: Medical images with blob URLs and metadata

### Key Relationships

```sql
concepts.chapter_id → chapters.id
questions.concept_id → concepts.id
options.question_id → questions.id
images.concept_id → concepts.id (nullable)
images.question_id → questions.id (nullable)
```

### Constraints

- Images can be associated with concepts OR questions OR standalone
- Questions must have at least one option
- CASCADE deletion maintains referential integrity

## Testing

### Unit Tests

Located in `__tests__/import-content.test.ts`:

- JSON validation and parsing
- Chapter slug generation
- Question type mapping
- Option handling logic
- Image processing
- Error handling scenarios
- Progress tracking

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Test Coverage

The test suite covers:

- ✅ Data validation logic
- ✅ Type mappings
- ✅ Error scenarios
- ✅ Progress tracking
- ✅ Relationship validation
- ✅ Image processing

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Process multiple records in transactions
2. **Connection Pooling**: Supabase client handles connections efficiently
3. **Progress Tracking**: Minimal overhead logging
4. **Error Recovery**: Continue processing on non-fatal errors

### Resource Usage

- **Memory**: Processes files one at a time to minimize memory usage
- **Network**: Uploads images concurrently when possible
- **Database**: Uses prepared statements via Supabase client

### Scalability

The system can handle:

- ✅ Hundreds of JSON files
- ✅ Thousands of questions
- ✅ Large image collections
- ✅ Multiple concurrent imports (with different data sets)

## Troubleshooting

### Common Issues

1. **"Invalid JSON structure"**: Files don't match expected format
   - Check JSON schema against examples
   - Validate with JSON linter

2. **"Database connection failed"**: Environment or network issues
   - Verify `.env.local` configuration
   - Test Supabase connection manually

3. **"Image upload failed"**: Vercel Blob or network problems
   - Check Vercel configuration
   - Verify image file paths and permissions

4. **"Permission denied"**: File system access issues
   - Check directory permissions
   - Ensure paths are accessible

### Debug Mode

Enable verbose logging by checking the console output during dry-runs. All errors are collected and reported at the end.

### Getting Help

1. Check this documentation
2. Review error messages and logs
3. Run validation script for data integrity issues
4. Use dry-run mode to test without side effects

## Best Practices

### Before Import

1. ✅ Run dry-run first to identify issues
2. ✅ Backup database if needed
3. ✅ Verify all JSON files are valid
4. ✅ Check image files are accessible
5. ✅ Ensure sufficient storage space

### During Import

1. ✅ Monitor progress output
2. ✅ Don't interrupt the process
3. ✅ Check for error messages
4. ✅ Verify network connectivity

### After Import

1. ✅ Run validation script
2. ✅ Spot-check imported data
3. ✅ Verify image accessibility
4. ✅ Test application functionality
5. ✅ Document any issues found

## Future Enhancements

### Planned Features

- [ ] Resume interrupted imports
- [ ] Parallel processing for large datasets
- [ ] Advanced image optimization
- [ ] Custom validation rules
- [ ] Export functionality
- [ ] Import scheduling

### Contributing

When modifying the import system:

1. Update relevant tests
2. Update this documentation
3. Test with sample data
4. Verify backward compatibility
5. Update CLI help text
