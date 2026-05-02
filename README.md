# WP Fix Fast Slider

A WordPress Gutenberg block that renders a full-width image slider with a Ken Burns pan-and-zoom effect. Slides are managed entirely inside the block editor. The frontend is rendered server-side by PHP; the editor shows a live client-side preview that updates instantly as you edit.

## Features

- **Ken Burns effect** — four alternating pan-and-zoom animations cycle across slides (toggle on/off); zoom and pan amount is configurable (5–30 %, default 15 %)
- **Fade In/Out effect** — pre-title, heading, description, and button animate in/out on slide transitions (toggle on/off)
- **Cross-fade transitions** — smooth opacity-based slide transitions with configurable duration (3–20 seconds per slide)
- **Navigation dots** — accessible dot navigation with hover and focus styles; hidden when only one slide is present
- **Hover pause** — auto-play pauses when the user hovers over the slider
- **Touch swipe** — swipe left or right on touch devices to navigate slides; short taps pass through to links normally
- **Keyboard navigation** — left/right arrow keys navigate slides from anywhere on the page; ignored when typing in a form field
- **Per-slide pre-title** — a small label line above the heading on each slide, with independent font-size and color controls
- **Per-slide link style** — choose between making the full slide clickable or showing a button; button label is configurable
- **Per-slide text styling** — optional color override, background color, and padding for the heading and description on each slide; accepts hex (including 8-digit hex with alpha) or `rgba()` values
- **Content position** — 9 positions (top/center/bottom × left/center/right)
- **Image focus** — top, center, or bottom image cropping anchor
- **Overlay gradient** — optional darkening gradient over the lower portion of the image (toggle on/off)
- **Text shadow** — optional shadow behind pre-title, heading, and description text (toggle on/off)
- **Heading tag** — choose H1–H6, paragraph, or span for the slide heading
- **Configurable font sizes** — separate S/M/L/XL presets (plus custom) for pre-title, heading, and description
- **Configurable colors** — separate color pickers for pre-title, heading, and description text
- **Constrain content width** — optionally limits slide content to the theme's wide width (falls back to 1200 px)
- **Responsive height** — set separate slider heights for desktop and mobile
- **Responsive text alignment** — text is always horizontally centered on mobile regardless of the desktop content position setting
- **Shortcode support** — embed the slider in Elementor, WPBakery, or any page builder via `[wpff_slider id="123"]` using a Synced Pattern
- **Performance** — first slide image loads eagerly with `fetchpriority="high"`; subsequent slides load lazily. `wp_get_attachment_image()` is used for full srcset/sizes support. Frontend script is deferred in `<head>` for early download without blocking rendering
- **Reduced motion** — Ken Burns and content animations are disabled for users who prefer reduced motion
- **Accessibility** — slider is a labelled carousel region; non-active slides are hidden from assistive technologies via `aria-hidden` and `inert`; dot buttons use `aria-pressed`; links that open in a new tab announce this to screen readers

## Development

