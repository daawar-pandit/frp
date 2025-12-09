// Copyright 2017 fatedier, fatedier@gmail.com
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package mem

import (
	"sync"
	"time"

	"github.com/fatedier/frp/pkg/util/metric"
)

const (
	ReserveDays = 7
)

type ServerStats struct {
	TotalTrafficIn  int64
	TotalTrafficOut int64
	CurConns        int64
	ClientCounts    int64
	ProxyTypeCounts map[string]int64
}

type ProxyStats struct {
	Name            string
	Type            string
	TodayTrafficIn  int64
	TodayTrafficOut int64
	LastStartTime   string
	LastCloseTime   string
	CurConns        int64

	// Monitoring metrics
	LatencyRTTMs float64 `json:"latencyRttMs"`
	JitterMs     float64 `json:"jitterMs"`
	SpeedInMbps  float64 `json:"speedInMbps"`
	SpeedOutMbps float64 `json:"speedOutMbps"`
	Online       bool    `json:"online"`
}

type ProxyTrafficInfo struct {
	Name       string
	TrafficIn  []int64
	TrafficOut []int64
}

type ProxyStatistics struct {
	Name          string
	ProxyType     string
	TrafficIn     metric.DateCounter
	TrafficOut    metric.DateCounter
	CurConns      metric.Counter
	LastStartTime time.Time
	LastCloseTime time.Time

	// Monitoring metrics
	RTTSamples     []float64  // Rolling window of RTT samples (ms)
	LastRTT        float64    // Last measured RTT in ms
	Jitter         float64    // Standard deviation of RTT samples
	SpeedIn        float64    // Current download speed (bytes/sec)
	SpeedOut       float64    // Current upload speed (bytes/sec)
	LastTrafficIn  int64      // Previous traffic in for speed calc
	LastTrafficOut int64      // Previous traffic out for speed calc
	LastSpeedCheck time.Time  // Time of last speed calculation
	RTTMu          sync.Mutex // Protects RTT/jitter fields
}

type ServerStatistics struct {
	TotalTrafficIn  metric.DateCounter
	TotalTrafficOut metric.DateCounter
	CurConns        metric.Counter

	// counter for clients
	ClientCounts metric.Counter

	// counter for proxy types
	ProxyTypeCounts map[string]metric.Counter

	// statistics for different proxies
	// key is proxy name
	ProxyStatistics map[string]*ProxyStatistics
}

// TunnelHealthSummary for global health endpoint
type TunnelHealthSummary struct {
	TotalTunnels     int  `json:"totalTunnels"`
	OnlineTunnels    int  `json:"onlineTunnels"`
	OfflineTunnels   int  `json:"offlineTunnels"`
	AllTunnelsOnline bool `json:"allTunnelsOnline"`
}

type Collector interface {
	GetServer() *ServerStats
	GetProxiesByType(proxyType string) []*ProxyStats
	GetProxiesByTypeAndName(proxyType string, proxyName string) *ProxyStats
	GetProxyTraffic(name string) *ProxyTrafficInfo
	ClearOfflineProxies() (int, int)
	GetTunnelHealth() *TunnelHealthSummary
	UpdateProxyRTT(name string, rttMs float64)
}
