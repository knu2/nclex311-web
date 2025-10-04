import { redirect } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /chapters route', () => {
    DashboardPage();

    expect(redirect).toHaveBeenCalledWith('/chapters');
  });

  it('is called only once during render', () => {
    DashboardPage();

    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
