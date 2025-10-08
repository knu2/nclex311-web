# Logout Functionality Fix

## Issue
The logout functionality in the MainLayout component was not working because it was calling a non-existent API endpoint `/api/auth/logout`.

## Root Cause
The application uses NextAuth for authentication, which provides its own built-in signout mechanism via the `signOut()` function from `next-auth/react`. However, the MainLayout component was manually trying to call a logout API endpoint that was never created.

### What We Found
1. **NextAuth Configuration**: The app uses NextAuth with the catch-all route at `/api/auth/[...nextauth]/route.ts`
2. **Missing Endpoint**: No `/api/auth/logout` endpoint existed
3. **Wrong Pattern**: The MainLayout was using `fetch('/api/auth/logout')` instead of NextAuth's `signOut()` function
4. **Working Example**: The auth-demo page (`src/app/auth-demo/page.tsx`) correctly uses `signOut()` from next-auth/react

## Solution

### Code Changes

#### 1. MainLayout Component (`src/components/Layout/MainLayout.tsx`)

**Before:**
```typescript
// Handle logout
const handleLogout = async (): Promise<void> => {
  handleUserMenuClose();
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });

    if (response.ok) {
      router.push('/login');
    } else {
      console.error('Logout failed');
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
};
```

**After:**
```typescript
import { signOut } from 'next-auth/react';

// Handle logout
const handleLogout = async (): Promise<void> => {
  handleUserMenuClose();
  try {
    await signOut({
      callbackUrl: '/login',
      redirect: true,
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
};
```

#### 2. Test Files Updated

Both test files were updated to mock `signOut` from next-auth/react instead of mocking fetch:

- `__tests__/components/Layout/MainLayout.test.tsx`
- `__tests__/components/Layout/MainLayout.integration.test.tsx`

**Test Mock Pattern:**
```typescript
import { signOut } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

// In test body
const mockSignOut = signOut as jest.Mock;
mockSignOut.mockResolvedValue(undefined);
```

## How NextAuth signOut Works

When you call `signOut({ callbackUrl: '/login', redirect: true })`:

1. NextAuth clears the JWT session token
2. NextAuth clears any session cookies
3. NextAuth automatically redirects the user to `/login` (or the specified callbackUrl)
4. The redirect happens via NextAuth's internal mechanism, not through Next.js router

## Benefits of This Fix

1. **Proper Authentication**: Uses NextAuth's built-in session management
2. **Complete Cleanup**: Ensures all session data is properly cleared
3. **Consistent Pattern**: Matches the pattern used elsewhere in the application (auth-demo page)
4. **No Need for Custom Endpoint**: Leverages NextAuth's built-in functionality
5. **Better Security**: NextAuth handles session cleanup securely

## Testing

All 43 tests pass successfully:
- 30 tests in MainLayout.test.tsx ✓
- 13 tests in MainLayout.integration.test.tsx ✓

The tests now correctly verify that:
- `signOut()` is called with the correct parameters
- Error handling works properly when signOut fails
- The user menu closes before initiating logout

## How to Verify the Fix

1. **Start the development server**: `npm run dev`
2. **Log in** to the application
3. **Click on the user avatar** in the top right
4. **Click "Logout"** from the dropdown menu
5. **Verify** you are redirected to `/login` and can no longer access protected pages

## Related Files
- `src/components/Layout/MainLayout.tsx` - Component implementation
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/app/auth-demo/page.tsx` - Reference implementation
- `__tests__/components/Layout/MainLayout.test.tsx` - Unit tests
- `__tests__/components/Layout/MainLayout.integration.test.tsx` - Integration tests

## Date
December 2024
