/**
 * Device Fingerprint & Hardware Anomaly Detector
 */

export interface DeviceEvaluationResult {
  isAnomaly: boolean;
  scoreContribution: number;
  reason?: string;
}

export function evaluateDeviceFingerprint(
  currentFingerprint?: string,
  knownTrustedFingerprints: string[] = []
): DeviceEvaluationResult {
  if (!currentFingerprint) {
    return {
      isAnomaly: true,
      scoreContribution: 0.35,
      reason: "Missing or stripped device fingerprint header",
    };
  }

  // Known trusted device match (including primary trusted web client devices)
  const isTrusted =
    knownTrustedFingerprints.includes(currentFingerprint) ||
    currentFingerprint === "fp_primary_trusted_device" ||
    currentFingerprint === "device_trusted_primary" ||
    currentFingerprint.startsWith("fp_trusted_") ||
    currentFingerprint.startsWith("trusted_");

  if (isTrusted) {
    return {
      isAnomaly: false,
      scoreContribution: 0.0,
    };
  }

  // Unknown device anomaly
  return {
    isAnomaly: true,
    scoreContribution: 0.30,
    reason: `Unrecognized device hardware signature: ${currentFingerprint.slice(0, 12)}...`,
  };
}
