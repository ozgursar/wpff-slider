# WP Fix Fast Slider

A WordPress Gutenberg block that renders a full-width image slider with a Ken Burns pan-and-zoom effect. Slides are managed entirely inside the block editor and rendered server-side, so the output is always identical in the editor preview and on the frontend.

## Features

- **Ken Burns effect** — four alternating pan-and-zoom animations cycle across slides
- **Cross-fade transitions** — smooth opacity-based slide transitions with configurable duration (3–20 seconds per slide)
- **Navigation dots** — accessible dot navigation with hover and focus styles; hidden when only one slide is present
- **Hover pause** — auto-play pauses when the user hovers over the slider
- **Per-slide controls** — each slide has its own image, heading, description, link URL, and "open in new tab" option
- **Content position** — 9 positions (top/center/bottom × left/center/right)
- **Image focus** — top, center, or bottom image cropping anchor
- **Overlay gradient** — optional darkening gradient over the lower portion of the image (toggle on/off)
- **Text shadow** — optional shadow behind heading and description text (toggle on/off)
- **Heading tag** — choose H1–H6, paragraph, or span for the slide heading
- **Configurable font sizes** — separate S/M/L/XL presets (plus custom) for heading and description
- **Configurable colors** — separate color pickers for heading and description text
- **Responsive height** — set separate slider heights for desktop and mobile
- **Responsive text alignment** — text is always horizontally centered on mobile regardless of the desktop content position setting
- **Performance** — first slide image loads eagerly with `fetchpriority="high"`; subsequent slides load lazily. `wp_get_attachment_image()` is used for full srcset/sizes support
- **Reduced motion** — Ken Burns animations are disabled for users who prefer reduced motion
- **Accessibility** — slide links use `aria-labelledby` or `aria-label`; dot buttons have `aria-current` and `aria-label`

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
3. Optionally add a heading, description, and link URL for each slide
4. Add more slides with the **Add Slide** button
5. Reorder or remove slides using the arrow and trash buttons on each slide card
6. Adjust appearance settings in the sidebar panels:
   - **Slider Settings** — height, image focus, content position, heading tag, Ken Burns, text shadow, gradient, slide duration
   - **Text & Colors** — heading size, description size, heading color, description color

## Block Settings Reference

### Slider Settings panel

| Setting                 | Default             | Description                                                      |
| ----------------------- | ------------------- | ---------------------------------------------------------------- |
| Slider height           | `600px`             | Height of the slider on desktop. Accepts `px`, `vh`, or `%`      |
| Slider height (Mobile)  | _(same as desktop)_ | Override height on screens ≤ 768 px                              |
| Image Focus             | Center              | Where the image is anchored when cropped (Top / Center / Bottom) |
| Content Position        | Bottom Center       | Where the heading and description appear on the slide            |
| Heading tag             | H2                  | HTML element used for the slide heading                          |
| Enable Ken Burns effect | On                  | Toggles the pan-and-zoom animation                               |
| Enable text shadow      | On                  | Toggles a soft drop-shadow behind heading and description        |
| Enable overlay gradient | On                  | Toggles a bottom-darkening gradient for text legibility          |
| Slide Duration          | 6 s                 | How long each slide is displayed before advancing                |

### Text & Colors panel

| Setting           | Default     | Description                              |
| ----------------- | ----------- | ---------------------------------------- |
| Heading size      | L (2.5 rem) | S / M / L / XL presets or a custom value |
| Description size  | M (1 rem)   | S / M / L / XL presets or a custom value |
| Heading color     | White       | Color picker for the slide heading       |
| Description color | White       | Color picker for the slide description   |

### Per-slide fields

| Field           | Description                                        |
| --------------- | -------------------------------------------------- |
| Image           | Required. Select or replace from the Media Library |
| Heading         | Optional slide title                               |
| Description     | Optional body text. Supports multiple paragraphs   |
| Link URL        | Makes the entire slide a clickable link            |
| Open in new tab | Shown only when a link URL is set                  |

## How It Works

The block is **server-side rendered**. Block attributes are saved as JSON in the post content and passed to the PHP `render_callback` on every page load. This means:

- No JavaScript is required to render the initial HTML
- The editor preview (via `ServerSideRender`) is pixel-identical to the frontend
- Image markup is generated by `wp_get_attachment_image()`, giving browsers a full `srcset` and `sizes` for responsive loading

The frontend JavaScript (`wpff-slider.js`) is responsible only for:

- Starting the Ken Burns CSS animation on the active slide
- Advancing slides on a timer
- Syncing the dot navigation indicator
- Handling dot clicks and hover-pause

### Image loading performance

The first slide image is given `loading="eager"`, `fetchpriority="high"`, and `decoding="sync"` so the browser prioritises it immediately — it is the largest contentful element on the page and should never be lazy-loaded. All subsequent slide images use `loading="lazy"`, `fetchpriority="auto"`, and `decoding="async"` so they are only fetched when needed, keeping the initial page load lean.

## License

GPL-2.0-or-later
