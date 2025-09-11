import { NextResponse } from 'next/server';
import { testConnection, getConnectionInfo } from '@/lib/database';

export async function GET() {
  try {
    // Test database connectivity
    const isDbConnected = await testConnection();
    
    if (!isDbConnected) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          checks: {
            database: 'disconnected'
          },
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Get additional database info
    const dbInfo = await getConnectionInfo();
    
    return NextResponse.json({
      status: 'healthy',
      checks: {
        database: 'connected',
        info: dbInfo
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
