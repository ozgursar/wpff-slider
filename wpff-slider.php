<?php
/**
 * Plugin Name: WP Fix Fast Slider
 * Description: Full-width image slider block with Ken Burns pan-and-zoom effect, configurable slide duration, content positioning, text shadow, overlay gradient, and per-slide heading, description, and link controls.
 * Version:     1.0.0
 * Author:      WP Fix Fast
 * Author URI:  https://wpfixfast.com/
 * Plugin URI:  https://wpfixfast.com/
 * Text Domain: wpff-slider
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

define( 'WPFF_SLIDER_VERSION', '1.0.2' );
define( 'WPFF_SLIDER_FILE', __FILE__ );
define( 'WPFF_SLIDER_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPFF_SLIDER_URL', plugin_dir_url( __FILE__ ) );

require_once WPFF_SLIDER_DIR . 'includes/class-wpff-slider.php';

add_action( 'plugins_loaded', array( 'WPFF_Slider', 'get_instance' ) );
