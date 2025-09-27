import { NextResponse } from 'next/server';
import { testConnection, getConnectionInfo } from '@/lib/db/services';
// Keep legacy import for fallback compatibility during transition
import {
  testConnection as legacyTestConnection,
  getConnectionInfo as legacyGetConnectionInfo,
} from '@/lib/database';

export async function GET() {
  try {
    // Test both connection methods during transition
    const startTime = Date.now();

    // Test new Drizzle connection
    const [isDrizzleConnected, drizzleInfo] = await Promise.allSettled([
      testConnection(),
      getConnectionInfo(),
    ]);

    // Test legacy Supabase connection for comparison
    const [isLegacyConnected, legacyInfo] = await Promise.allSettled([
      legacyTestConnection(),
      legacyGetConnectionInfo(),
    ]);

    const responseTime = Date.now() - startTime;

    // Check if primary (Drizzle) connection is healthy
    const drizzleConnectionOk =
      isDrizzleConnected.status === 'fulfilled' && isDrizzleConnected.value;
    const drizzleInfoOk = drizzleInfo.status === 'fulfilled';

    // Check legacy connection status for monitoring
    const legacyConnectionOk =
      isLegacyConnected.status === 'fulfilled' && isLegacyConnected.value;
    const legacyInfoOk = legacyInfo.status === 'fulfilled';

    if (!drizzleConnectionOk) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          checks: {
            database: 'disconnected',
            drizzle_orm: drizzleConnectionOk ? 'connected' : 'disconnected',
            legacy_supabase: legacyConnectionOk ? 'connected' : 'disconnected',
            response_time_ms: responseTime,
          },
          timestamp: new Date().toISOString(),
          errors: {
            drizzle:
              isDrizzleConnected.status === 'rejected'
                ? isDrizzleConnected.reason?.message
                : null,
            legacy:
              isLegacyConnected.status === 'rejected'
                ? isLegacyConnected.reason?.message
                : null,
          },
        },
        { status: 503 }
      );
    }

    // Prepare connection info from both sources
    const connectionInfo = {
      drizzle: drizzleInfoOk
        ? drizzleInfo.value
        : { error: 'Failed to get info' },
      legacy: legacyInfoOk ? legacyInfo.value : { error: 'Failed to get info' },
      migration_status: {
        drizzle_orm: drizzleConnectionOk ? 'operational' : 'failed',
        legacy_supabase: legacyConnectionOk ? 'operational' : 'failed',
        dual_compatibility:
          drizzleConnectionOk && legacyConnectionOk ? 'active' : 'partial',
      },
    };

    return NextResponse.json({
      status: 'healthy',
      checks: {
        database: 'connected',
        drizzle_orm: 'connected',
        legacy_supabase: legacyConnectionOk ? 'connected' : 'disconnected',
        response_time_ms: responseTime,
      },
      info: connectionInfo,
      timestamp: new Date().toISOString(),
      version: '1.1.0-drizzle-migration',
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.1.0-drizzle-migration',
      },
      { status: 500 }
    );
  }
}
