// SSE Connection Monitor
// This utility helps monitor and debug SSE connection issues in production

export interface SSEConnectionStats {
  totalConnections: number;
  activeConnections: number;
  closedConnections: number;
  errorCount: number;
  lastError?: string;
  lastErrorTime?: Date;
}

class SSEConnectionMonitor {
  private stats: SSEConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    closedConnections: 0,
    errorCount: 0
  };

  private connections = new Map<string, { 
    userId: string; 
    connectedAt: Date; 
    lastHeartbeat?: Date;
    errorCount: number;
  }>();

  recordConnection(userId: string) {
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    this.connections.set(userId, {
      userId,
      connectedAt: new Date(),
      errorCount: 0
    });

    console.log(`📊 SSE Monitor: Connection established for ${userId}. Active: ${this.stats.activeConnections}`);
  }

  recordDisconnection(userId: string, reason?: string) {
    this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
    this.stats.closedConnections++;
    
    const connection = this.connections.get(userId);
    if (connection) {
      const duration = Date.now() - connection.connectedAt.getTime();
      console.log(`📊 SSE Monitor: Connection closed for ${userId} after ${Math.round(duration / 1000)}s. Reason: ${reason || 'unknown'}`);
      this.connections.delete(userId);
    }
  }

  recordError(userId: string, error: Error) {
    this.stats.errorCount++;
    this.stats.lastError = error.message;
    this.stats.lastErrorTime = new Date();

    const connection = this.connections.get(userId);
    if (connection) {
      connection.errorCount++;
    }

    console.error(`📊 SSE Monitor: Error for ${userId}:`, error.message);
  }

  recordHeartbeat(userId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.lastHeartbeat = new Date();
    }
  }

  getStats(): SSEConnectionStats {
    return { ...this.stats };
  }

  getConnectionDetails(userId: string) {
    return this.connections.get(userId);
  }

  getAllConnections() {
    return Array.from(this.connections.values());
  }

  // Health check - identify problematic connections
  getHealthReport() {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    const staleConnections = Array.from(this.connections.values())
      .filter(conn => {
        const lastActivity = conn.lastHeartbeat || conn.connectedAt;
        return now - lastActivity.getTime() > staleThreshold;
      });

    return {
      totalActive: this.stats.activeConnections,
      staleConnections: staleConnections.length,
      errorRate: this.stats.totalConnections > 0 ? this.stats.errorCount / this.stats.totalConnections : 0,
      staleConnections: staleConnections.map(conn => ({
        userId: conn.userId,
        connectedAt: conn.connectedAt,
        lastHeartbeat: conn.lastHeartbeat,
        errorCount: conn.errorCount
      }))
    };
  }
}

// Export singleton instance
export const sseMonitor = new SSEConnectionMonitor();

// Export utility functions for easy integration
export function recordSSEConnection(userId: string) {
  sseMonitor.recordConnection(userId);
}

export function recordSSEDisconnection(userId: string, reason?: string) {
  sseMonitor.recordDisconnection(userId, reason);
}

export function recordSSEError(userId: string, error: Error) {
  sseMonitor.recordError(userId, error);
}

export function recordSSEHeartbeat(userId: string) {
  sseMonitor.recordHeartbeat(userId);
}

export function getSSEStats() {
  return sseMonitor.getStats();
}

export function getSSEHealthReport() {
  return sseMonitor.getHealthReport();
}
