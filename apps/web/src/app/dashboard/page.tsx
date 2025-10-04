import { redirect } from 'next/navigation';

/**
 * Dashboard Page
 * Redirects to /chapters route as part of Story 1.5.3.5
 * The new MainLayout with sidebar navigation replaces the old tab-based dashboard
 */
export default function DashboardPage() {
  redirect('/chapters');
}
