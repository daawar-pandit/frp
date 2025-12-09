// Copyright 2024 fatedier, fatedier@gmail.com
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
	"math"
	"time"
)

const (
	// MaxRTTSamples is the rolling window size for RTT samples
	MaxRTTSamples = 20
	// SpeedCalcInterval is how often we calculate throughput
	SpeedCalcInterval = 2 * time.Second
	// SpeedEWMAAlpha is the smoothing factor for EWMA (0.3 = 30% new, 70% old)
	SpeedEWMAAlpha = 0.3
)

// AddRTTSample adds an RTT sample and recalculates jitter using RFC 3550 algorithm
// This is the same algorithm used by RTP for jitter calculation
func (ps *ProxyStatistics) AddRTTSample(rttMs float64) {
	ps.RTTMu.Lock()
	defer ps.RTTMu.Unlock()

	// RFC 3550 jitter calculation: J(i) = J(i-1) + (|D(i-1,i)| - J(i-1))/16
	// This provides a smoothed jitter estimate
	if ps.LastRTT > 0 {
		diff := math.Abs(rttMs - ps.LastRTT)
		ps.Jitter = ps.Jitter + (diff-ps.Jitter)/16.0
	}

	ps.LastRTT = rttMs

	// Also keep samples for statistical analysis if needed
	ps.RTTSamples = append(ps.RTTSamples, rttMs)
	if len(ps.RTTSamples) > MaxRTTSamples {
		ps.RTTSamples = ps.RTTSamples[1:]
	}
}

// UpdateSpeed calculates current throughput using EWMA for smooth values
func (ps *ProxyStatistics) UpdateSpeed(currentTrafficIn, currentTrafficOut int64) {
	ps.RTTMu.Lock()
	defer ps.RTTMu.Unlock()

	now := time.Now()
	if ps.LastSpeedCheck.IsZero() {
		ps.LastSpeedCheck = now
		ps.LastTrafficIn = currentTrafficIn
		ps.LastTrafficOut = currentTrafficOut
		return
	}

	elapsed := now.Sub(ps.LastSpeedCheck).Seconds()
	if elapsed > 0 {
		// Calculate instantaneous speed
		instantSpeedIn := float64(currentTrafficIn-ps.LastTrafficIn) / elapsed
		instantSpeedOut := float64(currentTrafficOut-ps.LastTrafficOut) / elapsed

		// Apply EWMA smoothing: new_value = alpha * instant + (1-alpha) * old_value
		if ps.SpeedIn == 0 {
			ps.SpeedIn = instantSpeedIn
		} else {
			ps.SpeedIn = SpeedEWMAAlpha*instantSpeedIn + (1-SpeedEWMAAlpha)*ps.SpeedIn
		}

		if ps.SpeedOut == 0 {
			ps.SpeedOut = instantSpeedOut
		} else {
			ps.SpeedOut = SpeedEWMAAlpha*instantSpeedOut + (1-SpeedEWMAAlpha)*ps.SpeedOut
		}

		// Clamp very small values to zero to avoid floating point noise
		if ps.SpeedIn < 100 { // Less than 100 bytes/sec
			ps.SpeedIn = 0
		}
		if ps.SpeedOut < 100 {
			ps.SpeedOut = 0
		}
	}

	ps.LastSpeedCheck = now
	ps.LastTrafficIn = currentTrafficIn
	ps.LastTrafficOut = currentTrafficOut
}

// GetMonitoringStats returns current monitoring values
func (ps *ProxyStatistics) GetMonitoringStats() (rtt, jitter, speedIn, speedOut float64) {
	ps.RTTMu.Lock()
	defer ps.RTTMu.Unlock()
	return ps.LastRTT, ps.Jitter, ps.SpeedIn, ps.SpeedOut
}

// GetRTTStats returns detailed RTT statistics (min, max, avg, stddev)
func (ps *ProxyStatistics) GetRTTStats() (min, max, avg, stddev float64) {
	ps.RTTMu.Lock()
	defer ps.RTTMu.Unlock()

	if len(ps.RTTSamples) == 0 {
		return 0, 0, 0, 0
	}

	min = ps.RTTSamples[0]
	max = ps.RTTSamples[0]
	var sum float64

	for _, v := range ps.RTTSamples {
		sum += v
		if v < min {
			min = v
		}
		if v > max {
			max = v
		}
	}

	avg = sum / float64(len(ps.RTTSamples))

	if len(ps.RTTSamples) > 1 {
		var variance float64
		for _, v := range ps.RTTSamples {
			variance += (v - avg) * (v - avg)
		}
		// Use sample standard deviation (n-1) for unbiased estimate
		variance /= float64(len(ps.RTTSamples) - 1)
		stddev = math.Sqrt(variance)
	}

	return min, max, avg, stddev
}
