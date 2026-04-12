<?php
defined( 'ABSPATH' ) || exit;

/**
 * Main plugin class — singleton.
 */
class WPFF_Slider {

	/** @var self|null */
	private static $instance = null;

	// -------------------------------------------------------------------------
	// Boot
	// -------------------------------------------------------------------------

	public static function get_instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->register_hooks();
	}

	// -------------------------------------------------------------------------
	// Hooks
	// -------------------------------------------------------------------------

	private function register_hooks(): void {
		add_action( 'init', array( $this, 'register_block' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_assets' ) );
	}

	// -------------------------------------------------------------------------
	// Block registration
	// -------------------------------------------------------------------------

	public function register_block(): void {
		register_block_type(
			'wpff-slider/slider',
			array(
				'render_callback' => array( $this, 'render_block' ),
				'attributes'      => array(
					'slides'         => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'object' ),
					),
					'kenBurns'       => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'objectFit'      => array(
						'type'    => 'string',
						'default' => 'cover',
					),
					'objectPosition' => array(
						'type'    => 'string',
						'default' => 'center center',
					),
					'slideDuration'  => array(
						'type'    => 'integer',
						'default' => 6,
					),
				),
			)
		);
	}

	// -------------------------------------------------------------------------
	// Block editor assets (only inside the editor)
	// -------------------------------------------------------------------------

	public function enqueue_block_editor_assets(): void {
		wp_enqueue_script(
			'wpff-slider-editor',
			WPFF_SLIDER_URL . 'blocks/wpff-slider/editor.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
			filemtime( WPFF_SLIDER_DIR . 'blocks/wpff-slider/editor.js' ),
			true
		);

		wp_enqueue_style(
			'wpff-slider-editor',
			WPFF_SLIDER_URL . 'assets/css/wpff-slider-editor.css',
			array(),
			filemtime( WPFF_SLIDER_DIR . 'assets/css/wpff-slider-editor.css' )
		);
	}

	// -------------------------------------------------------------------------
	// Server-side render callback
	// Frontend assets are enqueued here so they load only when the block is used.
	// -------------------------------------------------------------------------

	public function render_block( array $attributes ): string {
		$slides = $attributes['slides'] ?? array();

		// Drop slides without an image URL.
		$slides = array_values(
			array_filter(
				$slides,
				function ( $slide ) {
					return ! empty( $slide['imageUrl'] );
				}
			)
		);

		if ( empty( $slides ) ) {
			return '';
		}

		// Enqueue frontend assets — WordPress deduplicates by handle.
		wp_enqueue_style(
			'wpff-slider',
			WPFF_SLIDER_URL . 'assets/css/wpff-slider.css',
			array(),
			filemtime( WPFF_SLIDER_DIR . 'assets/css/wpff-slider.css' )
		);
		wp_enqueue_script(
			'wpff-slider',
			WPFF_SLIDER_URL . 'assets/js/wpff-slider.js',
			array(),
			filemtime( WPFF_SLIDER_DIR . 'assets/js/wpff-slider.js' ),
			true
		);

		return $this->build_html( $attributes, $slides );
	}

	// -------------------------------------------------------------------------
	// HTML builder
	// -------------------------------------------------------------------------

	private function build_html( array $attributes, array $slides ): string {

		/* ---- sanitise & whitelist every value ---- */

		$object_position = sanitize_text_field( $attributes['objectPosition'] ?? 'center center' );
		$heading_tag     = sanitize_key( $attributes['headingTag'] ?? 'h2' );
		$slider_height   = sanitize_text_field( $attributes['sliderHeight'] ?? '600px' );
		$slide_duration  = absint( $attributes['slideDuration'] ?? 6 );
		$ken_burns       = (bool) ( $attributes['kenBurns'] ?? true );

		$position_whitelist = array(
			'top center',
			'center center',
			'bottom center',
		);
		$position_css       = in_array( $object_position, $position_whitelist, true )
			? $object_position
			: 'center center';

		if ( ! preg_match( '/^[0-9]+(?:px|vh|%)$/', $slider_height ) ) {
			$slider_height = '600px';
		}

		/* ---- container ---- */

		$style = sprintf(
			'height:%s;--wpff-anim-duration:%ds;--wpff-object-fit:%s;--wpff-object-position:%s;',
			$slider_height,
			$slide_duration,
			'cover',
			$position_css
		);

		$html = sprintf(
			'<div class="wpff-slider" style="%s" data-slide-duration="%d">',
			esc_attr( $style ),
			$slide_duration
		);

		/* ---- slides ---- */

		$kb_variants = array( 'wpff-kb-1', 'wpff-kb-2', 'wpff-kb-3', 'wpff-kb-4' );
		$kb_count    = count( $kb_variants );

		$html .= '<div class="wpff-slider__track">';

		foreach ( $slides as $i => $slide ) {
			$kb_class  = $ken_burns ? $kb_variants[ $i % $kb_count ] : '';
			$is_first  = ( 0 === $i );
			$slide_cls = 'wpff-slide' . ( $is_first ? ' wpff-slide--active' : '' );

			$image_url = esc_url( $slide['imageUrl'] ?? '' );
			$image_id  = absint( $slide['imageId'] ?? 0 );

			// Always prefer the live alt from the media library so edits made
			// after the slide was saved are reflected without re-selecting the image.
			$image_alt = $image_id > 0
				? get_post_meta( $image_id, '_wp_attachment_image_alt', true )
				: '';

			if ( empty( $image_alt ) ) {
				$image_alt = isset( $slide['imageAlt'] ) ? $slide['imageAlt'] : '';
			}
			if ( empty( $image_alt ) ) {
				$image_alt = __( 'Slider image', 'wpff-slider' );
			}
			$image_alt    = esc_attr( $image_alt );
			$heading      = esc_html( $slide['heading'] ?? '' );
			$desc         = $slide['description'] ?? '';
			$link_url     = esc_url( $slide['linkUrl'] ?? '' );
			$link_new_tab = ! empty( $slide['linkNewTab'] );

			// Use <a> as the slide wrapper when a link is present so the whole
			// slide is clickable — no separate button needed.
			if ( $link_url ) {
				$aria_label = ! empty( $heading ) ? $heading : __( 'View slide', 'wpff-slider' );
				$target     = $link_new_tab ? ' target="_blank" rel="noopener noreferrer"' : '';
				$html      .= sprintf(
					'<a class="%s" href="%s" aria-label="%s"%s>',
					esc_attr( $slide_cls ),
					$link_url,
					esc_attr( $aria_label ),
					$target
				);
			} else {
				$html .= sprintf( '<div class="%s">', esc_attr( $slide_cls ) );
			}

			// Image — use wp_get_attachment_image() so WordPress generates a full
			// srcset/sizes, letting the browser pick the right size per viewport.
			// Fall back to a plain <img> if no image ID is stored.
			$img_attrs = array(
				'class'         => 'wpff-slide__image ' . esc_attr( $kb_class ),
				'alt'           => $image_alt,
				'loading'       => $is_first ? 'eager' : 'lazy',
				'fetchpriority' => $is_first ? 'high' : 'auto',
				'decoding'      => $is_first ? 'sync' : 'async',
				'sizes'         => '100vw',
			);

			$html .= '<div class="wpff-slide__image-wrap">';
			$html .= $image_id > 0
				? wp_get_attachment_image( $image_id, 'full', false, $img_attrs )
				: sprintf(
					'<img src="%s" alt="%s" class="%s" loading="%s" fetchpriority="%s" decoding="%s" />',
					$image_url,
					$image_alt,
					esc_attr( $img_attrs['class'] ),
					$img_attrs['loading'],
					$img_attrs['fetchpriority'],
					$img_attrs['decoding']
				);
			$html .= '</div>';

			// Content overlay — heading and description only.
			if ( $heading || $desc ) {
				$html .= '<div class="wpff-slide__content">';

				if ( $heading ) {
					$html .= sprintf(
						'<%1$s class="wpff-slide__heading">%2$s</%1$s>',
						$heading_tag,
						$heading
					);
				}
				if ( $desc ) {
					$html .= '<div class="wpff-slide__description">'
						. wpautop( wp_kses( $desc, array() ) )
						. '</div>';
				}

				$html .= '</div>';
			}

			$html .= $link_url ? '</a>' : '</div>'; // .wpff-slide
		}

		$html .= '</div>'; // .wpff-slider__track

		/* ---- navigation dots (only when there are multiple slides) ---- */

		if ( count( $slides ) > 1 ) {
			$html .= sprintf(
				'<div class="wpff-slider__dots" role="tablist" aria-label="%s">',
				esc_attr__( 'Slides', 'wpff-slider' )
			);

			foreach ( $slides as $i => $slide ) {
				$html .= sprintf(
					'<button class="wpff-slider__dot%s" role="tab" aria-selected="%s" aria-label="%s" data-index="%d"></button>',
					0 === $i ? ' wpff-slider__dot--active' : '',
					0 === $i ? 'true' : 'false',
					/* translators: %d: slide number */
					esc_attr( sprintf( __( 'Go to slide %d', 'wpff-slider' ), $i + 1 ) ),
					$i
				);
			}

			$html .= '</div>';
		}

		$html .= '</div>'; // .wpff-slider

		return $html;
	}
}
