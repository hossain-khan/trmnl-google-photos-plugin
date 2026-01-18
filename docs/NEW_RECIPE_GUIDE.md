# Creating a New TRMNL Recipe Project

This guide walks you through creating a new TRMNL recipe project from scratch, based on the proven structure of the Max Payne Quotes plugin.

## Prerequisites

- GitHub account
- TRMNL account with Developer Edition (for testing)
- Basic knowledge of HTML, JSON, and Liquid templates
- Git installed locally

## Quick Start

### Step 1: Create Repository Structure

```bash
# Create new repository
mkdir trmnl-your-recipe-name
cd trmnl-your-recipe-name
git init

# Create directory structure
mkdir -p .github/workflows
mkdir -p api
mkdir -p assets/{icon,demo,raw}
mkdir -p docs
mkdir -p templates

# Create initial files
touch README.md
touch LICENSE
touch settings.yml
touch index.html
touch data.json
touch .gitignore
```

### Step 2: Create .gitignore

```bash
cat > .gitignore << 'EOF'
.DS_Store
*.pyc
__pycache__/
venv/
.env
*.swp
*.swo
*~
.vscode/
.idea/
EOF
```

### Step 3: Create Core Files

#### `settings.yml` - TRMNL Plugin Configuration

```yaml
uuid: YOUR_PLUGIN_UUID  # TRMNL will generate this
name: Your Recipe Name
author: Your Name
author_email: your.email@example.com
homepage: https://github.com/yourusername/trmnl-your-recipe-name
description: Brief description of your recipe
markup_version: 1
strategy: merge_tag
refresh_frequency: 86400  # 24 hours in seconds

merge_tag:
  - tag_name: data
    # GitHub Pages URL for your data endpoint
    source: https://yourusername.github.io/trmnl-your-recipe-name/api/data.json
    merge_object: false

private_variables:
  - name: title
    type: string
    value: Your Recipe Title

layouts:
  - name: full
    label: Full Screen
    filename: full.liquid
  - name: half_horizontal
    label: Half Horizontal
    filename: half_horizontal.liquid
  - name: half_vertical
    label: Half Vertical
    filename: half_vertical.liquid
  - name: quadrant
    label: Quadrant
    filename: quadrant.liquid
```

#### `data.json` - Your Data Source

```json
{
  "title": "Example Title",
  "content": "Your content here",
  "metadata": {
    "updated": "2026-01-17T00:00:00Z"
  }
}
```

#### `api/data.json` - Public API Endpoint

Copy your data structure here. This file will be served via GitHub Pages.

```json
{
  "title": "Example Title",
  "content": "Your content here"
}
```

### Step 4: Create Templates

Create at least one layout template. Use this as a starting template:

#### `templates/full.liquid`

```liquid
<div class="layout">
  <div class="grid">
    <div class="col col--center text--black">
      <span class="value value--xxxlarge" 
            style="font-family: 'Courier New', monospace; font-weight: bold; word-wrap: break-word; overflow-wrap: break-word;" 
            data-value-fit="true" 
            data-value-fit-max-height="280">
        {{ data.content }}
      </span>
      <span class="description" style="font-family: 'Courier New', monospace;">
        {{ data.title }}
      </span>
    </div>
  </div>
</div>

<div class="title_bar">
  <span class="title">{{ trmnl.plugin_settings.instance_name }}</span>
</div>
```

**Key Points:**
- Use `{{ data.your_field }}` to access your data
- Use `data-value-fit="true"` for dynamic text sizing
- Use `word-wrap: break-word; overflow-wrap: break-word;` for proper text wrapping
- Avoid `data-pixel-perfect="true"` (causes wrapping issues)
- Use `<span>` instead of `<p>` for inline text flow

### Step 5: Create README.md

```markdown
# Your Recipe Name
<img src="assets/icon/your-icon.png" align="right" alt="Icon" width="120"/>

Brief tagline describing your recipe.

> Optional inspirational quote or example

## Install

**[→ Install Recipe Name](https://usetrmnl.com/recipes)**

1. Visit [TRMNL Plugins](https://usetrmnl.com/plugins)
2. Search for "**Your Recipe Name**"
3. Click **Install**
4. Add to your [Playlist](https://usetrmnl.com/playlists)

## Demo

| Layout | Preview |
|--------|---------|
| **Full** | <img src="assets/demo/demo-full.png" alt="Full Layout" width="400"/> |

## Features

- Feature 1
- Feature 2
- Feature 3

---

**For Developers:** Want to fork or customize? See [docs/SETUP.md](docs/SETUP.md)

**License:** See [LICENSE](LICENSE)
```

### Step 6: Create GitHub Actions for Automation

#### `.github/workflows/pages.yml` - Deploy to GitHub Pages

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### `.github/workflows/update-data.yml` - Daily Data Updates (Optional)

```yaml
name: Update Data

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Update data
        run: |
          # Your data update script here
          # Example: python update_data.py
          cp data.json api/data.json
      
      - name: Commit changes
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add api/data.json
          git diff --quiet && git diff --staged --quiet || (git commit -m "chore: update data" && git push)
```

