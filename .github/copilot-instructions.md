# TRMNL Elements Plugin - Copilot Instructions

## Project Overview

This is a TRMNL plugin that displays the "Periodic Element of the Day" - showcasing a different chemical element each day with its properties, category, and scientific details. The plugin leverages the TRMNL Framework v2 to create responsive, adaptive layouts that work across all TRMNL devices.

## Project Structure

```
trmnl-elements-plugin/
├── .github/                      # GitHub configuration
│   └── copilot-instructions.md   # This file
├── api/                          # API endpoints
│   └── element-of-the-day.json   # Current element data
├── assets/                       # Design assets
│   └── icon/                     # Plugin icons
├── data/                         # Source data
│   ├── PubChemElements_all.csv   # Element data (CSV format)
│   └── PubChemElements_all.json  # Element data (JSON format)
├── docs/                         # Documentation
│   ├── NEW_RECIPE_GUIDE.md       # Guide for creating new recipes
│   └── PRD.md                    # Product requirements
├── scripts/                      # Build scripts
│   └── update-element-of-the-day.js  # Daily element update script
├── templates/                    # Liquid templates for layouts
│   ├── full.liquid               # Full-screen layout
│   ├── half_horizontal.liquid    # Half-size horizontal layout
│   ├── half_vertical.liquid      # Half-size vertical layout
│   └── quadrant.liquid           # Quarter-size layout
├── data.json                     # Element data for templates
├── index.html                    # Preview/testing page
└── settings.yml                  # Plugin settings configuration
```

## Key Files

