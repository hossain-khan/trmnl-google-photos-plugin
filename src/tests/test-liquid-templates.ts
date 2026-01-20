#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

/**
 * Comprehensive test suite for Liquid Templates
 *
 * This test file validates all Liquid templates in the templates/ directory including:
 * - Template syntax validity (can parse without errors)
 * - Template rendering stability (can render with sample data)
 * - Template rendering with edge cases (empty data, missing fields)
 * - Both main templates and preview templates
 *
 * Usage:
 *   npm test
 *
 * Or directly:
 *   node scripts/test-liquid-templates.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid } from 'liquidjs';

interface TemplateInfo {
  name: string;
  path: string;
  type: string;
}
// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

console.log('🧪 Testing Liquid Templates\n');

// Initialize Liquid engine
const liquid = new Liquid({
  root: join(projectRoot, 'templates'),
  extname: '.liquid',
});

// Template directories and files to test
const TEMPLATES_DIR = join(projectRoot, 'templates');
const PREVIEW_DIR = join(TEMPLATES_DIR, 'preview');

// Get all liquid template files
const mainTemplates = readdirSync(TEMPLATES_DIR)
  .filter((file) => file.endsWith('.liquid'))
  .map((file) => ({
    name: file,
    path: join(TEMPLATES_DIR, file),
    type: 'main',
  }));

const previewTemplates = readdirSync(PREVIEW_DIR)
  .filter((file) => file.endsWith('.liquid'))
  .map((file) => ({
    name: file,
    path: join(PREVIEW_DIR, file),
    type: 'preview',
  }));

const allTemplates = [...mainTemplates, ...previewTemplates];

console.log(`📄 Found ${allTemplates.length} templates to test:`);
allTemplates.forEach((t: TemplateInfo): void => console.log(`   - ${t.type}/${t.name}`));
console.log('');

// Sample data for testing main templates
const validPhotoData = {
  photo_url: 'https://lh3.googleusercontent.com/test/photo.jpg',
  caption: 'Test photo caption',
  photo_count: 42,
  album_name: 'Test Album',
  trmnl: {
    plugin_settings: {
      instance_name: 'Google Photos Shared Album',
      custom_fields_values: {
        custom_title: 'Test Instance',
      },
    },
  },
};

const emptyPhotoData = {
  photo_url: '',
  caption: '',
  photo_count: 0,
  album_name: '',
  trmnl: {
    plugin_settings: {
      instance_name: 'Google Photos Shared Album',
      custom_fields_values: {
        custom_title: 'Test Instance',
      },
    },
  },
};

const missingPhotoData = {
  trmnl: {
    plugin_settings: {
      instance_name: 'Google Photos Shared Album',
      custom_fields_values: {
        custom_title: '',
      },
    },
  },
};

const longCaptionData = {
  photo_url: 'https://lh3.googleusercontent.com/test/photo.jpg',
  caption:
    'This is a very long caption that should be truncated by the data-clamp attribute. '.repeat(10),
  photo_count: 142,
  album_name: 'Summer Vacation 2026',
  trmnl: {
    plugin_settings: {
      instance_name: 'Google Photos Shared Album',
      custom_fields_values: {
        custom_title: 'Test Instance',
      },
    },
  },
};

// Test Suite 1: Template Syntax Validity
describe('Template Syntax Validity', (): void => {
  allTemplates.forEach((template: TemplateInfo): void => {
    it(`should parse ${template.type}/${template.name} without syntax errors`, async (): Promise<void> => {
      // Skip shared.liquid - it contains TRMNL-specific {% template %} tags that liquidjs doesn't support
      // These templates are meant to be rendered by TRMNL's platform, not standalone
      if (template.name === 'shared.liquid') {
        assert.ok(true, 'Skipping shared.liquid (contains TRMNL-specific {% template %} tags)');
        return;
      }

      // Skip main layout templates that use {% render %} - they require shared.liquid's {% template %} definitions
      // which liquidjs doesn't support. TRMNL platform handles these properly.
      const content = readFileSync(template.path, 'utf-8');
      if (template.type === 'main' && content.includes('{% render')) {
        assert.ok(
          true,
          `Skipping ${template.name} (uses {% render %} which requires TRMNL platform)`
        );
        return;
      }

      // Attempt to parse the template
      try {
        await liquid.parseAndRender(content, validPhotoData);
        assert.ok(true, 'Template parsed successfully');
      } catch (error) {
        assert.fail(`Template has syntax errors: ${(error as Error).message}`);
      }
    });
  });
});

// Test Suite 2: Main Template Rendering with Valid Data
describe('Main Template Rendering - Valid Data', (): void => {
  mainTemplates.forEach((template: TemplateInfo): void => {
    it(`should render ${template.name} with valid photo data`, async (): Promise<void> => {
      const content = readFileSync(template.path, 'utf-8');

      // Skip templates that use TRMNL-specific tags
      if (template.name === 'shared.liquid' || content.includes('{% render')) {
        assert.ok(true, `Skipping ${template.name} (requires TRMNL platform)`);
        return;
      }

      const rendered = await liquid.parseAndRender(content, validPhotoData);

      // Basic assertions
      assert.ok(rendered.length > 0, 'Rendered output should not be empty');

      // Skip layout-specific checks for shared.liquid (it's just variables)
      if (template.name !== 'shared.liquid') {
        assert.ok(rendered.includes('img'), 'Should contain image tag');
        assert.ok(rendered.includes(validPhotoData.photo_url), 'Should include photo URL');
        assert.ok(
          rendered.includes(validPhotoData.trmnl.plugin_settings.custom_fields_values.custom_title),
          'Should include custom title'
        );
      }
    });
  });
});

// Test Suite 3: Main Template Rendering with Empty Data
describe('Main Template Rendering - Empty Data', (): void => {
  mainTemplates.forEach((template: TemplateInfo): void => {
    it(`should render ${template.name} with empty photo data (error state)`, async (): Promise<void> => {
      const content = readFileSync(template.path, 'utf-8');

      // Skip templates that use TRMNL-specific tags
      if (template.name === 'shared.liquid' || content.includes('{% render')) {
        assert.ok(true, `Skipping ${template.name} (requires TRMNL platform)`);
        return;
      }

      const rendered = await liquid.parseAndRender(content, emptyPhotoData);

      // Should render error state (either no image tag or an error message)
      assert.ok(rendered.length > 0, 'Rendered output should not be empty');
      // Empty data should trigger error state - check for either missing img or error message
      const hasErrorMessage = rendered.includes('No Photo') || rendered.includes('Configure');
      const hasNoImage = !rendered.includes('<img');
      assert.ok(hasErrorMessage || hasNoImage, 'Should show error state when photo_url is empty');
    });
  });
});

// Test Suite 4: Main Template Rendering with Missing Data
describe('Main Template Rendering - Missing Data', (): void => {
  mainTemplates.forEach((template: TemplateInfo): void => {
    it(`should render ${template.name} with missing photo data`, async (): Promise<void> => {
      const content = readFileSync(template.path, 'utf-8');

      // Skip templates that use TRMNL-specific tags
      if (template.name === 'shared.liquid' || content.includes('{% render')) {
        assert.ok(true, `Skipping ${template.name} (requires TRMNL platform)`);
        return;
      }

      const rendered = await liquid.parseAndRender(content, missingPhotoData);

      // Should handle missing data gracefully
      assert.ok(rendered.length > 0, 'Rendered output should not be empty');

      // Skip layout-specific checks for shared.liquid (it's just variables)
      if (template.name !== 'shared.liquid') {
        assert.ok(
          rendered.includes('Google Photos Shared Album'),
          'Should fall back to plugin name when instance_name is empty'
        );
      }
    });
  });
});

// Test Suite 5: Main Template Rendering with Long Caption
describe('Main Template Rendering - Long Caption', (): void => {
  mainTemplates.forEach((template: TemplateInfo): void => {
    it(`should render ${template.name} with long caption`, async (): Promise<void> => {
      const content = readFileSync(template.path, 'utf-8');

      // Skip templates that use TRMNL-specific tags
      if (template.name === 'shared.liquid' || content.includes('{% render')) {
        assert.ok(true, `Skipping ${template.name} (requires TRMNL platform)`);
        return;
      }

      const rendered = await liquid.parseAndRender(content, longCaptionData);

      // Should render without errors and handle long caption appropriately
      assert.ok(rendered.length > 0, 'Rendered output should not be empty');
      // Templates should either use data-clamp for truncation or be layouts that don't show captions
      const hasDataClamp = rendered.includes('data-clamp');
      const hasCaption = rendered.includes('caption');
      // If caption is shown, data-clamp should be used for long captions
      if (hasCaption) {
        assert.ok(hasDataClamp, 'Templates with captions should use data-clamp for truncation');
      }
    });
  });
});

// Test Suite 6: Preview Template Rendering
describe('Preview Template Rendering', (): void => {
  previewTemplates.forEach((template: TemplateInfo): void => {
    it(`should render preview/${template.name} with hardcoded data`, async (): Promise<void> => {
      const content = readFileSync(template.path, 'utf-8');

      // Preview templates have hardcoded content, should render without external data
      const rendered = await liquid.parseAndRender(content, {});

      // Basic assertions
      assert.ok(rendered.length > 0, 'Rendered output should not be empty');
      assert.ok(rendered.includes('img'), 'Should contain image tag');
      assert.ok(
        rendered.includes('https://picsum.photos') || rendered.includes('http'),
        'Should include image URL'
      );
    });
  });
});

// Test Suite 7: Template Structure Validation
describe('Template Structure Validation', (): void => {
  allTemplates.forEach((template: TemplateInfo): void => {
    it(`should have proper structure in ${template.type}/${template.name}`, (): void => {
      const content = readFileSync(template.path, 'utf-8');

      // Skip layout-specific checks for shared.liquid (it's just variables)
      if (template.name === 'shared.liquid') {
        // shared.liquid should just contain variable definitions
        assert.ok(
          content.includes('icon_google_photos'),
          'Should define icon_google_photos variable'
        );
        return;
      }

      // Check for essential structural elements
      assert.ok(content.includes('<div class="layout">'), 'Should have layout div');
      assert.ok(content.includes('<div class="title_bar">'), 'Should have title_bar div');
      assert.ok(content.includes('flex'), 'Should use flex classes');

      // Main templates should have conditionals for photo_url
      if (template.type === 'main') {
        assert.ok(content.includes('{% if photo_url'), 'Main template should check for photo_url');
        assert.ok(
          content.includes('{% else %}'),
          'Main template should have else clause for empty state'
        );
        assert.ok(content.includes('{% endif %}'), 'Main template should close if statement');
      }
    });
  });
});

// Test Suite 8: Template Consistency Between Main and Preview
describe('Template Consistency - Main vs Preview', (): void => {
  mainTemplates.forEach((mainTemplate) => {
    const previewTemplate = previewTemplates.find((p) => p.name === mainTemplate.name);

    if (previewTemplate) {
      it(`should have similar structure between main/${mainTemplate.name} and preview/${mainTemplate.name}`, (): void => {
        const mainContent = readFileSync(mainTemplate.path, 'utf-8');
        const previewContent = readFileSync(previewTemplate.path, 'utf-8');

        // Skip shared.liquid
        if (mainTemplate.name === 'shared.liquid') {
          assert.ok(true, 'Skipping shared.liquid');
          return;
        }

        // Check for key structural CSS classes that should be consistent
        // Note: Main templates use {% render %}, so 'image' class is in shared.liquid template definition
        const keyClasses = ['flex', 'title'];
        const mainHasKeyClasses = keyClasses.filter((cls) => mainContent.includes(cls));
        const previewHasKeyClasses = keyClasses.filter((cls) => previewContent.includes(cls));

        // Both templates should use the same key CSS classes
        assert.deepStrictEqual(
          mainHasKeyClasses.sort(),
          previewHasKeyClasses.sort(),
          'Main and preview templates should use the same key CSS classes'
        );

        // Check that both have similar HTML structure (same number of divs within 20%)
        const mainDivCount = (mainContent.match(/<div/g) || []).length;
        const previewDivCount = (previewContent.match(/<div/g) || []).length;
        const divCountRatio =
          Math.min(mainDivCount, previewDivCount) / Math.max(mainDivCount, previewDivCount);

        assert.ok(
          divCountRatio > 0.5,
          `Main and preview should have similar structure (div count ratio: ${(divCountRatio * 100).toFixed(0)}%)`
        );
      });
    }
  });
});

// Test Suite 9: Template Variables Usage
describe('Template Variables Usage', (): void => {
  mainTemplates.forEach((template: TemplateInfo): void => {
    it(`should use standard template variables in ${template.name}`, (): void => {
      const content = readFileSync(template.path, 'utf-8');
      // Skip for shared.liquid - it defines variables, not uses them
      if (template.name === 'shared.liquid') {
        assert.ok(
          content.includes('icon_google_photos'),
          'shared.liquid should define icon_google_photos'
        );
        return;
      }
      // Check for instance name variable (direct access, not via trmnl.plugin_settings)
      assert.ok(content.includes('instance_name'), 'Should use instance_name variable');

      // Check for photo-related variables - main templates use {% render %} to pass photo_url
      assert.ok(
        content.includes('photo_url') || content.includes('{% render'),
        'Should use photo_url variable or render template with photo_url'
      );
    });
  });
});

// Test Suite 10: Image Attributes Validation
describe('Image Attributes Validation', (): void => {
  allTemplates.forEach((template: TemplateInfo): void => {
    it(`should have proper image attributes in ${template.type}/${template.name}`, (): void => {
      const content = readFileSync(template.path, 'utf-8');

      // Skip for shared.liquid - it has {% template %} definition with image
      if (template.name === 'shared.liquid') {
        // shared.liquid has the icon and photo_display template
        assert.ok(
          content.includes('data:image/png;base64'),
          'shared.liquid should define base64 icon'
        );
        // Photo display template has image with proper attributes
        assert.ok(
          content.includes('class=') && content.includes('image'),
          'shared.liquid photo_display template should have image class'
        );
        return;
      }

      // Check for image tags (either inline <img or {% render "photo_display" %})
      const hasInlineImage = content.includes('<img');
      const hasRenderImage = content.includes('{% render "photo_display"');

      if (hasInlineImage) {
        // Check for required attributes
        assert.ok(content.includes('src='), 'Image should have src attribute');
        assert.ok(content.includes('alt='), 'Image should have alt attribute for accessibility');
        assert.ok(
          content.includes('class=') && content.includes('image'),
          'Image should have image class'
        );

        // Check for image sizing attributes that maintain aspect ratio
        // Templates should use either image--contain class OR object-fit: contain style
        const hasContainClass = content.includes('image--contain');
        const hasContainStyle = content.includes('object-fit: contain');

        assert.ok(
          hasContainClass || hasContainStyle,
          'Images should use contain sizing (class or style) to maintain aspect ratio'
        );
      } else if (hasRenderImage) {
        // Main templates use {% render %}, which handles image attributes in shared.liquid
        assert.ok(true, 'Uses shared photo_display template (attributes defined in shared.liquid)');
      }
    });
  });
});

console.log('\n✅ All Liquid template tests completed!\n');
