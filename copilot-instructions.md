# TRMNL Plugin - Copilot Instructions Template

> **Note**: This is a generic template for TRMNL plugin projects. Replace placeholders with your project-specific information.

> **Repository**: [your-username/your-repo-name](https://github.com/your-username/your-repo-name)  
> **Author**: Your Name  
> **Last Updated**: [Current Date]

## Project Overview

[Provide a brief description of what your TRMNL plugin does, its key features, and the value it provides to users]

### Key Goals

1. **[Goal 1]**: [Description]
2. **[Goal 2]**: [Description]
3. **[Goal 3]**: [Description]

### Current Status

[Describe the current state of the project - what's complete, what's in progress, what's planned]

## Getting Started

For developers working on this project:

1. **Understand the Project**: Read this file completely for comprehensive context
2. **Review Documentation**:
   - `README.md` - Project overview and installation
   - [List any other relevant documentation files]
3. **Test Templates**: Preview layouts in TRMNL Markup Editor or locally
4. **Review Framework**: Familiarize yourself with [TRMNL Framework](https://usetrmnl.com/framework)

## Project Structure

```
your-plugin-name/
├── .github/                      # GitHub configuration
│   ├── workflows/               # GitHub Actions (if applicable)
│   └── copilot-instructions.md  # This file
├── assets/                       # Design assets
│   ├── icon/                    # Plugin icons
│   └── demo/                    # Demo screenshots
├── templates/                    # Template layouts (uploaded to TRMNL)
│   ├── full.liquid              # Full-screen layout
│   ├── half_horizontal.liquid   # Half-size horizontal layout
│   ├── half_vertical.liquid     # Half-size vertical layout
│   ├── quadrant.liquid          # Quarter-size layout
│   └── shared.liquid            # Reusable templates and assets
├── settings.yml                  # Plugin settings configuration
├── custom-fields.yml            # Custom form fields configuration
├── LICENSE                       # License file
└── .gitignore                    # Git ignore patterns
```

## Key Files

- **templates/\*.liquid**: Layout templates that adapt to different display sizes (uploaded to TRMNL Markup Editor)
- **templates/shared.liquid**: Reusable template components, variables, and assets
- **settings.yml**: TRMNL plugin configuration (strategy, refresh frequency, layouts)
- **custom-fields.yml**: User-facing form fields for plugin configuration

### Template Structure and Best Practices

**Main Templates** (`templates/*.liquid`):

- Use template variables from your data source (e.g., API, webhook, static data)
- Include conditionals for handling missing data
- Always provide error states for unconfigured plugins
- These are uploaded to TRMNL Markup Editor and used in production

**Shared Templates** (`templates/shared.liquid`):

- Define reusable components using `{% template %}...{% endtemplate %}`
- Store base64-encoded icons and assets
- Include common variables and logic
- Use `{% render %}` to include shared templates in main layouts

**Critical Rule**: Keep templates DRY (Don't Repeat Yourself). Extract common patterns into shared templates.

## TRMNL Framework v2

### Device Specifications

> **Note**: Dimensions shown are **logical CSS dimensions** (scaled for consistent rendering).
> Physical resolutions may differ. See [Device Models API](https://usetrmnl.com/api/models) for complete specifications.

| Device      | Width  | Height | Bit Depth | Display Type           | Breakpoint |
| ----------- | ------ | ------ | --------- | ---------------------- | ---------- |
| TRMNL X     | 1040px | 780px  | 4-bit     | Grayscale (16 shades)  | lg:        |
| TRMNL OG V2 | 800px  | 480px  | 2-bit     | Grayscale (4 shades)   | md:        |
| TRMNL OG    | 800px  | 480px  | 1-bit     | Monochrome (2 shades)  | md:        |
| Kindle 2024 | 800px  | 480px  | 8-bit     | Grayscale (256 shades) | sm:        |

**Official TRMNL Devices** (3): TRMNL X, TRMNL OG V2, TRMNL OG  
**Kindle Devices** (6): 2024, 7, PW 6th/7th Gen, Oasis 2, Scribe  
**BYOD Devices** (18+): Kobo, Inkplate, Waveshare, M5Paper, Onyx Boox, and more  
**Total Supported**: 27+ devices

**Reference**: [Device Models API](https://usetrmnl.com/api/models) • [Framework Documentation](https://usetrmnl.com/framework)

### Responsive System

The framework uses a **mobile-first** approach with responsive dimensions:

#### 1. Size-Based Breakpoints (Progressive)

- `sm:` - 600px+ (Kindle devices in portrait)
- `md:` - 800px+ (TRMNL OG, OG V2, most BYOD)
- `lg:` - 1024px+ (TRMNL X, Kindle Scribe, Kobo, etc.)

**Usage**: `md:value--large lg:value--xlarge` (applies at breakpoint and above)

**Example**:
```liquid
<span class="value value--small md:value--large lg:value--xlarge">Responsive Text</span>
```

#### 2. Bit-Depth Variants (Specific)

- `1bit:` - Monochrome (2 shades) - TRMNL OG, Waveshare, Inky Impression
- `2bit:` - Grayscale (4 shades) - TRMNL OG V2, Seeed
- `4bit:` - Grayscale (16 shades) - TRMNL X, M5Paper, Kobo Aura HD
- `8bit:` - Grayscale (256 shades) - All Kindle devices, Kobo Libra

**Usage**: `1bit:bg--black 2bit:bg--gray-45 4bit:bg--gray-75` (each targets only that bit-depth)

**Example**:
```liquid
<div class="bg--white 1bit:bg--black 2bit:bg--gray-45 4bit:bg--gray-75">
  Optimized for each bit-depth
</div>
```

#### 3. Orientation-Based (Specific)

- `portrait:` - Portrait orientation only (landscape is default)

**Usage**: `flex--row portrait:flex--col`

**Example**:
```liquid
<div class="flex flex--row gap--medium portrait:flex--col portrait:gap--small">
  <!-- Switches to column layout in portrait -->
</div>
```

#### 4. Combined Modifiers

Pattern: `size:orientation:bit-depth:utility`

**Example**: `md:portrait:4bit:flex--col` (medium+ screens, portrait, 4-bit display)

### Core Utilities

**ALWAYS use TRMNL framework utilities instead of custom CSS where possible.**

#### Layout

- **Flexbox**: `flex flex--row`, `flex--col`, `flex--center-y`, `flex--center-x`, `flex--between`, `gap--xsmall`, `gap--small`, `gap--medium`, `gap--large`
- **Grid**: `grid grid--cols-2`, `grid--cols-3`, `gap--xsmall`
- **Sizing**: `w--40`, `w--52`, `min-w--40`, `h--36`, `h--full`
- **Spacing**: `p--1`, `p--2`, `mb--xsmall`, `mb--small`, `my--24`

**Best Practice**: Use `flex: 1` inline style for flexible sizing within containers:
```liquid
<div class="flex flex--col h--full">
  <div class="flex flex--center-x flex--center-y" style="flex: 1;">
    <!-- Content fills available space -->
  </div>
</div>
```

#### Typography

- **Title**: `title title--small`, `title--medium`, `title--large`, `title--xlarge` (for headings, names)
- **Value**: `value value--small`, `value--medium`, `value--large`, `value--xlarge`, `value--xxlarge`, `value--xxxlarge` (for numbers, symbols)
- **Label**: `label label--small`, `label--inverted` (for categories, badges)
- **Description**: `description` (for body text)

**Best Practice**: Scale typography with breakpoints:
```liquid
<span class="value value--small md:value--large lg:value--xlarge">42</span>
<span class="title title--small md:title--medium lg:title--large">Heading</span>
```

#### Visual

- **Background**: `bg--white`, `bg--gray-50`, `bg--gray-75`
- **Border**: `outline`, `rounded`, `rounded--large`
- **Alignment**: `text--center`, `text--left`, `text--right`
- **Effects**: `text-stroke`, `text-stroke--large` (for text on images)

#### Images

- **Image Classes**: `image`, `image--contain`, `image--cover`, `image-dither`

**Best Practice**: Always use `image--contain` for responsive images:
```liquid
<img src="{{ image_url }}" 
     alt="{{ description }}" 
     class="image image--contain image-dither"
     style="max-width: 100%; max-height: 100%; object-fit: contain;">
```

#### Modulations

- **data-value-fit**: Automatically resizes text to fit container
  - `data-value-fit="true"` - Enable fitting
  - `data-value-fit-max-height="120"` - Set maximum height
- **data-clamp**: Truncate text to specific lines
  - `data-clamp="1"` - Show 1 line, truncate rest
  - `data-clamp="2"` - Show 2 lines, truncate rest

**Best Practice**: Use `data-clamp` for captions and descriptions:
```liquid
<span class="description" data-clamp="2">{{ long_caption }}</span>
```

## Layout System

### Standard Layout Types

TRMNL plugins typically provide four layout types for different display configurations:

#### 1. Full Layout (`full.liquid`)

**Use Case**: Full-screen display (entire TRMNL screen)

**Key Features**:
- Maximum content area
- Larger typography and spacing
- Room for detailed information
- Error state for unconfigured plugin

**Layout Structure Pattern**:
```liquid
<div class="layout">
  {% if data_available %}
  <div class="flex flex--col gap--medium h--full">
    <!-- Main content area -->
    <div class="flex flex--center-x flex--center-y" style="flex: 1;">
      [Your content here]
    </div>
    <!-- Optional secondary content -->
  </div>
  {% else %}
  {% render "error_state", size: "full" %}
  {% endif %}
</div>

<div class="title_bar">
  <img src="{{ icon }}" class="icon h--6" alt="Plugin Name">
  <span class="title md:title--large">{{ title }}</span>
  <span class="instance">{{ metadata }}</span>
</div>
```

#### 2. Half Horizontal Layout (`half_horizontal.liquid`)

**Use Case**: Half-size horizontal display (side-by-side layout)

**Key Features**:
- Content on left, details on right (or vice versa)
- Vertical centering
- Portrait mode fallback: switches to column layout
- Compact spacing

**Layout Structure Pattern**:
```liquid
<div class="flex flex--row gap--medium portrait:flex--col flex--center-y h--full">
  <div style="flex: 1;">
    [Main content]
  </div>
  <div class="flex flex--col gap--xsmall" style="max-width: 200px; portrait:max-width: 100%;">
    [Secondary content]
  </div>
</div>
```

#### 3. Half Vertical Layout (`half_vertical.liquid`)

**Use Case**: Half-size vertical display

**Key Features**:
- Maximizes primary content area
- Compact secondary content below
- Minimal padding to maximize space

**Layout Structure Pattern**:
```liquid
<div class="flex flex--col gap--small h--full">
  <div class="flex flex--center-x flex--center-y" style="flex: 1;">
    [Main content]
  </div>
  <div class="text--center">
    [Secondary content]
  </div>
</div>
```

#### 4. Quadrant Layout (`quadrant.liquid`)

**Use Case**: Quarter-size display (most compact)

**Key Features**:
- Primary content only
- Minimal padding (`p--1`)
- Simplified title bar
- Every pixel counts

**Layout Structure Pattern**:
```liquid
<div class="flex flex--center-x flex--center-y h--full">
  [Primary content only]
</div>

<div class="title_bar">
  <img src="{{ icon }}" class="icon h--5" alt="Plugin Name">
  <span class="title title--small">{{ title }}</span>
</div>
```

## Design Patterns & Best Practices

### 1. Reusable Templates (Shared.liquid)

**Always** define reusable components in `shared.liquid`:

```liquid
{% comment %}
  Component: Data Display
  Description: Displays data with consistent styling
  Parameters:
  - value: The value to display (required)
  - label: Optional label text
{% endcomment %}
{% template data_display %}
<div class="flex flex--col gap--xsmall">
  {% if label %}
  <span class="label">{{ label }}</span>
  {% endif %}
  <span class="value value--large">{{ value }}</span>
</div>
{% endtemplate %}

{% comment %}
  Usage in layouts:
  {% render "data_display", value: my_data, label: "Temperature" %}
{% endcomment %}
```

### 2. Error State Pattern

**Always** provide helpful error states for unconfigured or failed plugins:

```liquid
{% template error_state %}
{% if size == 'full' %}
<div class="flex flex--col flex--center-x flex--center-y gap--medium h--full">
  <div class="value value--large md:value--xlarge text--center">[Icon/Emoji]</div>
  <div class="title title--medium md:title--large text--center">[Error Title]</div>
  <div class="description md:title md:title--small text--center">
    [Clear instructions for configuration]
  </div>
</div>
{% elsif size == 'half' %}
<div class="flex flex--col flex--center-x flex--center-y gap--small h--full">
  <div class="value value--medium md:value--large">[Icon/Emoji]</div>
  <div class="title title--small md:title--medium text--center">[Short Error]</div>
  <div class="description text--center">[Brief instructions]</div>
</div>
{% elsif size == 'quadrant' %}
<div class="flex flex--col flex--center-x flex--center-y gap--xsmall h--full">
  <div class="value value--small">[Icon]</div>
  <div class="description text--center">[Minimal message]</div>
</div>
{% endif %}
{% endtemplate %}
```

### 3. Title Bar Pattern

**Standard** title bar structure for all layouts:

```liquid
<div class="title_bar">
  <!-- Icon: Use h--5 for compact layouts, h--6 for full layouts -->
  <img src="{{ icon }}" class="icon h--6 md:h--6" alt="Plugin Name">
  
  <!-- Title: Allow custom title override -->
  <span class="title md:title--large">
    {% if trmnl.plugin_settings.custom_fields_values.custom_title and trmnl.plugin_settings.custom_fields_values.custom_title != '' %}
      {{ trmnl.plugin_settings.custom_fields_values.custom_title }}
    {% else %}
      {{ trmnl.plugin_settings.instance_name }}
    {% endif %}
  </span>
  
  <!-- Metadata: Optional instance information -->
  {% if metadata %}
  <span class="instance">{{ metadata }}</span>
  {% endif %}
</div>
```

### 4. Responsive Sizing Strategy

**Images**:
- Use percentage-based sizing: `max-width: 100%; max-height: 100%`
- Let container control size via `flex: 1`
- Always use `object-fit: contain` to prevent cropping
- Use `image-dither` class for e-ink optimization

**Text**:
- Use framework classes: `description`, `title`, `value`
- Scale with breakpoints: `value--small md:value--large lg:value--xlarge`
- Use `data-clamp` to prevent overflow
- Adjust font size for compact layouts

**Spacing**:
- Use `gap--` utilities for consistent spacing
- Scale gaps with breakpoints: `gap--small md:gap--medium`
- Use minimal padding in compact layouts

### 5. Layout Padding Strategy

- **Full layout**: `p--2` (standard padding for breathing room)
- **Half layouts**: `p--2` (same as full)
- **Quadrant layout**: `p--1` (minimal padding to maximize space)

Use consistent padding unless space constraints require reduction.

### 6. Conditional Rendering Pattern

**Always** check for data existence before rendering:

```liquid
{% if data_field and data_field != '' %}
  <!-- Display data -->
  <span class="value">{{ data_field }}</span>
{% else %}
  <!-- Fallback or skip -->
  <span class="description">No data available</span>
{% endif %}
```

### 7. Data Formatting Best Practices

**Numbers**:
```liquid
<!-- With thousands separator -->
{{ number | divided_by: 1.0 | round: 0 | number_with_delimiter }}

<!-- Percentage -->
{{ value | times: 100 | round: 1 }}%
```

**Dates**:
```liquid
<!-- Relative time -->
{{ timestamp | relative_time }}

<!-- Formatted date -->
{{ timestamp | date: "%B %d, %Y" }}

<!-- Year only -->
{{ timestamp | date: "%Y" }}
```

**Text Truncation**:
```liquid
<!-- With data-clamp -->
<span class="description" data-clamp="2">{{ long_text }}</span>

<!-- With Liquid filter -->
{{ long_text | truncate: 100 }}
```

## Common Issues & Solutions

### Issue 1: Layout Breaking on Different Devices

**Problem**: Layout looks correct on one device but breaks on others

**Solution**:
- Test all four device sizes using TRMNL Markup Editor preview
- Use responsive breakpoints consistently: `sm:`, `md:`, `lg:`
- Use `portrait:` prefix for portrait-specific styles
- Keep layouts simple - complexity increases breakage risk
- Use framework utilities instead of custom CSS

### Issue 2: Text Overflow

**Problem**: Long text pushes content out of view

**Solution**:
- Use `data-clamp="2"` or `data-clamp="4"` to limit lines
- Set `max-width` on text containers
- Use `truncate` filter for single-line text
- Test with long sample data

### Issue 3: Images Not Displaying Properly

**Problem**: Images appear stretched, cropped, or broken

**Solution**:
- Always use `object-fit: contain` to maintain aspect ratio
- Use `image--contain` class from TRMNL framework
- Center images with `flex--center-x flex--center-y`
- Ensure image URLs are HTTPS (TRMNL requires secure connections)
- Add error state fallback for failed loads

### Issue 4: Inconsistent Spacing

**Problem**: Spacing looks different across layouts

**Solution**:
- Use `gap--` utilities consistently
- Scale gaps with breakpoints: `gap--small md:gap--medium`
- Use framework spacing classes: `mb--small`, `p--2`
- Avoid custom margin/padding CSS

### Issue 5: Empty State Not Showing

**Problem**: No feedback when plugin unconfigured or data unavailable

**Solution**:
- Always check for data existence: `{% if data_field %}`
- Provide clear else block with instructions
- Include visual indicator (emoji/icon) for better UX
- Center error state content for visual balance
- Use responsive error state templates (full/half/quadrant)

## Data Structure

### Plugin Data Sources

TRMNL plugins can receive data through several strategies:

1. **Polling Strategy**: TRMNL periodically fetches JSON from your endpoint
   - Configure `polling_url` in `settings.yml`
   - Return JSON with template variables
   - TRMNL merges data into templates

2. **Webhook Strategy**: Your service pushes data to TRMNL
   - Configure webhook endpoint in TRMNL
   - Push JSON payloads when data changes
   - Immediate updates (no polling delay)

3. **Static Strategy**: Templates use hardcoded or user-entered data
   - No external data source needed
   - Good for simple display plugins

### Accessing Data in Templates

**Template Variables** (from JSON response):
```liquid
<!-- Direct access (no prefix needed) -->
{{ variable_name }}

<!-- With default value -->
{{ variable_name | default: "fallback value" }}

<!-- Conditional rendering -->
{% if variable_name %}
  {{ variable_name }}
{% endif %}
```

**TRMNL Platform Variables**:
```liquid
<!-- User information -->
{{ trmnl.user.first_name }}
{{ trmnl.user.timezone }}

<!-- Plugin settings -->
{{ trmnl.plugin_settings.instance_name }}
{{ trmnl.plugin_settings.custom_fields_values.field_name }}

<!-- Device information -->
{{ trmnl.device.model }}
{{ trmnl.device.orientation }}
```

**Custom Fields** (from `custom-fields.yml`):
```liquid
<!-- Access via plugin settings -->
{{ trmnl.plugin_settings.custom_fields_values.my_custom_field }}

<!-- Boolean field check -->
{% if trmnl.plugin_settings.custom_fields_values.enable_feature == "true" %}
  <!-- Feature enabled -->
{% endif %}
```

## Testing Strategy

### Test Scenarios

Critical scenarios to test for any TRMNL plugin:

1. **Happy Path**:
   - Valid configuration with complete data
   - Data displays correctly in all four layouts
   - Text truncates properly without overflow
   - Responsive behavior works across device sizes

2. **Edge Cases**:
   - Empty or minimal data
   - Very long text (100+ characters)
   - Special characters and unicode
   - Null or undefined values
   - Network timeouts (for polling/webhook)

3. **Error States**:
   - No configuration (initial state)
   - Invalid configuration
   - Failed data fetch
   - Malformed data response
   - Missing required fields

### Manual Testing Checklist

- [ ] Test in TRMNL Markup Editor for all device sizes (sm, md, lg)
- [ ] Verify each layout (full, half_horizontal, half_vertical, quadrant)
- [ ] Test with minimal data (edge case)
- [ ] Test with maximum data (edge case)
- [ ] Verify text truncation with long content
- [ ] Check error states display properly
- [ ] Test portrait mode rendering (if applicable)
- [ ] Verify bit-depth variants (1-bit, 2-bit, 4-bit, 8-bit)
- [ ] Check accessibility (alt text, semantic HTML)
- [ ] Test with real data source (API/webhook)

### Device Testing

Test across device categories:

- **Small (sm:)**: Kindle devices (600px width)
- **Medium (md:)**: TRMNL OG, OG V2 (800px width)
- **Large (lg:)**: TRMNL X (1024px width)

Use TRMNL Markup Editor's device preview to test all sizes.

## Code Style Guidelines

1. **Use framework utilities exclusively**: Prefer TRMNL classes over custom CSS
2. **Follow mobile-first responsive**: Base styles first, then `md:`, then `lg:`
3. **Always provide error states**: Users need feedback when plugin unconfigured
4. **Use semantic class names**: `title`, `value`, `label`, `description`
5. **Extract reusable components**: Define in `shared.liquid` and use `{% render %}`
6. **Add conditional rendering**: Check for data existence before displaying
7. **Scale typography responsively**: Use breakpoint prefixes for larger screens
8. **Test all layouts**: Changes should work across all four layout types
9. **Optimize for e-ink**: Use `image-dither`, test with grayscale
10. **Document your templates**: Add comments explaining complex logic

## Plugin Development Best Practices

### From TRMNL Plugin Guides

Based on [TRMNL Plugin Guides](https://help.usetrmnl.com/en/collections/7820559-plugin-guides):

1. **Recipe Best Practices**:
   - Provide clear plugin description and purpose
   - Include demo data for testing
   - Add helpful form field labels and placeholders
   - Test thoroughly before publishing
   - Provide good error messages

2. **Form Builder Best Practices**:
   - Use appropriate field types (text, select, checkbox, etc.)
   - Add validation where needed
   - Provide helpful descriptions
   - Use conditional visibility for related fields
   - See [Custom Plugin Form Builder](https://help.usetrmnl.com/en/articles/10513740-custom-plugin-form-builder)

3. **Liquid Best Practices**:
   - Learn Liquid basics: [Liquid 101](https://help.usetrmnl.com/en/articles/10671186-liquid-101)
   - Advanced techniques: [Advanced Liquid](https://help.usetrmnl.com/en/articles/10693981-advanced-liquid)
   - Use filters for data formatting
   - Use loops for repeating content
   - Use conditionals for dynamic content

4. **Debugging**:
   - Use browser dev tools for markup debugging
   - Check network tab for polling/webhook issues
   - See [Debugging Private Plugins](https://help.usetrmnl.com/en/articles/11586187-debugging-private-plugins)
   - Test with demo data before live data

5. **Framework Design**:
   - Study [Framework Design Docs](https://help.usetrmnl.com/en/articles/12410486-framework-design-docs)
   - Use built-in utilities over custom CSS
   - Follow responsive patterns
   - Optimize for e-ink displays

### Plugin Architecture Patterns

**Stateless Design**:
- No user data persistence between refreshes
- Each render is independent
- Keep plugins simple and focused

**Error Handling**:
- Always handle missing/invalid data gracefully
- Provide clear user feedback
- Log errors for debugging (when applicable)

**Performance**:
- Minimize external dependencies
- Optimize image sizes
- Cache when appropriate
- Keep responses fast (<3 seconds)

## Development Notes

**About This Template**: These copilot instructions provide a comprehensive starting point for any TRMNL plugin project. Customize this template for your specific plugin by:

1. Replacing placeholder text with your project details
2. Adding project-specific patterns and conventions
3. Documenting your data structure and API endpoints
4. Adding examples relevant to your plugin type
5. Removing sections that don't apply to your project

**Key Principles**:

- **Framework First**: Always use TRMNL framework utilities
- **Responsive Design**: Test across all device sizes
- **Error States**: Always provide user feedback
- **DRY Code**: Extract reusable components to shared.liquid
- **Accessibility**: Add alt text, semantic HTML, proper contrast
- **E-ink Optimization**: Use dithering, grayscale-friendly colors, readable fonts

**Resources**:

- [TRMNL Framework](https://usetrmnl.com/framework) - Complete design system documentation
- [Plugin Guides](https://help.usetrmnl.com/en/collections/7820559-plugin-guides) - How-to guides and best practices
- [Device Models API](https://usetrmnl.com/api/models) - Device specifications
- [Liquid Documentation](https://shopify.github.io/liquid/) - Liquid template language reference

## Workflow

[Describe your plugin's workflow - how data flows from source to display]

Example workflow for polling strategy:

1. **User Setup**: User configures plugin settings in TRMNL
2. **TRMNL Polling**: Platform sends GET request to your endpoint (per refresh_frequency)
3. **Data Fetch**: Your backend fetches/generates data
4. **JSON Response**: Return JSON with template variables
5. **TRMNL Rendering**: TRMNL platform merges JSON into templates
6. **Display**: TRMNL sends rendered content to device for e-ink display

## Technical Stack

[List your plugin's technical stack]

Example for polling-based plugin:

- **Backend**: [Your backend technology - Cloudflare Workers, Node.js, Python, etc.]
- **Framework**: [If applicable - Express, Hono, Flask, etc.]
- **Language**: [TypeScript, JavaScript, Python, etc.]
- **Caching**: [If applicable - Redis, KV, etc.]
- **Monitoring**: [If applicable - Analytics, logging]
- **Deployment**: [Where/how deployed]

## Future Considerations

[List potential future enhancements or considerations]

Example ideas:

- Additional layout options
- More configuration options
- Enhanced error handling
- Performance optimizations
- Additional data sources
- Multi-language support
- Accessibility improvements

---

## Quick Reference

### Common Framework Classes

```liquid
<!-- Layout -->
flex flex--row flex--col flex--center-x flex--center-y flex--between
grid grid--cols-2 grid--cols-3
gap--xsmall gap--small gap--medium gap--large
h--full w--full

<!-- Typography -->
title title--small title--medium title--large title--xlarge
value value--small value--medium value--large value--xlarge value--xxlarge
label label--small label--inverted
description

<!-- Spacing -->
p--1 p--2 mb--xsmall mb--small mb--medium
h--5 h--6

<!-- Visual -->
bg--white bg--gray-50 bg--gray-75
rounded rounded--large
text--center text--left text--right
text-stroke text-stroke--large

<!-- Images -->
image image--contain image--cover image-dither

<!-- Responsive -->
sm: md: lg:
portrait: landscape:
1bit: 2bit: 4bit: 8bit:
```

### Common Liquid Patterns

```liquid
<!-- Conditional rendering -->
{% if variable %}...{% endif %}
{% unless variable %}...{% endunless %}
{% if variable %}...{% else %}...{% endif %}

<!-- Loops -->
{% for item in items %}...{% endfor %}

<!-- Filters -->
{{ text | truncate: 100 }}
{{ number | number_with_delimiter }}
{{ date | date: "%B %d, %Y" }}
{{ date | relative_time }}
{{ text | default: "fallback" }}

<!-- Reusable templates -->
{% template component_name %}...{% endtemplate %}
{% render "component_name", param: value %}

<!-- Comments -->
{% comment %}Your comment here{% endcomment %}
```

---

**Remember**: This is a living document. Update it as your plugin evolves and you discover new patterns or best practices.