- **templates/*.liquid**: Four layout templates that adapt to different display sizes and orientations
- **data/PubChemElements_all.json**: Contains all 118 elements with properties (atomic number, mass, symbol, name, category, state, density, electron configuration, year discovered)
- **scripts/update-element-of-the-day.js**: Node.js script that updates the daily element (runs via GitHub Actions)
- **data.json**: Current element data used by templates

## TRMNL Framework v2

### Device Specifications

| Device | Width | Height | Bit Depth | Display Type |
|--------|-------|--------|-----------|--------------|
| TRMNL OG | 800px | 480px | 1-bit | Monochrome (2 shades) |
| TRMNL OG V2 | 800px | 480px | 2-bit | Grayscale (4 shades) |
| TRMNL V2 | 1024px | 758px | 4-bit | Grayscale (16 shades) |
| Kindle 2024 | 600px | 800px | 4-bit | Grayscale (16 shades) |

### Responsive System

The framework uses a **mobile-first** approach with three responsive dimensions:

#### 1. Size-Based Breakpoints (Progressive)

- `sm:` - 600px+ (Kindle 2024)
- `md:` - 800px+ (TRMNL OG, OG V2)
- `lg:` - 1024px+ (TRMNL V2)

**Usage**: `md:value--large lg:value--xlarge` (applies at breakpoint and above)

#### 2. Bit-Depth Variants (Specific)

- `1bit:` - Monochrome (2 shades) - TRMNL OG
- `2bit:` - Grayscale (4 shades) - TRMNL OG V2
- `4bit:` - Grayscale (16 shades) - TRMNL V2, Kindle

**Usage**: `1bit:bg--black 2bit:bg--gray-45 4bit:bg--gray-75` (each targets only that bit-depth)

#### 3. Orientation-Based (Specific)

- `portrait:` - Portrait orientation only (landscape is default)

**Usage**: `flex--row portrait:flex--col`

#### 4. Combined Modifiers

Pattern: `size:orientation:bit-depth:utility`

Example: `md:portrait:4bit:flex--col` (medium+ screens, portrait, 4-bit display)

### Core Utilities

#### Layout

- **Flexbox**: `flex flex--row`, `flex--col`, `flex--center-y`, `flex--center-x`, `flex--between`, `gap--small`, `gap--medium`
- **Grid**: `grid grid--cols-2`, `grid--cols-3`, `gap--xsmall`
- **Sizing**: `w--40`, `w--52`, `min-w--40`, `h--36`
- **Spacing**: `p--2`, `mb--xsmall`, `mb--small`, `my--24`

#### Typography

- **Title**: `title title--small`, `title--large`, `title--xlarge` (for headings, names)
- **Value**: `value value--small`, `value--xlarge`, `value--xxlarge`, `value--xxxlarge` (for numbers, symbols)
- **Label**: `label label--small`, `label--inverted` (for categories, badges)
- **Description**: `description` (for body text)

#### Visual

- **Background**: `bg--white`, `bg--gray-50`
- **Border**: `outline`, `rounded`, `rounded--large`
- **Alignment**: `text--center`, `text--left`

#### Modulations

- **data-value-fit**: Automatically resizes text to fit container
  - `data-value-fit="true"` - Enable fitting
  - `data-value-fit-max-height="120"` - Set maximum height
- **data-clamp**: Truncate text to specific lines
  - `data-clamp="1"` - Show 1 line, truncate rest

## Layout System

### Four Layout Types

The plugin provides four layouts for different display configurations:

#### 1. Full Layout (`full.liquid`)

**Use Case**: Full-screen display (entire TRMNL screen)

**Key Features**:
- Responsive grid: 1 column (mobile) → 2 columns (md) → 3 columns (lg)
- Fixed card width: `w--52 min-w--52` for consistency
- Title with fit-value for long element names
- Category badge with `label--inverted`

**Layout Structure**:
```liquid
<div class="grid grid--cols-1 md:grid--cols-2 lg:grid--cols-3 gap--xsmall">
  <!-- Left: Element card with fixed width -->
  <div class="w--52 min-w--52">...</div>
  
  <!-- Right: Element details in grid -->
  <div class="grid grid--cols-2 gap--small">...</div>
</div>
```

**Critical Learnings**:
- Use `grid--cols-*` for precise column control (better than flex-wrap)
- Use `min-w--52` without `w--` to allow card to grow with long atomic masses (e.g., "259.10100")
- Combine `min-w--` with `gap--small` in flex rows to prevent content touching edges
- `data-value-fit` with `max-height` essential for long names (e.g., RUTHERFORDIUM - 13 chars)
- `title` element handles long single-word text better than `value` element

#### 2. Half Horizontal Layout (`half_horizontal.liquid`)

**Use Case**: Half-size horizontal display (abundant horizontal space, minimal vertical)

**Key Features**:
- Flex row layout with vertical centering: `flex--row flex--center-y`
- Responsive card widths: `w--40 md:w--44 lg:w--48`
- 2-column grid for details (maximizes horizontal space)
- Layout padding: `p--2`

**Layout Structure**:
```liquid
<div class="flex flex--row gap--medium portrait:flex--col p--2 flex--center-y">
  <!-- Left: Element card -->
  <div class="w--40 md:w--44 lg:w--48 min-w--40">...</div>
  
  <!-- Right: Element details (vertically centered) -->
  <div class="flex flex--col gap--xsmall">
    <div class="grid grid--cols-2 gap--xsmall">...</div>
  </div>
</div>
```

**Critical Learnings**:
- `flex--center-y` centers content vertically in row layouts
- **DO NOT** use `stretch` class on child containers - it conflicts with `flex--center-y`
- 2-column grid (`grid--cols-2`) better utilizes abundant horizontal space
- Responsive widths scale better across devices than fixed widths
- Remove redundant category from title (already shown in card badge)

#### 3. Half Vertical Layout (`half_vertical.liquid`)

**Use Case**: Half-size vertical display

**Key Features**:
- Title with data-value-fit for category display
- `label--inverted` for category badge
- Responsive minimum widths: `min-w--48`

**Critical Learnings**:
- Vertical layouts need more compact text sizing
- Category as main title works well for vertical orientation

#### 4. Quadrant Layout (`quadrant.liquid`)

**Use Case**: Quarter-size display (most compact)

**Key Features**:
- Minimal card width: `min-w--32`
- Smallest text sizes
- Most compact spacing

**Critical Learnings**:
- Smallest layout requires aggressive space optimization
- May need special handling for very long element names

## Design Patterns & Best Practices

### 1. Element Card Structure

Standard pattern across all layouts:

```liquid
<div class="outline rounded p--2 bg--white">
  <!-- Top: Atomic number (left) and Atomic mass (right) -->
  <div class="flex flex--row flex--between mb--xsmall">
    <div class="value value--small value--tnums">{{ element.atomic_number }}</div>
    <div class="value value--xsmall value--tnums" data-value-fit="true">{{ element.atomic_mass }}</div>
  </div>
  
  <!-- Center: Symbol (large) -->
  <div class="text--center mb--xsmall">
    <div class="value value--xlarge">{{ element.symbol }}</div>
  </div>
  
  <!-- Bottom: Name and category -->
  <div class="text--center">
    <div class="title title--small mb--xsmall">{{ element.name }}</div>
    <div class="label label--small label--inverted">{{ element.category }}</div>
  </div>
</div>
```

**Key Points**:
- `value--tnums` for tabular numbers (consistent spacing)
- `data-value-fit="true"` on atomic mass prevents cutoff (up to 9 chars)
- `label--inverted` for category badge (consistent across all layouts)

### 2. Long Text Handling

For element names that may be very long (e.g., "RUTHERFORDIUM" - 13 characters):

```liquid
<div class="title title--large md:title--xlarge" 
     data-value-fit="true" 
     data-value-fit-max-height="120">
  {{ element.name | upcase }}
</div>
```

**Why**:
- `title` element handles long single-word text better than `value`
- `data-value-fit` automatically resizes text to fit container
- `max-height` constraint prevents text from growing too large

### 3. Responsive Width Strategy

**Fixed widths** (for consistency):
- Use when content varies (short vs long names)
- Example: `w--52 min-w--52` in full layout
- Prevents card from shrinking with short names (e.g., Lithium)
- **WARNING**: Fixed widths (`w--52`) prevent horizontal growth - content may get cut off

**Responsive widths** (for flexibility):
- Use when adapting to different screen sizes
- Example: `w--40 md:w--44 lg:w--48` in half_horizontal
- Better space utilization across devices

**Minimum widths** (for safety):
- Always set `min-w--*` to prevent content cutoff
- Critical for atomic numbers (3-4 chars) and masses (up to 9 chars)
- **BEST PRACTICE**: Use `min-w--52` without `w--` to allow horizontal growth
- Example: Element 102's atomic mass "259.10100" (9 chars) needs room to expand

**Key Insight - Fixed vs Minimum Width**:
- `w--52 min-w--52` = **Fixed width** - Card cannot grow, content may overflow
- `min-w--52` (no `w--`) = **Minimum width** - Card can grow horizontally as needed
- Use minimum-only when content length varies significantly (atomic masses: 4-9 chars)
- Combine with `gap--small` in flex containers for proper spacing between items

### 4. Grid vs Flexbox

**Use Grid when**:
- Need precise column control (e.g., 2 or 3 columns)
- Creating responsive multi-column layouts
- Example: `grid grid--cols-1 md:grid--cols-2 lg:grid--cols-3`

**Use Flexbox when**:
- Creating single-direction flows
- Need vertical/horizontal centering
- Example: `flex flex--row flex--center-y`

### 5. Vertical Alignment

For vertically centering content in horizontal layouts:

```liquid
<div class="flex flex--row flex--center-y">
  <div>Card</div>
  <div class="flex flex--col">Details</div>
</div>
```

**Critical**: Do NOT use `stretch` class on child containers - it conflicts with `flex--center-y` by forcing containers to fill vertical space.

### 6. Spacing Hierarchy

- `gap--xsmall` - Minimal spacing (within grids)
- `gap--small` - Small spacing (between related items)
- `gap--medium` - Medium spacing (between major sections)
- `p--2` - Standard padding for layout containers
- `mb--xsmall`, `mb--small` - Bottom margins for vertical stacking

## Common Issues & Solutions

### Issue 1: Atomic Mass Cutoff

**Problem**: Long atomic masses (e.g., "259.10100" - 9 chars) get cut off

**Solution**:
- Use `min-w--52` without `w--` to allow card to grow horizontally
- Add `gap--small` to flex row with `flex--between` for proper spacing
- Remove fixed width constraints that prevent horizontal growth

### Issue 2: Long Element Names Breaking Layout

**Problem**: Single-word names like "RUTHERFORDIUM" push layout

**Solution**:
- Use `title` element instead of `value`
- Add `data-value-fit="true"` with `data-value-fit-max-height`
- Wrap in constrained width container

### Issue 3: Inconsistent Card Widths

**Problem**: Cards too narrow with short names (e.g., "Lithium")

**Solution**:
- Use fixed widths: `w--52 min-w--52`
- Prevents card from shrinking below minimum

### Issue 4: Vertical Alignment Not Working

**Problem**: `flex--center-y` not centering content

**Solution**:
- Remove `stretch` class from child containers
- `stretch` forces `align-self: stretch`, overriding parent's `align-items: center`

### Issue 5: Wasted Horizontal Space

**Problem**: Single-column layouts waste space on wide screens

**Solution**:
- Use responsive grid: `grid--cols-1 md:grid--cols-2 lg:grid--cols-3`
- Or 2-column grid for details: `grid--cols-2`

## Testing Strategy

### Test Elements

Critical elements to test (cover edge cases):

- **Element 3 (Lithium)**: Short name, tests minimum widths
- **Element 99 (Einsteinium)**: Long atomic mass (252.0830 - 8 chars)
- **Element 104 (Rutherfordium)**: Long name (13 chars), large atomic number (104)
- **Elements 100-102**: Longest atomic masses (257.09511, 258.09843, 259.10100 - 9 chars)

### Testing Override

Use `templates/shared.liquid` for testing specific elements:

```liquid
{% comment %}
Uncomment to test specific elements:
{% assign element_index = 99 %}  {# Einsteinium - long atomic mass #}
{% assign element_index = 104 %} {# Rutherfordium - long name #}
{% assign element_index = 3 %}   {# Lithium - short name #}
{% endcomment %}
```

### Device Testing

Test across all responsive breakpoints:
- Small (600px+): Kindle 2024
- Medium (800px+): TRMNL OG, OG V2
- Large (1024px+): TRMNL V2

## Code Style Guidelines

1. **Use semantic class names**: `title`, `value`, `label`, `description`
2. **Follow mobile-first responsive**: Base styles first, then `md:`, then `lg:`
3. **Combine modifiers in order**: `size:orientation:bit-depth:utility`
4. **Always set minimum widths**: Prevent content cutoff
5. **Use data-value-fit for dynamic content**: Automatically handle long text
6. **Prefer grid for multi-column**: More predictable than flex-wrap
7. **Add layout padding**: `p--2` for breathing room
8. **Use gap utilities**: Better than margins for consistent spacing
9. **Test with edge cases**: Long names, long numbers, short names

## Element Data Structure

```json
{
  "atomic_number": "3",
  "symbol": "Li",
  "name": "Lithium",
  "atomic_mass": "6.9410",
  "cpk_hex_color": "CC80FF",
  "electron_configuration": "[He]2s1",
  "electronegativity": "0.98",
  "atomic_radius": "167",
  "ionization_energy": "5.3917",
  "electron_affinity": "59.6326",
  "oxidation_states": "1",
  "standard_state": "Solid",
  "bonding_type": "Metallic",
  "melting_point": "453.65",
  "boiling_point": "1603",
  "density": "0.534",
  "group_block": "Alkali metal",
  "year_discovered": "1817",
  "category": "Alkali metal"
}
```

## Workflow

1. **Daily Update**: GitHub Action runs `scripts/update-element-of-the-day.js`
2. **Element Selection**: Rotates through elements based on day of year
3. **Template Rendering**: TRMNL renders appropriate layout template
4. **Responsive Adaptation**: Framework applies device-specific styles
5. **Display**: Element appears on TRMNL device with optimized layout

## Future Considerations

- Support for additional TRMNL devices as they're released
- Enhanced bit-depth specific styling (currently minimal)
- Portrait orientation optimizations (currently using `portrait:flex--col`)
- Animation/transition effects if framework adds support
- Interactive elements if TRMNL adds touch support
