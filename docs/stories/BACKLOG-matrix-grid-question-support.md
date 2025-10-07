# Story: Matrix Grid Question Type Support

## Status
**Draft - Backlog**

## Story Priority
**P3 - Nice to Have** (LOW severity, affects only 1 concept currently)

## Story
**As a** user studying concepts with complex decision-making scenarios,  
**I want** to answer matrix grid questions that test my ability to classify interventions across multiple categories,  
**so that** I can practice critical thinking skills for clinical scenarios.

## Background & Context

This story addresses technical debt identified during Story 1.5.4 implementation (2025-10-07). Matrix grid questions are a valid NCLEX-style question type where users classify options (e.g., nursing interventions) into categories (e.g., "Indicated" vs "Contraindicated").

**Current Situation:**
- Frontend components exist but cannot function correctly due to data structure limitations
- Database schema doesn't support the complex structure needed for matrix questions
- Only 1 concept currently uses matrix_grid type: "Abruptio Placenta" (book page 18)
- Import process incorrectly marks all options as correct, making validation impossible

**Example Question Structure (from source JSON):**
```json
{
  "type": "matrix_grid",
  "question_text": "Classify the interventions...",
  "options": [
    "1. Place client in lateral position",
    "2. Place client in supine position",
    "3. Perform abdominal examination",
    "4. Perform vaginal examination",
    "5. Monitor maternal vital signs",
    "6. Monitor fetal heart rate"
  ],
  "matrix_categories": ["Indicated", "Contraindicated"],
  "correct_answer": {
    "Indicated": ["1", "5", "6"],
    "Contraindicated": ["2", "3", "4"]
  }
}
```

**Why This Matters:**
- Matrix grid questions are common in NCLEX-RN exams
- They test higher-order thinking and clinical judgment
- Future content may include more matrix questions
- Complete feature parity with NCLEX question types

## Acceptance Criteria

### Backend Changes
1. Database schema updated to support matrix question structure:
   - Add `matrix_categories` field to Question model (array of strings)
   - Update QuestionOption model to include `category` and `row_position` fields
   - Store structured correct answers as JSONB type
2. JSON import process correctly parses matrix_grid questions:
   - Extracts matrix_categories from source data
   - Maps options to categories based on correct_answer structure
   - Sets is_correct flag based on structured answer mapping
3. API responses include all matrix metadata:
   - matrixRows, matrixColumns, matrixCategories fields populated
   - Correct answer structure preserved for validation
4. Backward compatibility maintained:
   - Existing question types continue to work unchanged
   - Database migration handles existing data gracefully

### Frontend Changes
5. MatrixQuestion component properly handles structured data:
   - Renders table/grid layout based on matrixCategories
   - Allows selection of one category per option (radio buttons)
   - Visual feedback shows which category each option belongs to
6. Answer validation uses structured correct_answer format:
   - Compares user selections against category mappings
   - Provides detailed feedback on which classifications were incorrect
7. Unit tests cover matrix-specific logic:
   - Rendering tests for grid layout
   - Selection interaction tests
   - Validation tests with structured answers
   - Edge cases (missing categories, malformed data)

### Data & Testing
8. Affected concept re-imported with correct data structure:
   - "Abruptio Placenta" concept functional with matrix question
   - Question displays and validates correctly in UI
9. Manual testing confirms full user flow:
   - Question renders in readable grid format
   - User can classify all options into categories
   - Submit button validation works
   - Correct/incorrect feedback displays properly
   - Rationale and Key Points show after submission

## Tasks / Subtasks

- [ ] Task 1: Update Database Schema (Backend)
  - [ ] Add migration for matrix-specific fields
  - [ ] Update Drizzle schema definitions
  - [ ] Add JSONB column for structured correct_answer
  - [ ] Test schema changes with sample data
  
- [ ] Task 2: Refactor Question Import Process (Backend)
  - [ ] Update JSON parser to detect matrix_grid questions
  - [ ] Extract matrix_categories from source data
  - [ ] Parse structured correct_answer into database format
  - [ ] Set QuestionOption fields correctly for matrix questions
  - [ ] Add validation for matrix data structure
  
- [ ] Task 3: Update API Endpoints (Backend)
  - [ ] Modify GET /api/concepts/{slug} to include matrix metadata
  - [ ] Update question serialization to include matrixRows, matrixColumns, matrixCategories
  - [ ] Ensure correct_answer structure preserved in responses
  - [ ] Add API tests for matrix question responses
  
- [ ] Task 4: Enhance MatrixQuestion Component (Frontend)
  - [ ] Update component to accept structured correct_answer prop
  - [ ] Implement proper grid rendering based on categories
  - [ ] Add radio button groups for each option row
  - [ ] Style grid for mobile responsiveness
  - [ ] Handle edge cases (missing data, parse errors)
  
- [ ] Task 5: Update Validation Logic (Frontend)
  - [ ] Modify InlineQuiz validation for structured matrix answers
  - [ ] Compare user selections against category mappings
  - [ ] Provide detailed feedback on incorrect classifications
  - [ ] Update error handling for malformed matrix data
  
- [ ] Task 6: Add Comprehensive Tests
  - [ ] Unit tests for MatrixQuestion component
  - [ ] Integration tests for matrix question validation
  - [ ] API tests for matrix question endpoints
  - [ ] E2E test for complete user flow
  
