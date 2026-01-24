/**
 * Brightness Analysis Service
 *
 * Integrates with Image Insights API to analyze photo brightness and determine
 * optimal TRMNL background shade for e-ink display.
 *
 * **Features:**
 * - Edge-based brightness analysis (left/right 10% of image)
 * - Maps brightness score (0-100) to 16-level TRMNL palette
 * - 1-second timeout with graceful fallback
 * - Comprehensive performance logging
 *
 * **Integration:**
 * - Service: https://image-insights.gohk.uk/
 * - Open Source: https://github.com/hossain-khan/image-insights-api
 * - Algorithm: Rec. 709 perceptual luminance
 * - Edge Mode: left_right (portrait photo optimization)
 *
 * **Privacy-First Design:**
 * Your photos are safe and private:
 * - ✅ Zero Image Storage: Images never saved to disk or database
 * - ✅ In-Memory Processing: Processed in RAM, immediately discarded
 * - ✅ Stateless Architecture: No tracking, sessions, or user profiles
 * - ✅ No Data Retention: Image data garbage collected after analysis
 * - ✅ Safe Logging: URLs redacted, no pixel data logged
 * - ✅ No Third-Party Sharing: All processing local to the deployment
 *
 * Each request is independent and isolated. What happens inside stays inside.
 */

/**
 * Image Insights API response structure
 */
export interface ImageAnalysisResponse {
  brightness_score: number; // Overall brightness (0-100)
  average_luminance: number; // Overall luminance (0-255)
  edge_brightness_score: number; // Edge brightness (0-100) - USE THIS
  edge_average_luminance: number; // Edge luminance (0-255)
  edge_mode: string; // "left_right"
  width: number;
  height: number;
  algorithm: string; // "rec709"
  processing_time_ms: number;
}

/**
 * API request payload
 */
interface ImageAnalysisRequest {
  url: string;
  metrics: string;
  edge_mode: string;
}

// Configuration
const IMAGE_INSIGHTS_API = 'https://image-insights.gohk.uk';
const ANALYSIS_ENDPOINT = '/v1/image/analysis/url';
const ANALYSIS_TIMEOUT_MS = 1000; // 1 second maximum
const EDGE_MODE = 'left_right'; // Analyze left/right edges (10% each)

/**
 * Map edge brightness score (0-100) to TRMNL background shade class
 *
 * **Strategy**: Match/Blend - Dark edges → Dark background
 *
 * TRMNL Framework has 16-level palette:
 * - bg--black (darkest)
 * - bg--gray-10 through bg--gray-75 (14 gray shades)
 * - bg--white (lightest)
 *
 * Each level covers ~6.25 points on 0-100 scale (100 / 16 = 6.25)
 *
 * @param edgeBrightnessScore - Brightness score from 0 (dark) to 100 (bright)
 * @returns TRMNL background class (e.g., "bg--gray-50")
 */
export function mapBrightnessToBackground(edgeBrightnessScore: number): string {
  // Clamp to valid range
  const score = Math.max(0, Math.min(100, edgeBrightnessScore));

  // Map to 16 levels (0-100 → 16 classes)
  // https://usetrmnl.com/framework/background
  if (score < 6.25) {
    return 'bg--black'; // 0-6
  } else if (score < 12.5) {
    return 'bg--gray-10'; // 7-12
  } else if (score < 18.75) {
    return 'bg--gray-15'; // 13-18
  } else if (score < 25) {
    return 'bg--gray-20'; // 19-25
  } else if (score < 31.25) {
    return 'bg--gray-25'; // 26-31
  } else if (score < 37.5) {
    return 'bg--gray-30'; // 32-37
  } else if (score < 43.75) {
    return 'bg--gray-35'; // 38-43
  } else if (score < 50) {
    return 'bg--gray-40'; // 44-50
  } else if (score < 56.25) {
    return 'bg--gray-45'; // 51-56
  } else if (score < 62.5) {
    return 'bg--gray-50'; // 57-62
  } else if (score < 68.75) {
    return 'bg--gray-55'; // 63-68
  } else if (score < 75) {
    return 'bg--gray-60'; // 69-75
  } else if (score < 81.25) {
    return 'bg--gray-65'; // 76-81
  } else if (score < 87.5) {
    return 'bg--gray-70'; // 82-87
  } else if (score < 93.75) {
    return 'bg--gray-75'; // 88-93
  } else {
    return 'bg--white'; // 94-100
  }
}

/**
 * Analyze image brightness using external Image Insights API
 *
 * **Process:**
 * 1. Call Image Insights API with photo URL
 * 2. Extract edge brightness score (0-100)
 * 3. Map score to TRMNL background class
 * 4. Return background class string
 *
 * **Error Handling:**
 * - 1-second timeout enforced
 * - Returns empty string on any error (graceful fallback)
 * - Photo displays normally without background
 *
 * **Performance:**
 * - Expected: 50-150ms (API latency)
 * - Maximum: 1000ms (timeout)
 * - Logged for monitoring
 *
 * @param photoUrl - Google Photos CDN URL to analyze
 * @returns TRMNL background class (e.g., "bg--gray-50") or empty string on error
 *
 * @example
 * const bgClass = await analyzeImageBrightness("https://lh3.googleusercontent.com/...");
 * // Returns: "bg--gray-50"
 */
export async function analyzeImageBrightness(photoUrl: string): Promise<string> {
  const startTime = performance.now();
  console.log('[Brightness Analysis] Starting edge brightness analysis...');

  try {
    // Prepare API request
    const requestPayload: ImageAnalysisRequest = {
      url: photoUrl,
      metrics: 'brightness', // Only need brightness metric
      edge_mode: EDGE_MODE, // Analyze left/right edges
    };

    console.log(
      `[Brightness Analysis] Requesting analysis for URL: ${photoUrl.substring(0, 80)}...`
    );

    // Make API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    const response = await fetch(`${IMAGE_INSIGHTS_API}${ANALYSIS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const elapsed = performance.now() - startTime;
      console.error(
        `[Brightness Analysis] API error after ${elapsed.toFixed(2)}ms: ${response.status} ${response.statusText}`
      );
      return ''; // No background on API error
    }

    const data: ImageAnalysisResponse = await response.json();

    // Extract edge brightness score (0-100)
    const edgeScore = data.edge_brightness_score;
    console.log(
      `[Brightness Analysis] Edge score received: ${edgeScore.toFixed(1)} (edge_mode: ${data.edge_mode}, ${data.width}x${data.height})`
    );

    // Map brightness to background class
    const backgroundShade = mapBrightnessToBackground(edgeScore);

    const totalTime = performance.now() - startTime;
    console.log(
      `[Brightness Analysis] Complete in ${totalTime.toFixed(2)}ms - Score: ${edgeScore.toFixed(1)}, Background: ${backgroundShade}`
    );

    return backgroundShade;
  } catch (error) {
    const totalTime = performance.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(
          `[Brightness Analysis] Timeout after ${ANALYSIS_TIMEOUT_MS}ms - no background applied`
        );
      } else {
        console.error(
          `[Brightness Analysis] Failed after ${totalTime.toFixed(2)}ms:`,
          error.message
        );
      }
    } else {
      console.error(`[Brightness Analysis] Unknown error after ${totalTime.toFixed(2)}ms:`, error);
    }

    return ''; // No background on error (graceful fallback)
  }
}
