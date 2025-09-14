# NCLEX 311 PDF Layout Discovery

## Important Layout Information

**Critical Discovery**: The NCLEX 311 PDF uses a **two-page spread layout** where each PDF page contains two book pages displayed side by side.

### Layout Details

- **PDF Format**: Two-page spread (landscape orientation)
- **Book Pages per PDF Page**: 2 
- **Example**: Book pages 176-177 appear on PDF page 89
- **Layout**: Left side = even book page, Right side = odd book page

### Page Mapping

```
PDF Page 89 contains:
├── Left side: Book page 176 (Fifth's Disease)
└── Right side: Book page 177 (Herpes Zoster)
```

### Implications for Extraction

1. **Page Numbering**: Need to map between PDF pages and book pages
2. **Column Detection**: Critical for proper content separation
3. **Image Association**: Images must be associated with correct side/topic
4. **Topic Boundaries**: Each PDF page likely contains 2 complete topics

### Updated Test Parameters

- **Original assumption**: Test pages 175-177
- **Actual PDF pages**: Test PDF pages 88-90 (covers book pages ~174-180)
- **Target content**: Fifth's Disease (left) + Herpes Zoster (right) on PDF page 89

This layout discovery explains why our initial page-based tests weren't finding the expected content.