- [ ] Task 7: Re-import Affected Content
  - [ ] Re-run import process for "Abruptio Placenta" concept
  - [ ] Validate database records match source JSON structure
  - [ ] Verify API responses include all matrix metadata
  - [ ] Test question in UI manually
  
- [ ] Task 8: Documentation & Cleanup
  - [ ] Update technical documentation with matrix schema
  - [ ] Document import process for matrix questions
  - [ ] Add code comments for complex validation logic
  - [ ] Update Story 1.5.4 to mark technical debt resolved

## Dev Notes

### Database Schema Changes Required

**Question Table:**
```typescript
{
  // Existing fields...
  matrix_categories: string[] | null,  // ["Indicated", "Contraindicated"]
}
```

**QuestionOption Table:**
```typescript
{
  // Existing fields...
  category: string | null,  // Which category this option belongs to
  row_position: number | null,  // For ordering in matrix display
}
```

**Alternative Approach:** Store entire matrix structure as JSONB field on Question table to avoid complex option relationships.

### Import Process Logic

```typescript
if (question.type === 'matrix_grid') {
  const correctAnswer = question.correct_answer; // Object
  const categories = question.matrix_categories; // Array
  
  // For each option, determine which category it belongs to
  question.options.forEach((optionText, index) => {
    const optionId = (index + 1).toString();
    let category = null;
    
    // Find which category contains this option ID
    for (const [cat, optionIds] of Object.entries(correctAnswer)) {
      if (optionIds.includes(optionId)) {
        category = cat;
        break;
      }
    }
    
    // Create option with category mapping
    createQuestionOption({
      text: optionText,
      category: category,
      row_position: index,
      is_correct: true // All options are "correct" in their category
    });
  });
}
```

### Frontend Component Updates

**MatrixQuestion Props:**
```typescript
interface MatrixQuestionProps {
  question: {
    // ...existing fields
    matrixCategories: string[];  // ["Indicated", "Contraindicated"]
    correctAnswer: string;  // JSON string of structured answer
  };
  // ...other props
}
```

**Validation Logic:**
```typescript
const validateMatrixAnswer = (
  userAnswer: Record<string, string>,  // { "option1": "Indicated", "option2": "Contraindicated" }
  correctAnswer: Record<string, string[]>  // { "Indicated": ["1", "5", "6"], ... }
): boolean => {
  // For each option, check if user selected the correct category
  return Object.entries(userAnswer).every(([optionId, selectedCategory]) => {
    return correctAnswer[selectedCategory]?.includes(optionId);
  });
};
```

### Migration Strategy

1. **Phase 1:** Backend schema changes + migration
2. **Phase 2:** Import process updates
3. **Phase 3:** API endpoint updates
4. **Phase 4:** Frontend component enhancements
5. **Phase 5:** Re-import affected content
6. **Phase 6:** Testing and validation

### Testing Strategy

**Database Tests:**
- Schema migration applies cleanly
- Matrix questions insert correctly
- Query performance not degraded

**Import Tests:**
- Matrix JSON parsed correctly
- Options mapped to categories properly
- Malformed data handled gracefully

**API Tests:**
- Matrix metadata included in responses
- Correct answer structure preserved
- Backward compatibility maintained

**Frontend Tests:**
- Grid renders correctly for 2, 3, 4+ categories
- Selection state managed properly
- Validation logic works with structured answers
- Error states display appropriately

### Related Stories & Docs

- **Parent Story:** Story 1.5.4 (Inline Quiz Interaction) - COMPLETE
- **Technical Debt Source:** Post-production issue discovered 2025-10-07
- **See:** Story 1.5.4 lines 790-882 for detailed root cause analysis
- **Epic:** Epic 1.5 (Chapter/Concept Viewer & Quizzing)

## Dependencies

**Blocked By:**
- None - can be implemented independently

**Blocks:**
- Future content imports with matrix_grid questions
- Complete NCLEX question type parity

**Coordinates With:**
- Backend team for schema changes
- Data team for re-import process
- QA team for comprehensive testing

## Effort Estimate

**Total:** 2-3 days

**Breakdown:**
- Backend (schema + import): 1 day
- Frontend (component + validation): 1 day  
- Testing & validation: 0.5 day
- Re-import & verification: 0.5 day

## Success Metrics

- [ ] "Abruptio Placenta" concept matrix question works end-to-end
- [ ] All database tests pass
- [ ] All frontend unit tests pass
- [ ] Manual QA confirms correct user flow
- [ ] No regression in existing question types
- [ ] Import process handles matrix questions automatically

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-07 | 1.0 | Created backlog story for matrix_grid support | Sarah (Product Owner) |

## Notes

**Priority Rationale:**
- P3 (nice-to-have) because only 1 concept currently affected
- Can be elevated to P2 or P1 if more matrix questions discovered in content
- Required for complete NCLEX feature parity long-term

**Alternative Solutions Considered:**
1. **Skip matrix questions entirely** - Not recommended, common NCLEX type
2. **Convert to Select All That Apply** - Loses pedagogical value of classification
3. **Manual data fixes** - Not scalable, doesn't fix root cause

**Recommendation:** Implement properly when data pipeline work is scheduled, likely in Sprint 3-4 timeframe.