The plugin ships minified assets (`*.min.js` / `*.min.css`). Source files are kept alongside them for editing. [Node.js](https://nodejs.org/) is required to rebuild.

**Install dependencies** (once):

```bash
npm install
```

**Watch mode** — rebuilds minified files automatically whenever a source file is saved:

```bash
npm run watch
```

**One-off build** — use before committing or releasing:

```bash
npm run build
```

The following source → output pairs are processed:

| Source                              | Output                                  |
| ----------------------------------- | --------------------------------------- |
| `assets/js/wpff-slider.js`          | `assets/js/wpff-slider.min.js`          |
| `blocks/wpff-slider/editor.js`      | `blocks/wpff-slider/editor.min.js`      |
| `assets/css/wpff-slider.css`        | `assets/css/wpff-slider.min.css`        |
| `assets/css/wpff-slider-editor.css` | `assets/css/wpff-slider-editor.min.css` |

## Requirements

|           |                                                      |
| --------- | ---------------------------------------------------- |
| WordPress | 6.0 or higher                                        |
| PHP       | 7.4 or higher                                        |
| Theme     | Works with any theme; FSE (block) themes recommended |

## Installation

1. Upload the `wpff-slider` folder to `/wp-content/plugins/`
2. Activate the plugin from **Plugins → Installed Plugins**
3. Insert the **WPFF Slider** block from the block inserter (Media category)

## Usage

1. Add the **WPFF Slider** block to any post or page
2. Click **Add First Slide** and select an image from the Media Library
3. Optionally add a heading, description, and link for each slide
4. Add more slides with the **Add Slide** button
5. Reorder or remove slides using the arrow and trash buttons on each slide card
6. Adjust appearance settings in the sidebar panels:
   - **Slider Settings** — aspect ratio, height, image focus, content position, heading tag, Ken Burns (with amount), Fade In/Out, text shadow, gradient, content width constraint, slide duration
   - **Text & Colors** — pre-title/heading/description font size and color
   - **Shortcode** — shows the `[wpff_slider]` shortcode when editing a Synced Pattern

## Using the Slider in Other Page Builders

To embed the slider in Elementor, WPBakery, or any other page builder:

1. Build the slider in the Gutenberg editor
2. Select the block and save it as a **Synced Pattern** via the block toolbar (⋮ menu → Create pattern → toggle Synced on)
3. Open the pattern from **Patterns** in the site editor — the **Shortcode** panel in the sidebar shows the ready-to-use shortcode
4. Paste the shortcode (e.g. `[wpff_slider id="42"]`) into any page builder text/shortcode widget

Changes made to the Synced Pattern are reflected everywhere the shortcode is used.

## Block Settings Reference

### Slider Settings panel

| Setting                   | Default             | Description                                                                        |
| ------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Sticky preview while editing | On              | Keeps the live preview pinned to the top of the editor while you scroll through slide cards. Session-only — resets to On on page reload |
| Pause auto-play while editing | Off            | Stops the slider from cycling through slides in the editor preview. Dot, swipe, and keyboard navigation still work but won't restart auto-play. Session-only — resets to Off on page reload |
| Aspect Ratio              | 16:6 (Standard)     | Six presets or a custom W/H ratio; leave empty to rely on min-height only          |
| Slider height             | `400px`             | Minimum height of the slider on desktop. Accepts `px`, `vh`, or `%`               |
| Slider height (Mobile)    | `450px`             | Override minimum height on screens ≤ 768 px                                       |
| Image Focus               | Center              | Where the image is anchored when cropped (Top / Center / Bottom)                  |
| Content Position          | Bottom Left         | Where the slide content appears — 9 positions (top/center/bottom × left/center/right) |
| Heading tag               | H2                  | HTML element used for the slide heading (H1–H6, paragraph, or span)               |
| Enable Ken Burns effect   | On                  | Toggles the pan-and-zoom animation                                                 |
| Ken Burns amount          | 15 %                | Controls zoom and pan intensity (5–30 %). Only shown when Ken Burns is enabled     |
| Enable Fade In/Out effect | On                  | Toggles the fade-up/fade-down animation on slide content                           |
| Enable text shadow        | On                  | Toggles a soft drop-shadow behind pre-title, heading, and description              |
| Enable overlay gradient   | On                  | Toggles a bottom-darkening gradient for text legibility                            |
| Constrain content width   | On                  | Limits slide content to the theme's wide width (falls back to 1200 px)            |
| Slide Duration            | 6 s                 | How long each slide is displayed before advancing                                  |

### Text & Colors panel

| Setting           | Default      | Description                                        |
| ----------------- | ------------ | -------------------------------------------------- |
| Pre-title size    | S (0.75 rem) | XS / S / M / L presets or a custom value           |
| Pre-title color   | White        | Color picker for the pre-title text                |
| Heading size      | L (2.5 rem)  | S / M / L / XL presets or a custom value           |
| Description size  | M (1 rem)    | S / M / L / XL presets or a custom value           |
| Heading color     | White        | Color picker for the slide heading                 |
| Description color | White        | Color picker for the slide description             |

### Per-slide fields

| Field           | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| Image           | Required. Select or replace from the Media Library                                   |
| Heading         | Optional slide title                                                                 |
| Description     | Optional body text. Supports multiple paragraphs                                     |
| Link URL        | Type a URL or search for a post or page by name                                      |
| Open in new tab | Shown only when a link URL is set                                                    |
| Link style      | **Full slide clickable** (default) or **Button** — shown only when a link URL is set |
| Button text     | Label for the button. Defaults to "Learn More" if left empty                         |

## How It Works

The block uses **server-side rendering** for the frontend. Block attributes are saved as JSON in the post content and passed to the PHP `render_callback` on every page load. This means:

- No JavaScript is required to render the initial HTML — the first slide is fully visible even with JS disabled
- Image markup is generated by `wp_get_attachment_image()`, giving browsers a full `srcset` and `sizes` for responsive loading

The **editor preview** is rendered entirely client-side in JavaScript (no REST API call). The JS preview mirrors the PHP output — same HTML structure, same CSS custom properties — and updates instantly as you edit without any network request. This avoids the URL-length limits that `ServerSideRender` hits when a slider has many slides with long image URLs.

The frontend JavaScript (`wpff-slider.js`) is responsible only for:

- Starting the Ken Burns CSS animation on the active slide
- Advancing slides on a timer
- Syncing the dot navigation indicator
- Handling dot clicks, hover pause, touch swipe, and keyboard arrow navigation
- Managing `aria-hidden` and `inert` attributes on non-active slides during transitions

### Image loading performance

The first slide image is given `loading="eager"`, `fetchpriority="high"`, and `decoding="sync"` so the browser prioritises it immediately — it is the largest contentful element on the page and should never be lazy-loaded. All subsequent slide images use `loading="lazy"`, `fetchpriority="auto"`, and `decoding="async"` so they are only fetched when needed, keeping the initial page load lean.

The frontend script is enqueued in `<head>` with the `defer` attribute, allowing the browser to discover and download it early while execution still waits until the DOM is ready.

## License

GPL-2.0-or-later
