# Next.js 15 Async Params Fix

## Issue
After upgrading to Next.js 15, the notes API route was throwing warnings in the dev server:

```
Error: Route "/api/concepts/[slug]/notes" used `params.slug`. `params` should be awaited before using its properties.
```

## Root Cause
Next.js 15 introduced a breaking change where dynamic route parameters (`params`) are now asynchronous. This is part of Next.js's effort to improve static rendering and performance optimization.

### What Changed in Next.js 15
- `params` is now a Promise that must be awaited
- `searchParams` is also now asynchronous
- Dynamic APIs like `cookies()`, `headers()`, and `draftMode()` are affected
- This applies to:
  - Route handlers (API routes)
  - Server Components (pages and layouts)
  - Metadata APIs

## Solution

### Code Changes

**Before (Next.js 14 style):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const slug = params.slug; // ❌ Direct access
  // ... rest of code
}
```

**After (Next.js 15 style):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params; // ✅ Awaited access
  // ... rest of code
}
```

### Files Updated
- `src/app/api/concepts/[slug]/notes/route.ts`
  - Updated type signature for `params` from `{ slug: string }` to `Promise<{ slug: string }>`
  - Changed access pattern from `params.slug` to `const { slug } = await params`
  - Applied to all three HTTP methods: GET, POST, DELETE

### Additional Fix
Also fixed a minor bug where `error.errors` was incorrectly used instead of `error.issues` for ZodError validation errors.

## Benefits of Next.js 15's Async Params

1. **Better Static Rendering**: Next.js can now determine which parts of your route can be statically rendered before params are needed
2. **Performance**: Allows Next.js to optimize the rendering pipeline
3. **Consistency**: All dynamic APIs now follow the same async pattern
4. **Future-proofing**: Aligns with React Server Components best practices

## Migration Pattern

For any route handler with dynamic segments:

```typescript
// Old pattern
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
}

// New pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

## Testing
After applying the fix:
- ✅ No warnings in dev server
- ✅ Type checking passes
- ✅ Linting passes
- ✅ API endpoints work correctly

## Related Documentation
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Async Request APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [Dynamic Route Parameters](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

## Codemod Available
Next.js provides an automated codemod to help with this migration:

```bash
npx @next/codemod@canary next-async-request-api .
```

However, manual review is still recommended to ensure correct implementation.

## Date
December 2024
