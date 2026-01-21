# Generic Copilot Instructions Template - Usage Guide

This repository contains a **generic `copilot-instructions.md` template** that can be used as a starting point for any TRMNL plugin project.

## What is this template?

The `copilot-instructions.md` file is a comprehensive guide for AI assistants (like GitHub Copilot) working on TRMNL plugin projects. It provides:

- ✅ Complete TRMNL Framework v2 documentation
- ✅ Device specifications and responsive breakpoints
- ✅ Common design patterns and best practices
- ✅ Layout system guidelines (full, half, quadrant)
- ✅ Error handling patterns
- ✅ Testing strategies
- ✅ Code style guidelines
- ✅ Quick reference for framework classes and Liquid patterns

## How to use this template

### Step 1: Copy the template

Copy `copilot-instructions.md` to your new TRMNL plugin project:

```bash
# From this repository
cp copilot-instructions.md /path/to/your/plugin/.github/copilot-instructions.md
```

Or download it directly from GitHub:
```bash
curl -o .github/copilot-instructions.md https://raw.githubusercontent.com/hossain-khan/trmnl-google-photos-plugin/main/copilot-instructions.md
```

### Step 2: Customize the header

Replace the placeholder information at the top of the file:

```markdown
> **Repository**: [your-username/your-repo-name] → [yourusername/your-actual-repo]
> **Author**: Your Name → Your Actual Name
> **Last Updated**: [Current Date] → January 2026 (or current date)
```

### Step 3: Add project overview

Fill in the Project Overview section with details about your plugin:

- What does your plugin do?
- What are its key goals?
- What's the current status (what's complete, in progress, planned)?

### Step 4: Update project structure

Modify the project structure tree to match your actual directory layout. Keep sections that apply, remove those that don't.

### Step 5: Customize data structure

Update the "Data Structure" section to reflect your plugin's data sources and variables:

- If using polling: document your JSON response structure
- If using webhooks: document your webhook payload
- If using static data: document your data organization
- List all template variables available in your layouts

### Step 6: Document your workflow

Replace the example workflow with your actual plugin workflow:

- How does data flow from source to display?
- What are the key steps in the process?
- What are the timing/refresh characteristics?

### Step 7: Update technical stack

List your plugin's actual technical stack:

- Backend technology (Cloudflare Workers, Node.js, Python, etc.)
- Framework (if applicable)
- Programming language
- Caching strategy
- Deployment platform

### Step 8: Add project-specific patterns

If your plugin has unique patterns not covered in the template:

1. Add new sections for project-specific design patterns
2. Document custom utilities or helper functions
3. Add examples of complex template logic
4. Document any workarounds or special considerations

### Step 9: Remove unused sections

Delete sections that don't apply to your project:

- If you don't have a backend, remove backend-related sections
- If you only use one layout, simplify the layout system section
- If you don't have custom form fields, remove that documentation

### Step 10: Keep it updated

As your plugin evolves:

- Update the "Current Status" section
- Add new patterns you discover
- Document new features and their implementation
- Keep the Quick Reference section current

## What should you keep?

**Always keep these core sections:**

1. **TRMNL Framework v2** - Device specs and responsive system
2. **Core Utilities** - Framework classes and their usage
3. **Layout System** - Standard layout types and patterns
4. **Design Patterns & Best Practices** - Reusable patterns
5. **Testing Strategy** - How to test your plugin
6. **Quick Reference** - Common framework classes and Liquid patterns

These sections are universally applicable to all TRMNL plugins.

## What should you customize?

**Customize these sections for your project:**

1. **Project Overview** - Your plugin's purpose and goals
2. **Project Structure** - Your actual directory layout
3. **Data Structure** - Your plugin's data sources and variables
4. **Workflow** - Your plugin's specific data flow
5. **Technical Stack** - Your actual tech stack
6. **Future Considerations** - Your plugin's roadmap

## Tips for success

### For simple plugins

If your plugin is simple (static content, minimal logic):

- Keep the template lean - remove complex sections
- Focus on layout patterns and responsive design
- Document your data structure clearly
- Provide good examples

### For complex plugins

If your plugin is complex (API integrations, multiple data sources):

- Expand sections with project-specific details
- Add architecture diagrams or flowcharts (link to them)
- Document error handling thoroughly
- Add troubleshooting sections

### For team collaboration

If multiple developers will work on your plugin:

- Be thorough in documentation
- Add code examples for common tasks
- Document conventions and decisions
- Keep the Quick Reference section comprehensive

## Example customizations

### Example 1: Weather plugin

For a weather plugin, you might:

- Add a "Weather Data Format" section documenting API responses
- Add "Icon Mapping" section showing weather condition to icon mappings
- Document temperature unit conversions
- Add location handling patterns

### Example 2: Calendar plugin

For a calendar plugin, you might:

- Add "Event Parsing" section documenting how events are processed
- Add "Time Zone Handling" patterns
- Document recurring event logic
- Add date formatting examples

### Example 3: Todo list plugin

For a todo list plugin, you might:

- Add "Task Status Logic" section
- Document checkbox/completion state handling
- Add priority display patterns
- Document filtering and sorting logic

## Getting help

If you need help using this template:

1. Review the existing `copilot-instructions.md` file for examples
2. Check the [TRMNL Framework documentation](https://usetrmnl.com/framework)
3. Review [TRMNL Plugin Guides](https://help.usetrmnl.com/en/collections/7820559-plugin-guides)
4. Look at other TRMNL plugin repositories for inspiration
5. Open an issue in this repository if you have questions

## Contributing improvements

If you discover better patterns or have suggestions for the template:

1. Open an issue describing your improvement
2. Submit a pull request with your changes
3. Explain why the change benefits all TRMNL plugin developers

## License

This template is provided under the MIT License - see [LICENSE](LICENSE) for details.

---

**Remember**: This template is a starting point. Customize it to fit your project's needs and keep it updated as your plugin evolves.
