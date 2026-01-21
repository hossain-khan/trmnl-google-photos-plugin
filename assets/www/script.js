/**
 * Google Photos TRMNL Plugin - Demo Page Script
 * Handles API interactions, status monitoring, and UI functionality
 */

const API_URL = 'https://trmnl-google-photos.gohk.xyz/api/photo';
const HEALTH_URL = 'https://trmnl-google-photos.gohk.xyz/health';

console.log('[TRMNL] Page loaded, initializing...');

/**
 * Open lightbox with demo image
 */
function openLightbox(imageSrc, label) {
  console.log('[Lightbox] Opening:', label);
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxLabel = document.getElementById('lightboxLabel');

  lightboxImage.src = imageSrc;
  lightboxImage.alt = label;
  lightboxLabel.textContent = label;
  lightbox.classList.add('active');

  // Prevent body scroll when lightbox is open
  document.body.style.overflow = 'hidden';
}

/**
 * Close lightbox
 */
function closeLightbox() {
  console.log('[Lightbox] Closing');
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');

  // Restore body scroll
  document.body.style.overflow = 'auto';
}

/**
 * Download photo from URL
 */
function downloadPhoto(photoUrl, albumName) {
  console.log('[Download] Starting photo download...');

  // Create a temporary link element
  const link = document.createElement('a');
  link.href = photoUrl;

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedAlbumName = (albumName || 'photo').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  link.download = `${sanitizedAlbumName}-${timestamp}.jpg`;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`[Download] Photo downloaded as ${link.download}`);
}

/**
 * Copy JSON response to clipboard
 */
