# Real-Time Status Update Fix

## Problem
1. When frpc is stopped, tunnel proxies continued to show "online" status in the dashboard until the page was refreshed.
2. The Overview page's Tunnel Health section only updated on page refresh, not in real-time.

## Root Cause
1. The SSE (Server-Sent Events) stream was correctly computing and sending proxy status updates, but the default 2-second update interval felt too slow for status changes. Additionally, reconnection was too conservative, and there was insufficient logging to diagnose issues.
2. The Overview page was fetching tunnel health via REST API only once on mount, not subscribing to real-time updates.

## Solution Implemented

### 1. Faster Status Updates (1 second interval)
**Changed:**
- Default SSE update interval: `2000ms` → `1000ms`
- Components now receive status updates within 1 second of frpc disconnection

**Files Modified:**
- `web/frps/src/composables/useMetricsStream.ts`: Changed default from 2000ms to 1000ms
- `web/frps/src/components/ProxyViewRealtime.vue`: Updated to use 1000ms interval

### 2. Faster Reconnection
**Changed:**
- Base reconnect delay: `1000ms` → `500ms`
- Max reconnection attempts: `5` → `10`
- SSE connection now recovers faster from network issues

**Files Modified:**
- `web/frps/src/composables/useMetricsStream.ts`

### 3. Enhanced Logging

#### Backend Logging
Added trace logging to track:
- When proxies are closed (with timestamps)
- What status is sent in each SSE event
- Start/close time comparison for each proxy

**Files Modified:**
- `pkg/metrics/mem/server.go`: Added log when CloseProxy() is called
- `server/dashboard_api.go`: Added trace log in SSE event sender

#### Frontend Logging
Added console logging to track:
- When proxy status changes in SSE stream
- When proxies are removed from the stream
- When ProxyViewRealtime updates
- SSE connection state changes

**Files Modified:**
- `web/frps/src/composables/useMetricsStream.ts`: Log status changes and removals
- `web/frps/src/components/ProxyViewRealtime.vue`: Log updates and watch triggers

### 4. Documentation Updates
Updated API documentation to reflect:
- New 1-second default interval
- How status changes propagate
- Improved reconnection behavior

**Files Modified:**
- `web/frps/src/composables/useMetricsStream.ts`: Faster interval & reconnection, added logging
- `web/frps/src/components/ProxyViewRealtime.vue`: Updated interval, added logging
- `web/frps/src/components/ServerOverview.vue`: **NEW** - Now uses SSE stream for real-time updates
- `pkg/metrics/mem/server.go`: Added logging when proxies close
- `server/dashboard_api.go`: Added trace logging for SSE events
- `web/frps/API_DOCUMENTATION.md`: Updated docs

### 4. Real-Time Overview Page

**Changed:**
- `ServerOverview.vue` now connects to SSE stream on mount
- Tunnel Health computed from live proxy metrics (no REST API polling)
- Traffic chart updates in real-time from stream's server metrics
- Proxy type chart updates in real-time by counting proxies from stream
- Added LIVE indicator to Tunnel Health section

**How It Works:**
- Tunnel Health: Iterates through all proxies in SSE stream, counts online/offline
- Traffic Chart: Watches `serverMetrics` and redraws when values change
- Proxy Type Chart: Counts proxies by type from SSE stream
- All updates happen automatically within 1 second

**Files Modified:**
- `web/frps/src/components/ServerOverview.vue`

## How It Works Now

### When frpc Stops:
1. **Server detects disconnect** (control connection closes)
2. **Proxy closed** via `pxyManager.Del()` and `metrics.Server.CloseProxy()`
3. **LastCloseTime updated** to current time in metrics
4. **Next SSE event** (within 1 second) computes status:
   ```go
   Online = LastCloseTime.IsZero() || LastStartTime.After(LastCloseTime)
   // Since LastCloseTime is now > LastStartTime, Online = false
   ```
5. **Frontend receives** SSE event with `status: "offline"`
6. **Vue reactivity** triggers, `ProxyViewRealtime` watch fires
7. **UI updates** to show offline status within 1 second

### Status Computation
Backend uses `ProxyStats.Online` field computed from:
```go
ps.Online = proxyStats.LastCloseTime.IsZero() ||
    proxyStats.LastStartTime.After(proxyStats.LastCloseTime)
```

This is reliable even if frpc exits ungracefully, because the control connection close always triggers `CloseProxy()`.

## Testing

### To Verify the Fix:
1. **Rebuild frps:**
   ```bash
   cd /Users/daawar.pandit/cga/frps/frp\ copy
   go build -o bin/frps ./cmd/frps
   ```

2. **Rebuild frontend:**
   ```bash
   cd web/frps
   npm run build
   ```

3. **Start frps:**
   ```bash
   ./bin/frps -c conf/frps_dev.toml
   ```

4. **Start frpc:**
   ```bash
   ./bin/frpc -c conf/frpc.toml
   ```

5. **Open dashboard:**
   - Navigate to http://localhost:7500/static/
   - Verify "LIVE" indicator is showing (green pulsing dot)
   - Observe proxy status as "online"

6. **Stop frpc:**
   ```bash
   # Find and kill frpc process
   ps aux | grep frpc
   kill <pid>
   ```

6. **Watch dashboard:**
   - Within 1 second, status should change to "offline"
   - **Overview page:** Tunnel Health section shows updated counts immediately
   - **Proxy pages:** Status column changes to offline
   - Open browser console to see logs:
     - `[SSE] Proxy <name> status changed: online → offline`
     - `[ProxyViewRealtime] Stream update detected`
     - `[ProxyViewRealtime] Proxy <name>: status=offline`

### Expected Console Output

**Browser Console:**
```
[SSE] Proxy ssh status changed: online → offline
[ProxyViewRealtime] Stream update detected for tcp at 1710000001234
[ProxyViewRealtime] Updating tcp proxies, stream has 1 entries
[ProxyViewRealtime] Proxy ssh: status=offline
```

**Server Console (if log level includes Info/Trace):**
```
[Metrics] Proxy [ssh] closed at 15:04:23 (started at 15:04:10)
[SSE] Proxy [ssh] type [tcp] status [offline] (online=false, start=03-15 15:04:10, close=03-15 15:04:23)
```

## Benefits
- **Instant feedback**: Status changes visible within 1 second
- **Better UX**: No need to refresh page to see current state
- **Reliable**: Works even when frpc crashes or is force-killed
- **Debuggable**: Comprehensive logging for troubleshooting
- **Fast recovery**: SSE reconnects in 500ms if connection drops

## Performance Impact
- Minimal: SSE events are small JSON payloads (~1-2KB depending on proxy count)
- 1-second interval is well within browser and server capabilities
- Network traffic increase: ~1-2KB/sec per connected dashboard client
