import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSSEStats, getSSEHealthReport } from '$lib/notifications/sse-monitor.js';

// Admin-only endpoint to monitor SSE connection health
export const GET: RequestHandler = async ({ locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = getSSEStats();
    const healthReport = getSSEHealthReport();
    
    return json({
      timestamp: new Date().toISOString(),
      stats,
      health: healthReport,
      recommendations: generateRecommendations(stats, healthReport)
    });
  } catch (error) {
    console.error('Error getting SSE monitor data:', error);
    return json({ error: 'Failed to get monitor data' }, { status: 500 });
  }
};

function generateRecommendations(stats: any, health: any) {
  const recommendations = [];
  
  if (stats.errorCount > 0) {
    recommendations.push({
      type: 'warning',
      message: `${stats.errorCount} SSE errors detected. Check server logs for details.`
    });
  }
  
  if (health.errorRate > 0.1) {
    recommendations.push({
      type: 'critical',
      message: `High error rate: ${(health.errorRate * 100).toFixed(1)}%. Consider investigating connection stability.`
    });
  }
  
  if (health.staleConnections > 0) {
    recommendations.push({
      type: 'warning',
      message: `${health.staleConnections} stale connections detected. These may need cleanup.`
    });
  }
  
  if (stats.activeConnections === 0 && stats.totalConnections > 0) {
    recommendations.push({
      type: 'info',
      message: 'No active connections but total connections > 0. This may indicate connection issues.'
    });
  }
  
  return recommendations;
}