function copyToClipboard(text) {
  console.log('[Clipboard] Copying to clipboard...');

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('[Clipboard] ✓ Copied successfully');

        // Show brief success feedback
        const copyBtn = event.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';

        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)';
        }, 2000);
      })
      .catch((err) => {
        console.error('[Clipboard] ✗ Failed to copy:', err);
        alert('Failed to copy to clipboard');
      });
  } else {
    // Fallback for older browsers
    console.warn('[Clipboard] Clipboard API not available, using fallback');
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

// Close lightbox on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});

/**
 * Check service status via /health endpoint
 */
async function checkServiceStatus() {
  console.log('[Status] Checking service health...');
  const badge = document.getElementById('statusBadge');

  // Update to checking state
  badge.className = 'status-badge status-checking';
  badge.textContent = '🟡 Checking...';
  badge.setAttribute('data-tooltip', 'Checking service status...');

  const startTime = performance.now();

  try {
    console.log(`[Status] Fetching ${HEALTH_URL}`);
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      cache: 'no-cache',
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    console.log(`[Status] Response received in ${responseTime}ms, status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('[Status] Health data:', data);

      // Update to online state
      badge.className = 'status-badge status-online';
      badge.textContent = '🟢 Online';
      badge.setAttribute(
        'data-tooltip',
        `API healthy • ${responseTime}ms • v${data.version || '0.2.0'} • Click to refresh`
      );

      console.log(`[Status] ✓ Service is healthy (${data.status}) - ${responseTime}ms`);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('[Status] ✗ Health check failed:', error);

    // Update to offline state
    badge.className = 'status-badge status-offline';
    badge.textContent = '🔴 Offline';
    badge.setAttribute('data-tooltip', `Service unavailable • ${error.message} • Click to retry`);
  }
}

// Check status on page load
window.addEventListener('DOMContentLoaded', () => {
  console.log('[TRMNL] DOM loaded, checking service status...');
  checkServiceStatus();
});

function useExampleUrl() {
  console.log('[UI] Using example album URL');
  document.getElementById('albumUrl').value = 'https://photos.app.goo.gl/ENK6C44K85QgVHPH8';
}

async function fetchPhotoData() {
  const albumUrl = document.getElementById('albumUrl').value.trim();
  const errorContainer = document.getElementById('errorContainer');
  const jsonOutput = document.getElementById('jsonOutput');
  const jsonContent = document.getElementById('jsonContent');
  const fetchBtn = document.getElementById('fetchBtn');
  const previewContainer = document.getElementById('previewContainer');

  console.log('[API] Fetch photo data requested');
  console.log('[API] Album URL:', albumUrl);

  // Clear previous messages
  errorContainer.innerHTML = '';

  // Validate input
  if (!albumUrl) {
    console.warn('[API] Validation failed: No album URL provided');
    errorContainer.innerHTML =
      '<div class="error-message"><strong>⚠️ Validation Error:</strong> Please enter a Google Photos album URL</div>';
    return;
  }

  // Validate URL format
  if (!albumUrl.includes('photos.app.goo.gl') && !albumUrl.includes('photos.google.com')) {
    console.warn('[API] Validation failed: Invalid URL format');
    errorContainer.innerHTML =
      '<div class="error-message"><strong>⚠️ Invalid URL:</strong> Please enter a valid Google Photos shared album URL (photos.app.goo.gl/... or photos.google.com/share/...)</div>';
    return;
  }

  // Show loading state with spinner
  fetchBtn.disabled = true;
  fetchBtn.textContent = '⏳ Fetching...';
  previewContainer.style.display = 'none';
  jsonOutput.style.display = 'flex';
  jsonContent.innerHTML =
    '<div class="spinner"></div><p style="text-align: center; color: #666; margin-top: 10px;">Fetching photo data from API...</p>';

  console.log('[API] Sending request to:', API_URL);
  const startTime = performance.now();

  try {
    const url = `${API_URL}?album_url=${encodeURIComponent(albumUrl)}`;
    const response = await fetch(url);
    const endTime = performance.now();
    const clientLatency = Math.round(endTime - startTime);

    console.log(`[API] Response received in ${clientLatency}ms, status: ${response.status}`);

    // Extract metadata from response headers
    const cacheStatus = response.headers.get('x-cache-status') || 'unknown';
    const serverTime = response.headers.get('x-response-time') || 'N/A';
    const totalTime =
      serverTime !== 'N/A'
        ? `${serverTime} (server) + ${clientLatency}ms (network)`
        : `${clientLatency}ms (total)`;

    console.log(`[API] Cache status: ${cacheStatus}, Server time: ${serverTime}`);

    if (!response.ok) {
      console.error(`[API] HTTP error: ${response.status} ${response.statusText}`);
      // More specific error messages based on status code
      let errorMsg = '';
      switch (response.status) {
        case 400:
          errorMsg = 'Invalid album URL format. Please check the URL and try again.';
          break;
        case 403:
          errorMsg =
            'Album access denied. The album may be private or link sharing may be disabled. Please ensure the album has link sharing enabled.';
          break;
        case 404:
          errorMsg = 'Album not found. The album may have been deleted or the link is incorrect.';
          break;
        case 429:
          errorMsg = 'Rate limit exceeded. Please wait a moment and try again.';
          break;
        case 500:
        case 502:
        case 503:
          errorMsg =
            'Server error. The service may be temporarily unavailable. Please try again later.';
          break;
        default:
          errorMsg = `Server returned ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();

    console.log('[API] ✓ Photo data received:', {
      photo_url: data.photo_url ? data.photo_url.substring(0, 50) + '...' : 'N/A',
      photo_count: data.photo_count,
      album_name: data.album_name,
      cache_status: cacheStatus,
      response_time: clientLatency + 'ms',
    });

    // Check if data contains error information
    if (data.error) {
      console.error('[API] Error in response data:', data.error);
      throw new Error(data.error);
    }

    // Display the JSON response
    jsonContent.textContent = JSON.stringify(data, null, 2);

    // Display the photo preview
    const imagePreviewContent = document.getElementById('imagePreviewContent');
    const imageInfo = document.getElementById('imageInfo');

    if (data.photo_url) {
      console.log('[API] Loading photo preview...');
      imagePreviewContent.innerHTML = `<img src="${data.photo_url}" alt="${data.caption || 'Photo from album'}" />`;
      imageInfo.style.display = 'block';

      // Build metadata display
      const metadataItems = [];
      if (data.metadata && data.metadata.original_width && data.metadata.original_height) {
        metadataItems.push(
          `<div class="metadata-item"><span class="metadata-label">📐 Dimensions:</span><span class="metadata-value">${data.metadata.original_width} × ${data.metadata.original_height}px</span></div>`
        );
      }
      if (data.aspect_ratio) {
        metadataItems.push(
          `<div class="metadata-item"><span class="metadata-label">📏 Aspect Ratio:</span><span class="metadata-value">${data.aspect_ratio}</span></div>`
        );
      }
      if (data.megapixels) {
        metadataItems.push(
          `<div class="metadata-item"><span class="metadata-label">🎨 Megapixels:</span><span class="metadata-value">${data.megapixels} MP</span></div>`
        );
      }

      imageInfo.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <div style="margin-bottom: 0.5rem;"><strong>📝 Caption:</strong></div>
                    <div style="color: #4a5568; font-style: italic;">${data.caption || 'No caption available'}</div>
                </div>
                
                <div class="metadata-container" style="margin-top: 1rem; margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 1rem 0;">🖼️ Photo Details</h4>
                    ${metadataItems.join('')}
                    <div class="metadata-item">
                        <span class="metadata-label">📚 Album:</span>
                        <span class="metadata-value">${data.album_name || 'Unknown'} (${data.photo_count || 0} photos)</span>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <a href="${data.photo_url}" target="_blank" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(66, 153, 225, 0.2);" onmouseover="this.style.background='linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(66, 153, 225, 0.3)';" onmouseout="this.style.background='linear-gradient(135deg, #4299e1 0%, #3182ce 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(66, 153, 225, 0.2)';">🔗 Open Full Size</a>
                    <button onclick="downloadPhoto('${data.photo_url}', '${data.album_name || 'photo'}')" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);" onmouseover="this.style.background='linear-gradient(135deg, #38a169 0%, #2f855a 100%)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(72, 187, 120, 0.3)';" onmouseout="this.style.background='linear-gradient(135deg, #48bb78 0%, #38a169 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(72, 187, 120, 0.2)';">⬇️ Download</button>
                    <button onclick="copyToClipboard(JSON.stringify(${JSON.stringify(data)}, null, 2))" style="flex: 1; min-width: 120px; padding: 0.75rem 1rem; background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(159, 122, 234, 0.2);" onmouseover="this.style.background='linear-gradient(135deg, #805ad5 0%, #6b46c1 100%)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(159, 122, 234, 0.3)';" onmouseout="this.style.background='linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(159, 122, 234, 0.2)';">📋 Copy JSON</button>
                </div>
            `;
    } else {
      imagePreviewContent.innerHTML =
        '<div style="color: #999; text-align: center;">📷<br>No photo available</div>';
    }

    // Build metadata display
    const metadataHtml = `
            <div class="metadata-container">
                <h4>📊 Response Metadata</h4>
                <div class="metadata-item">
                    <span class="metadata-label">Cache Status:</span>
                    <span class="metadata-value ${cacheStatus.toLowerCase() === 'hit' ? 'cache-hit' : 'cache-miss'}">
                        ${cacheStatus.toUpperCase()} ${cacheStatus.toLowerCase() === 'hit' ? '⚡' : '🔄'}
                    </span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Response Time:</span>
                    <span class="metadata-value">${totalTime}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Photos in Album:</span>
                    <span class="metadata-value">${data.photo_count || 'N/A'}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Album Name:</span>
                    <span class="metadata-value">${data.album_name || 'Unknown'}</span>
                </div>
            </div>
        `;

    errorContainer.innerHTML =
      `<div class="success-message">
            <strong>✓ Success!</strong> Photo data fetched successfully in ${clientLatency}ms
            <br>Photo URL: <a href="${data.photo_url}" target="_blank">View photo →</a>
        </div>` + metadataHtml;
  } catch (error) {
    console.error('Error fetching photo data:', error);
    jsonOutput.style.display = 'none';
    previewContainer.style.display = 'flex';

    // Enhanced error message with troubleshooting tips
    let troubleshootingTips = '';
    if (error.message.includes('Album access denied') || error.message.includes('403')) {
      troubleshootingTips =
        '<br><br><strong>💡 Troubleshooting:</strong><br>1. Open the album in Google Photos<br>2. Click the share button (⋯)<br>3. Enable "Share album" or "Create link"<br>4. Copy the new link and try again';
    } else if (error.message.includes('Album not found') || error.message.includes('404')) {
      troubleshootingTips =
        '<br><br><strong>💡 Troubleshooting:</strong><br>• Verify the URL is correct<br>• Check if the album still exists<br>• Try accessing the album in your browser first';
    } else if (error.message.includes('Invalid album URL')) {
      troubleshootingTips =
        '<br><br><strong>💡 Expected format:</strong><br>• photos.app.goo.gl/XXXXXXXXX<br>• photos.google.com/share/XXXXXXXXX';
    }

    errorContainer.innerHTML = `<div class="error-message"><strong>❌ Error:</strong> ${error.message}${troubleshootingTips}</div>`;
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = '🔄 Fetch Photo Data';
  }
}

// Allow Enter key to trigger fetch
document.getElementById('albumUrl').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    console.log('[UI] Enter key pressed, triggering fetch');
    fetchPhotoData();
  }
});

/**
 * Toggle badge tooltip visibility
 */
function toggleBadgeTooltip() {
  const tooltip = document.getElementById('badgeTooltip');
  tooltip.classList.toggle('show');

  // Auto-hide after 3 seconds
  if (tooltip.classList.contains('show')) {
    setTimeout(() => {
      tooltip.classList.remove('show');
    }, 3000);
  }
}

// Close tooltip when clicking outside
document.addEventListener('click', function (e) {
  const badge = document.getElementById('showTrmnlBadge');
  const tooltip = document.getElementById('badgeTooltip');
  if (badge && tooltip && !badge.contains(e.target)) {
    tooltip.classList.remove('show');
  }
});

console.log('[TRMNL] All event listeners registered');
