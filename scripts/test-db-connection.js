import { db, client } from '../src/lib/db/connection.js';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection and checking activity...\n');
    
    // Basic connection test
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connection successful!');
    console.log('Current time from DB:', result[0]?.current_time);
    
    // === CURRENT DATABASE ACTIVITY ===
    console.log('\n=== CURRENT DATABASE ACTIVITY ===');
    const activity = await db.execute(sql`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        wait_event_type,
        wait_event,
        backend_start,
        left(query, 100) as query_snippet,
        backend_type
      FROM pg_stat_activity 
      WHERE datname = current_database()
      ORDER BY query_start DESC NULLS LAST
    `);
    
    console.log(`Found ${activity.length} active connections:`);
    activity.forEach((conn, i) => {
      console.log(`\n${i + 1}. PID: ${conn.pid}`);
      console.log(`   User: ${conn.usename || 'N/A'}`);
      console.log(`   App: ${conn.application_name || 'N/A'}`);
      console.log(`   State: ${conn.state || 'N/A'}`);
      console.log(`   Wait Event: ${conn.wait_event_type || 'none'}/${conn.wait_event || 'none'}`);
      console.log(`   Backend Type: ${conn.backend_type || 'N/A'}`);
      if (conn.query_start) {
        console.log(`   Query Start: ${conn.query_start}`);
        const duration = new Date() - new Date(conn.query_start);
        console.log(`   Duration: ${Math.round(duration / 1000)}s`);
      }
      if (conn.query_snippet && conn.query_snippet !== '<IDLE>') {
        console.log(`   Query: ${conn.query_snippet}...`);
      }
    });

    // === LONG-RUNNING QUERIES ===
    console.log('\n\n=== LONG-RUNNING QUERIES (>30s) ===');
    const longQueries = await db.execute(sql`
      SELECT 
        pid,
        usename,
        query_start,
        now() - query_start as duration,
        state,
        left(query, 200) as query_snippet
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND state != 'idle'
        AND query_start < now() - interval '30 seconds'
      ORDER BY query_start
    `);

    if (longQueries.length === 0) {
      console.log('✅ No long-running queries found');
    } else {
      console.log(`⚠️  Found ${longQueries.length} long-running queries:`);
      longQueries.forEach((query, i) => {
        console.log(`\n${i + 1}. PID: ${query.pid} (${query.usename})`);
        console.log(`   Duration: ${query.duration}`);
        console.log(`   State: ${query.state}`);
        console.log(`   Query: ${query.query_snippet}...`);
      });
    }

    // === CONNECTION LIMITS ===
    console.log('\n\n=== CONNECTION LIMITS ===');
    const limits = await db.execute(sql`
      SELECT 
        setting as max_connections,
        (SELECT count(*) FROM pg_stat_activity) as current_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
      FROM pg_settings 
      WHERE name = 'max_connections'
    `);

    if (limits.length > 0) {
      const limit = limits[0];
      console.log(`Max connections: ${limit.max_connections}`);
      console.log(`Current connections: ${limit.current_connections}`);
      console.log(`Active connections: ${limit.active_connections}`);
      
      const usage = (parseInt(limit.current_connections) / parseInt(limit.max_connections)) * 100;
      if (usage > 80) {
        console.log(`⚠️  High connection usage: ${usage.toFixed(1)}%`);
      } else {
        console.log(`✅ Connection usage: ${usage.toFixed(1)}%`);
      }
    }

    // === DATABASE STATISTICS ===
    console.log('\n\n=== DATABASE STATISTICS ===');
    const stats = await db.execute(sql`
      SELECT 
        numbackends,
        xact_commit,
        xact_rollback,
        blks_read,
        blks_hit,
        tup_returned,
        tup_fetched,
        tup_inserted,
        tup_updated,
        tup_deleted,
        conflicts,
        temp_files,
        temp_bytes,
        deadlocks
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`Active backends: ${stat.numbackends}`);
      console.log(`Commits: ${stat.xact_commit}, Rollbacks: ${stat.xact_rollback}`);
      
      const totalReads = parseInt(stat.blks_hit) + parseInt(stat.blks_read);
      if (totalReads > 0) {
        const hitRatio = (parseInt(stat.blks_hit) / totalReads) * 100;
        console.log(`Cache hit ratio: ${hitRatio.toFixed(2)}%`);
      }
      
      console.log(`Deadlocks: ${stat.deadlocks}`);
      console.log(`Temp files: ${stat.temp_files} (${(parseInt(stat.temp_bytes || 0) / 1024 / 1024).toFixed(2)} MB)`);

      if (parseInt(stat.deadlocks) > 0) {
        console.log('⚠️  Deadlocks detected in database');
      }
    }

    // === APP TABLE SIZES ===
    console.log('\n\n=== APP TABLE SIZES ===');
    const tableSizes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
        AND tablename IN ('tours', 'bookings', 'time_slots', 'users')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    console.log('Table sizes:');
    tableSizes.forEach(table => {
      console.log(`  ${table.tablename}: ${table.size}`);
    });

    // === RECOMMENDATIONS ===
    console.log('\n\n=== RECOMMENDATIONS FOR 502 ERROR PREVENTION ===');
    
    if (activity.length > 8) {
      console.log('⚠️  High number of connections - consider connection pooling');
    }
    
    if (longQueries.length > 0) {
      console.log('⚠️  Long-running queries detected - these can cause timeouts');
      console.log('   Consider adding query timeouts or optimizing slow queries');
    }
    
    if (limits.length > 0) {
      const usage = (parseInt(limits[0].current_connections) / parseInt(limits[0].max_connections)) * 100;
      if (usage > 70) {
        console.log('⚠️  Consider increasing connection pool size in your app');
      }
    }
    
    console.log('\n✅ Database activity check completed');
    
  } catch (error) {
    console.error('❌ Database activity check failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection(); 