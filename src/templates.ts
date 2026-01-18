/**
 * Template Definitions
 * Templates are inlined as strings for Cloudflare Workers bundling
 * Source files are in /templates/*.liquid
 */

export const TEMPLATES = {
  full: `<div class="layout p--2">
  {% if photo.photo_url and photo.photo_url != '' %}
  <div class="flex flex--col gap--small h--full">
    <!-- Photo Display Area -->
    <div class="flex flex--center-x flex--center-y" style="flex: 1;">
      <img src="{{ photo.photo_url }}" 
           alt="{{ photo.caption }}" 
           class="image image--contain"
           style="max-width: 100%; max-height: 90%; object-fit: contain;">
    </div>
    
    <!-- Caption (if available) -->
    {% if photo.caption %}
    <div class="text--center mb--small">
      <span class="description" data-clamp="2">{{ photo.caption }}</span>
    </div>
    {% endif %}
  </div>
  {% else %}
  <!-- No Photo Available -->
  <div class="flex flex--col flex--center-x flex--center-y gap--medium h--full">
    <div class="value value--large text--center">📷</div>
    <div class="title title--medium text--center">No Photos Available</div>
    <div class="description text--center">
      Please configure your Google Photos shared album URL in the plugin settings.
    </div>
  </div>
  {% endif %}
</div>

<div class="title_bar">
  <span class="title">{{ trmnl.plugin_settings.instance_name }}</span>
  {% if photo.photo_count > 0 %}
  <span class="description">{{ photo.photo_count }} photos</span>
  {% endif %}
</div>`,

  half_horizontal: `<div class="layout p--2">
  {% if photo.photo_url and photo.photo_url != '' %}
  <div class="flex flex--row gap--medium portrait:flex--col flex--center-y h--full">
    <!-- Photo Display -->
    <div class="flex flex--center-x flex--center-y" style="flex: 1;">
      <img src="{{ photo.photo_url }}" 
           alt="{{ photo.caption }}" 
           class="image image--contain"
           style="max-width: 100%; max-height: 100%; object-fit: contain;">
    </div>
    
    <!-- Caption (if available) -->
    {% if photo.caption %}
    <div class="flex flex--col gap--xsmall" style="max-width: 200px;">
      <span class="description" data-clamp="4">{{ photo.caption }}</span>
      {% if photo.photo_count > 0 %}
      <span class="label label--small">{{ photo.photo_count }} photos in album</span>
      {% endif %}
    </div>
    {% endif %}
  </div>
  {% else %}
  <!-- No Photo Available -->
  <div class="flex flex--col flex--center-x flex--center-y gap--small h--full">
    <div class="value value--medium">📷</div>
    <div class="title title--small text--center">No Photos</div>
    <div class="description text--center" style="max-width: 300px;">
      Configure your shared album URL in settings
    </div>
  </div>
  {% endif %}
</div>

<div class="title_bar">
  <span class="title">{{ trmnl.plugin_settings.instance_name }}</span>
</div>`,

  half_vertical: `<div class="layout p--2">
  {% if photo.photo_url and photo.photo_url != '' %}
  <div class="flex flex--col gap--small h--full">
    <!-- Photo Display Area -->
    <div class="flex flex--center-x flex--center-y" style="flex: 1;">
      <img src="{{ photo.photo_url }}" 
           alt="{{ photo.caption }}" 
           class="image image--contain"
           style="max-width: 100%; max-height: 85%; object-fit: contain;">
    </div>
    
    <!-- Caption (if available) -->
    {% if photo.caption %}
    <div class="text--center">
      <span class="description" data-clamp="2">{{ photo.caption }}</span>
    </div>
    {% endif %}
  </div>
  {% else %}
  <!-- No Photo Available -->
  <div class="flex flex--col flex--center-x flex--center-y gap--small h--full">
    <div class="value value--medium">📷</div>
    <div class="title title--small text--center">No Photos</div>
    <div class="description text--center" style="max-width: 200px; font-size: 0.8em;">
      Configure album in settings
    </div>
  </div>
  {% endif %}
</div>

<div class="title_bar">
  <span class="title">{{ trmnl.plugin_settings.instance_name }}</span>
</div>`,

  quadrant: `<div class="layout p--1">
  {% if photo.photo_url and photo.photo_url != '' %}
  <div class="flex flex--col gap--xsmall h--full">
    <!-- Photo Display Area (most of the space) -->
    <div class="flex flex--center-x flex--center-y" style="flex: 1;">
      <img src="{{ photo.photo_url }}" 
           alt="{{ photo.caption }}" 
           class="image image--contain"
           style="max-width: 100%; max-height: 100%; object-fit: contain;">
    </div>
  </div>
  {% else %}
  <!-- No Photo Available -->
  <div class="flex flex--col flex--center-x flex--center-y gap--xsmall h--full">
    <div class="value value--small">📷</div>
    <div class="description text--center" style="font-size: 0.7em;">No Photos</div>
  </div>
  {% endif %}
</div>

<div class="title_bar">
  <span class="title title--small">{{ trmnl.plugin_settings.instance_name }}</span>
</div>`,
} as const;

export type TemplateKey = keyof typeof TEMPLATES;
