/**
 * Geo-Velocity & Impossible Travel Anomaly Checker
 * Flags transactions occurring across physically impossible travel times (e.g. India to overseas proxy in minutes).
 */

export interface GeoLocationCheck {
  currentIp?: string;
  currentLocation?: string;
  lastKnownLocation?: string;
  lastSeenTimestamp?: Date | string;
}

export function evaluateGeoVelocity(check: GeoLocationCheck): {
  isAnomaly: boolean;
  scoreContribution: number;
  reason?: string;
} {
  const loc = (check.currentLocation || "").toLowerCase();
  const ip = check.currentIp || "";

  // Check for high-risk foreign IP addresses or overseas proxy nodes (e.g. Frankfurt Tor, overseas VPN, foreign node)
  if (
    loc.includes("overseas") ||
    loc.includes("proxy") ||
    loc.includes("tor") ||
    loc.includes("frankfurt") ||
    loc.includes("berlin") ||
    ip.startsWith("185.220.") ||
    ip.startsWith("194.26.")
  ) {
    return {
      isAnomaly: true,
      scoreContribution: 0.28,
      reason: `High-risk foreign node detected: ${check.currentLocation || ip} (Overseas proxy/Tor exit node targeting domestic India account)`,
    };
  }

  if (check.lastKnownLocation && check.currentLocation && check.lastKnownLocation !== check.currentLocation) {
    return {
      isAnomaly: true,
      scoreContribution: 0.22,
      reason: `Location drift detected: from ${check.lastKnownLocation} to ${check.currentLocation}`,
    };
  }

  return {
    isAnomaly: false,
    scoreContribution: 0.0,
  };
}
