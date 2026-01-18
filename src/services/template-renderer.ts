/**
 * Template Renderer Service
 * Handles loading and rendering Liquid templates
 */

import { Liquid } from 'liquidjs';
import type { TemplateContext } from '../types';

// Initialize Liquid engine
const liquid = new Liquid({
  cache: true, // Enable caching for performance
  strictFilters: true, // Throw on undefined filters
  strictVariables: false, // Allow undefined variables (graceful degradation)
});

/**
 * Available template layouts
 */
export const LAYOUTS = {
  FULL: 'full',
  HALF_HORIZONTAL: 'half_horizontal',
  HALF_VERTICAL: 'half_vertical',
  QUADRANT: 'quadrant',
} as const;

export type LayoutType = typeof LAYOUTS[keyof typeof LAYOUTS];

/**
 * Template content cache
 * In Cloudflare Workers, we need to load templates at build time
 * or fetch them from KV/R2 storage
 */
const templateCache = new Map<string, string>();

/**
 * Load a template from the templates directory
 * 
 * @param layout - The layout name (e.g., 'full', 'half_horizontal')
 * @returns Template content as string
 * @throws Error if template not found
 */
export function loadTemplate(layout: string): string {
  // Check cache first
  if (templateCache.has(layout)) {
    return templateCache.get(layout)!;
  }

  // In Cloudflare Workers, templates need to be bundled or loaded from storage
  // For now, we'll throw an error if template is not in cache
  throw new Error(`Template '${layout}' not found. Templates must be preloaded.`);
}

/**
 * Preload template content into cache
 * This should be called during Worker initialization
 * 
 * @param layout - The layout name
 * @param content - The template content
 */
export function preloadTemplate(layout: string, content: string): void {
  templateCache.set(layout, content);
}

/**
 * Render a template with the given context
 * 
 * @param layout - The layout to render (e.g., 'full', 'half_horizontal')
 * @param context - Template context with photo and TRMNL data
 * @returns Rendered HTML string
 * @throws Error if rendering fails
 */
export async function renderTemplate(
  layout: string,
  context: TemplateContext
): Promise<string> {
  try {
    // Validate layout
    const validLayouts = Object.values(LAYOUTS);
    if (!validLayouts.includes(layout as LayoutType)) {
      throw new Error(
        `Invalid layout '${layout}'. Valid layouts: ${validLayouts.join(', ')}`
      );
    }

    // Load template
    const templateContent = loadTemplate(layout);

    // Render with LiquidJS
    const html = await liquid.parseAndRender(templateContent, context);

    return html;
  } catch (error) {
    console.error(`Template rendering error for layout '${layout}':`, error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to render template: ${error.message}`);
    }
    throw new Error('Failed to render template');
  }
}

/**
 * Render an error template
 * Used when photo fetching or validation fails
 * 
 * @param errorMessage - The error message to display
 * @param instanceName - Plugin instance name
 * @param layout - The layout to use (defaults to 'full')
 * @returns Rendered error HTML
 */
export async function renderErrorTemplate(
  errorMessage: string,
  instanceName: string = 'Google Photos',
  layout: string = LAYOUTS.FULL
): Promise<string> {
  // Create a context with no photo (triggers error state in templates)
  const errorContext: TemplateContext = {
    photo: {
      photo_url: '', // Empty URL triggers error state
      photo_count: 0,
      timestamp: new Date().toISOString(),
    },
    trmnl: {
      plugin_settings: {
        instance_name: instanceName,
        shared_album_url: '',
      },
    },
  };

  try {
    return await renderTemplate(layout, errorContext);
  } catch (error) {
    // If template rendering fails, return a minimal HTML error page
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <h2 style="font-size: 24px; margin-bottom: 10px;">Error</h2>
        <p style="font-size: 16px; color: #666;">${errorMessage}</p>
      </div>
    `;
  }
}

/**
 * Get the default layout based on screen dimensions (if provided)
 * 
 * @param width - Screen width in pixels
 * @param height - Screen height in pixels
 * @returns Recommended layout name
 */
export function getDefaultLayout(width?: number, height?: number): LayoutType {
  if (!width || !height) {
    return LAYOUTS.FULL;
  }

  // Determine aspect ratio
  const aspectRatio = width / height;

  // Portrait orientation
  if (aspectRatio < 1) {
    return height > 400 ? LAYOUTS.FULL : LAYOUTS.HALF_VERTICAL;
  }

  // Landscape orientation
  if (width >= 1024) {
    return LAYOUTS.FULL;
  } else if (width >= 800) {
    return LAYOUTS.HALF_HORIZONTAL;
  } else {
    return LAYOUTS.QUADRANT;
  }
}
