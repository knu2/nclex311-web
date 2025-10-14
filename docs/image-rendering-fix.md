# Image Rendering Fix - Concept Pages

## Issue Summary
When browsing concept pages, embedded medical images (ECG tracings, diagrams, etc.) were not displaying and were causing server errors.

## Root Cause

### Problem 1: Route Matching
The Next.js dynamic route `/concepts/[slug]` was matching **both** concept slugs AND image filenames.

When the markdown content referenced images like:
```markdown
![ECG Tracing](atrial_fibrillation_question_ecg.png)
```

Next.js would try to render a concept page with slug `atrial_fibrillation_question_ecg.png`, causing:
- Database queries for non-existent concepts
- Server errors logged 3x per image (due to React rendering cycles)
- Confusing error messages in development

### Problem 2: Relative Image Paths
Images in the database content use **relative paths** instead of **full Vercel Blob Storage URLs**.

**Current format in database:**
```markdown
![ECG](atrial_fibrillation_question_ecg.png)
```

**Should be:**
```markdown
![ECG](https://[blob-storage-url]/atrial_fibrillation_question_ecg.png)
```

## Solutions Implemented

### Solution 1: Block Image Files at Page Level ✅
**File:** `apps/web/src/app/concepts/[slug]/page.tsx`

Added a check to return 404 for any slug that looks like an image file:

```typescript
// Return 404 for image/asset files immediately
// This prevents the database query when browsers request missing images
if (/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|zip|css|js)$/i.test(slug)) {
  notFound();
}
```

**Result:**
- ✅ No more database queries for image files
- ✅ No more server errors
- ✅ Fast 404 response for missing images
- ✅ Page loads successfully despite missing images

### Solution 2: Graceful Image Fallback ✅
**File:** `apps/web/src/components/MarkdownContent.tsx`

Enhanced the image rendering component to:

1. **Transform relative paths** (if `NEXT_PUBLIC_IMAGE_BASE_URL` is set):
   ```typescript
   if (!imageSrc.startsWith('http') && !imageSrc.startsWith('/')) {
     imageSrc = `${imageBaseUrl}/${imageSrc}`;
   }
   ```

2. **Hide broken images gracefully**:
   ```typescript
   onError={(e) => {
     (e.target as HTMLImageElement).style.display = 'none';
     console.warn(`Failed to load image: ${imageSrc}`);
   }}
   ```

**Result:**
- ✅ Images that fail to load are hidden (no broken image icons)
- ✅ Page content displays properly
- ✅ Warnings logged for debugging
- ✅ Ready for future image URL configuration

## TODO: Permanent Fix

To properly display images, you need to:

### Option A: Update Database Content (Recommended)
Update all concept content in the database to use full Vercel Blob URLs:

```sql
-- Example: Update image references to use full URLs
UPDATE concepts 
SET content = REPLACE(
  content, 
  '![ECG](atrial_fibrillation_question_ecg.png)',
  '![ECG](https://your-vercel-blob-url/atrial_fibrillation_question_ecg.png)'
)
WHERE content LIKE '%atrial_fibrillation_question_ecg.png%';
```

**Steps:**
1. Upload images to Vercel Blob Storage
2. Get the full URLs for each image
3. Update database content to use full URLs
4. Test that images display correctly

### Option B: Configure Image Base URL (Temporary)
Add an environment variable for the image base URL:

```bash
# In .env.local
NEXT_PUBLIC_IMAGE_BASE_URL=https://your-vercel-blob-storage-url
```

Then relative paths will be automatically transformed to full URLs.

**Note:** This only works if all images are in the same Vercel Blob container.

## Testing

### Verify the Fix
1. Start production server: `npm run build && npm run start`
2. Navigate to a concept page with images
3. Check server logs - should see **NO** "Concept not found" errors
4. Check browser console - may see image load warnings (expected until images are uploaded)

### Expected Behavior
- ✅ Page loads successfully
- ✅ No server errors for image files
- ✅ Broken images are hidden (no ugly broken image icons)
- ✅ Text content displays properly
- ⚠️ Images don't show (until URLs are fixed or uploaded to Vercel Blob)

## Files Modified

1. `apps/web/src/app/concepts/[slug]/page.tsx`
   - Added image file extension check
   - Returns 404 before database query

2. `apps/web/src/components/MarkdownContent.tsx`
   - Added relative URL transformation
   - Added graceful error handling
   - Added error event logging

3. `apps/web/src/middleware.ts`
   - Added early 404 return for image requests under `/concepts/`
   - Prevents authentication checks for static assets

## Related Documentation

- Story 1.5.3: Concept Viewer with Markdown Rendering
  - `docs/stories/1.5.3.concept-viewer-markdown-rendering.md`
  - Specifies Vercel Blob Storage for images

- Story 1.6.1: Markdown Content Rendering  
  - `docs/stories/1.6.1.markdown-content-rendering.md`
  - Specifies image rendering requirements

## Performance Impact

**Before Fix:**
- 3-6 database queries per missing image
- Server errors logged repeatedly
- Confusing error output

**After Fix:**
- 0 database queries for image files
- Clean server logs
- Fast 404 responses

## Date
2025-10-14

## Status
✅ **Fixed** - Server errors resolved, graceful fallback implemented  
⚠️ **Pending** - Image URLs in database need to be updated to full Vercel Blob URLs