### Step 7: GitHub Setup

1. **Create GitHub Repository**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin git@github.com:yourusername/trmnl-your-recipe-name.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: **GitHub Actions**
   - Wait for deployment to complete

3. **Verify Data Endpoint**
   - Visit: `https://yourusername.github.io/trmnl-your-recipe-name/api/data.json`
   - Should return your JSON data

### Step 8: Update settings.yml with GitHub Pages URL

```yaml
merge_tag:
  - tag_name: data
    # Update with your actual GitHub Pages URL
    source: https://yourusername.github.io/trmnl-your-recipe-name/api/data.json
    merge_object: false
```

### Step 9: Test in TRMNL

1. **Create Private Plugin**
   - Go to [TRMNL Dashboard](https://usetrmnl.com/plugins)
   - Click "New Private Plugin"
   - Copy/paste your `settings.yml` content
   - Copy/paste your template(s) content

2. **Test Each Layout**
   - Add plugin to a playlist
   - View on your TRMNL device or simulator
   - Verify text wrapping, sizing, and data display

3. **Iterate and Refine**
   - Adjust templates as needed
   - Test with different data lengths
   - Ensure all layouts work properly

### Step 10: Publish as Recipe

1. **Polish Your Plugin**
   - Create demo screenshots
   - Add icon to `assets/icon/`
   - Update README with demos
   - Write clear documentation

2. **Publish to TRMNL**
   - Go to your Private Plugin settings
   - Click the publish icon next to "Publish plugin?"
   - Choose **Public** or **Unlisted**
   - Submit for review

3. **Share Your Recipe**
   - TRMNL team reviews (usually quick)
   - Recipe appears at `https://usetrmnl.com/recipes`
   - Share with the community!

## Additional Tips

### TRMNL Framework Classes

Common utility classes for layouts:

```
Layout Structure:
- .layout                    # Main container
- .grid                      # Grid container
- .col, .col--span-1/2/3    # Columns
- .row                       # Row container

Text Alignment:
- .col--center               # Center content
- .text--center              # Center text
- .text--black               # Black text

Text Sizing:
- .value                     # Base value class
- .value--small              # Small text
- .value--medium             # Medium text
- .value--large              # Large text
- .value--xlarge             # Extra large
- .value--xxlarge            # 2X large
- .value--xxxlarge           # 3X large

- .description               # Smaller description text
- .title                     # Title text

Spacing:
- .gap--small                # Small gap
- .gap--medium               # Medium gap
- .gap--large                # Large gap

Images:
- .image                     # Base image
- .image--contain            # Contain sizing
```

### Data Access in Templates

```liquid
# Access merge_tag data
{{ data.field_name }}

# Access private variables
{{ trmnl.plugin_settings.your_variable }}

# Built-in variables
{{ trmnl.plugin_settings.instance_name }}
{{ trmnl.screen.width }}
{{ trmnl.screen.height }}
```

### Dynamic Text Sizing

```html
<span class="value value--xxxlarge" 
      data-value-fit="true" 
      data-value-fit-max-height="280">
  {{ text }}
</span>
```

### Inline Quote Marks or Icons

To keep icons inline with text (not on separate lines):

```html
<span class="value"><img src="icon.svg" style="vertical-align: top;">{{ text }}<img src="icon.svg" style="vertical-align: top;"></span>
```

## Common Issues & Solutions

### Issue: Text wrapping looks weird
**Solution:** Remove `data-pixel-perfect="true"` and use `word-wrap: break-word; overflow-wrap: break-word;`

### Issue: Quote marks appear on separate lines
**Solution:** Put images inside the span with text, not as siblings

### Issue: Extra spacing around elements
**Solution:** Remove spaces around Liquid variables: `{{text}}` not `{{ text }}`

### Issue: Data not updating
**Solution:** Check GitHub Actions logs, verify GitHub Pages is enabled, check data endpoint URL

### Issue: Template not rendering
**Solution:** Verify `settings.yml` syntax, check template filename matches layout configuration

## Resources

- [TRMNL Framework Documentation](https://usetrmnl.com/framework)
- [Plugin Recipes Guide](https://help.usetrmnl.com/en/articles/10122094-plugin-recipes)
- [TRMNL Community Plugins](https://github.com/usetrmnl/plugins)
- [Liquid Template Language](https://shopify.github.io/liquid/)

## Example Projects

- [Max Payne Quotes](https://github.com/hossain-khan/trmnl-max-payne-quotes-plugin) - Full example with all layouts
- [TRMNL Plugins Repository](https://github.com/usetrmnl/plugins) - Community plugins

## Next Steps

1. Clone this structure for your new recipe idea
2. Replace data and templates with your content
3. Test thoroughly on TRMNL device
4. Polish and publish as recipe
5. Share with the community!

---

**Questions?** Check the [TRMNL Help Center](https://help.usetrmnl.com/) or [Community Forum](https://community.usetrmnl.com/)
