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
		add_shortcode( 'wpff_slider', array( $this, 'render_shortcode' ) );
	}

	// -------------------------------------------------------------------------
	// Shortcode — [wpff_slider id="123"]
	// -------------------------------------------------------------------------

	public function render_shortcode( array $atts ): string {
		$atts = shortcode_atts( array( 'id' => 0 ), $atts, 'wpff_slider' );
		$post = get_post( absint( $atts['id'] ) );

		if ( ! $post || 'wp_block' !== $post->post_type ) {
			return '';
		}

		return do_blocks( $post->post_content );
	}

	// -------------------------------------------------------------------------
	// Block registration — also registers all asset handles so WordPress can
	// inject them into the correct contexts (post editor, site editor iframe,
	// and frontend) automatically via the block registration fields.
	// -------------------------------------------------------------------------

	public function register_block(): void {

		wp_register_style(
			'wpff-slider',
			WPFF_SLIDER_URL . 'assets/css/wpff-slider.min.css',
			array(),
			filemtime( WPFF_SLIDER_DIR . 'assets/css/wpff-slider.min.css' )
		);

		wp_register_script(
			'wpff-slider',
			WPFF_SLIDER_URL . 'assets/js/wpff-slider.min.js',
			array(),
			filemtime( WPFF_SLIDER_DIR . 'assets/js/wpff-slider.min.js' ),
			array(
				'strategy'  => 'defer',
				'in_footer' => false,
			)
		);

		wp_register_style(
			'wpff-slider-editor',
			WPFF_SLIDER_URL . 'assets/css/wpff-slider-editor.min.css',
			array(),
			filemtime( WPFF_SLIDER_DIR . 'assets/css/wpff-slider-editor.min.css' )
		);

		wp_register_script(
			'wpff-slider-editor',
			WPFF_SLIDER_URL . 'blocks/wpff-slider/editor.min.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-server-side-render', 'wp-data' ),
			filemtime( WPFF_SLIDER_DIR . 'blocks/wpff-slider/editor.min.js' ),
			true
		);

		register_block_type(
			'wpff-slider/slider',
			array(
				'render_callback' => array( $this, 'render_block' ),
				'editor_script'   => 'wpff-slider-editor',
				'editor_style'    => 'wpff-slider-editor',
				'style'           => 'wpff-slider',
				'script'          => 'wpff-slider',
				'attributes'      => array(
					'slides'              => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'object' ),
					),
					'kenBurns'            => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'contentAnim'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'objectPosition'      => array(
						'type'    => 'string',
						'default' => 'center center',
					),
					'slideDuration'       => array(
						'type'    => 'integer',
						'default' => 6,
					),
					'headingTag'          => array(
						'type'    => 'string',
						'default' => 'h2',
					),
					'sliderHeight'        => array(
						'type'    => 'string',
						'default' => '400px',
					),
					'sliderHeightMobile'  => array(
						'type'    => 'string',
						'default' => '450px',
					),
					'aspectRatio'         => array(
						'type'    => 'string',
						'default' => '16 / 6',
					),
					'contentPosition'     => array(
						'type'    => 'string',
						'default' => 'bottom center',
					),
					'textShadow'          => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'overlayGradient'     => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'headingFontSize'     => array(
						'type'    => 'string',
						'default' => '2.5rem',
					),
					'descriptionFontSize' => array(
						'type'    => 'string',
						'default' => '1rem',
					),
					'headingColor'        => array(
						'type'    => 'string',
						'default' => '#ffffff',
					),
					'descriptionColor'    => array(
						'type'    => 'string',
						'default' => '#ffffff',
					),
				),
			)
		);
	}

	// -------------------------------------------------------------------------
	// Server-side render callback
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

		return $this->build_html( $attributes, $slides );
	}

	// -------------------------------------------------------------------------
	// HTML builder
	// -------------------------------------------------------------------------

	private function build_html( array $attributes, array $slides ): string {

		/* ---- sanitise & whitelist every value ---- */

		$image_focus          = sanitize_text_field( $attributes['objectPosition'] ?? 'center center' );
		$allowed_heading_tags = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span' );
		$heading_tag          = in_array( $attributes['headingTag'] ?? 'h2', $allowed_heading_tags, true )
			? $attributes['headingTag']
			: 'h2';
		$slider_height        = sanitize_text_field( $attributes['sliderHeight'] ?? '600px' );
		$slider_height_mobile = sanitize_text_field( $attributes['sliderHeightMobile'] ?? '' );
		$aspect_ratio         = sanitize_text_field( $attributes['aspectRatio'] ?? '' );
		$slide_duration       = absint( $attributes['slideDuration'] ?? 6 );
		$ken_burns            = (bool) ( $attributes['kenBurns'] ?? true );
		$content_anim         = (bool) ( $attributes['contentAnim'] ?? true );
		$content_position     = sanitize_text_field( $attributes['contentPosition'] ?? 'bottom center' );
		$text_shadow          = (bool) ( $attributes['textShadow'] ?? true );
		$overlay_gradient     = (bool) ( $attributes['overlayGradient'] ?? true );
		$heading_font_size    = sanitize_text_field( $attributes['headingFontSize'] ?? '2.5rem' );
		$desc_font_size       = sanitize_text_field( $attributes['descriptionFontSize'] ?? '1rem' );
		$heading_color        = sanitize_text_field( $attributes['headingColor'] ?? '#ffffff' );
		$desc_color           = sanitize_text_field( $attributes['descriptionColor'] ?? '#ffffff' );

		if ( ! preg_match( '/^[0-9]+(?:\.[0-9]+)?(?:px|rem|em|vw|%)$/', $heading_font_size ) ) {
			$heading_font_size = '2.5rem';
		}
		if ( ! preg_match( '/^[0-9]+(?:\.[0-9]+)?(?:px|rem|em|vw|%)$/', $desc_font_size ) ) {
			$desc_font_size = '1rem';
		}

		$position_whitelist = array(
			'top center',
			'center center',
			'bottom center',
		);
		$position_css       = in_array( $image_focus, $position_whitelist, true )
			? $image_focus
			: 'center center';

		// Map "vertical horizontal" to flex values.
		$content_position_map = array(
			'top left'      => array(
				'justify' => 'flex-start',
				'align'   => 'flex-start',
				'text'    => 'left',
			),
			'top center'    => array(
				'justify' => 'flex-start',
				'align'   => 'center',
				'text'    => 'center',
			),
			'top right'     => array(
				'justify' => 'flex-start',
				'align'   => 'flex-end',
				'text'    => 'right',
			),
			'center left'   => array(
				'justify' => 'center',
				'align'   => 'flex-start',
				'text'    => 'left',
			),
			'center center' => array(
				'justify' => 'center',
				'align'   => 'center',
				'text'    => 'center',
			),
			'center right'  => array(
				'justify' => 'center',
				'align'   => 'flex-end',
				'text'    => 'right',
			),
			'bottom left'   => array(
				'justify' => 'flex-end',
				'align'   => 'flex-start',
				'text'    => 'left',
			),
			'bottom center' => array(
				'justify' => 'flex-end',
				'align'   => 'center',
				'text'    => 'center',
			),
			'bottom right'  => array(
				'justify' => 'flex-end',
				'align'   => 'flex-end',
				'text'    => 'right',
			),
		);
		$content_flex         = $content_position_map[ $content_position ] ?? $content_position_map['bottom center'];

		if ( ! preg_match( '/^[0-9]+(?:px|vh|%)$/', $slider_height ) ) {
			$slider_height = '600px';
		}
		if ( ! preg_match( '/^[0-9]+(?:px|vh|%)$/', $slider_height_mobile ) ) {
			$slider_height_mobile = '';
		}
		if ( ! preg_match( '/^[0-9]+(?:\.[0-9]+)? \/ [0-9]+(?:\.[0-9]+)?$/', $aspect_ratio ) ) {
			$aspect_ratio = '';
		}

		/* ---- container ---- */

		$style = sprintf(
			'--wpff-slider-height:%s;--wpff-anim-duration:%ds;--wpff-object-position:%s;--wpff-content-justify:%s;--wpff-content-align:%s;--wpff-content-text-align:%s;',
			$slider_height,
			$slide_duration,
			$position_css,
			$content_flex['justify'],
			$content_flex['align'],
			$content_flex['text']
		);

		if ( $slider_height_mobile ) {
			$style .= sprintf( '--wpff-slider-height-mobile:%s;', $slider_height_mobile );
		}
		if ( $aspect_ratio ) {
			$style .= sprintf( '--wpff-slider-aspect-ratio:%s;', $aspect_ratio );
		}
		$style .= '--wpff-heading-size:' . $heading_font_size . ';';
		$style .= '--wpff-desc-size:' . $desc_font_size . ';';
		if ( $heading_color ) {
			$style .= '--wpff-heading-color:' . $heading_color . ';';
		}
		if ( $desc_color ) {
			$style .= '--wpff-desc-color:' . $desc_color . ';';
		}

		$slider_classes = 'wpff-slider' . ( $content_anim ? ' wpff-slider--content-anim' : '' );

		$html = sprintf(
			'<div class="%s" role="region" aria-roledescription="%s" aria-label="%s" style="%s" data-slide-duration="%d" data-object-position="%s">',
			esc_attr( $slider_classes ),
			esc_attr__( 'carousel', 'wpff-slider' ),
			esc_attr__( 'Image slider', 'wpff-slider' ),
			esc_attr( $style ),
			$slide_duration,
			esc_attr( $position_css )
		);

		/* ---- slides ---- */

		$block_settings = array(
			'heading_tag'      => $heading_tag,
			'ken_burns'        => $ken_burns,
			'kb_variants'      => array( 'wpff-kb-1', 'wpff-kb-2', 'wpff-kb-3', 'wpff-kb-4' ),
			'text_shadow'      => $text_shadow,
			'object_position'  => $position_css,
			'overlay_gradient' => $overlay_gradient,
		);

		$html .= '<div class="wpff-slider__track">';

		foreach ( $slides as $i => $slide ) {
			$html .= $this->render_slide( $slide, $i, $block_settings );
		}

		$html .= '</div>'; // .wpff-slider__track

		/* ---- navigation dots (only when there are multiple slides) ---- */

		if ( count( $slides ) > 1 ) {
			$html .= sprintf(
				'<div class="wpff-slider__dots" role="group" aria-label="%s">',
				esc_attr__( 'Slide navigation', 'wpff-slider' )
			);

			foreach ( $slides as $i => $slide ) {
				$html .= sprintf(
					'<button class="wpff-slider__dot%s" aria-pressed="%s" aria-label="%s" data-index="%d"></button>',
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

	// -------------------------------------------------------------------------
	// Single slide renderer
	// -------------------------------------------------------------------------

	private function render_slide( array $slide, int $i, array $block_settings ): string {

		// H1 is only appropriate for the first slide; subsequent slides fall back to H2.
		$heading_tag = ( 'h1' === $block_settings['heading_tag'] && $i > 0 ) ? 'h2' : $block_settings['heading_tag'];
		$kb_variants = $block_settings['kb_variants'];
		$kb_class    = $block_settings['ken_burns'] ? $kb_variants[ $i % count( $kb_variants ) ] : '';
		$is_first    = ( 0 === $i );
		$slide_cls   = 'wpff-slide' . ( $is_first ? ' wpff-slide--active' : '' );

		$image_url = esc_url( $slide['imageUrl'] ?? '' );
		$image_id  = absint( $slide['imageId'] ?? 0 );
		$image_alt = __( 'Slider image', 'wpff-slider' );
		$meta_alt  = $image_id > 0 ? get_post_meta( $image_id, '_wp_attachment_image_alt', true ) : '';
		$image_alt = $meta_alt ? $meta_alt : $image_alt;

		$heading      = $slide['heading'] ?? '';
		$desc         = $slide['description'] ?? '';
		$link_url     = esc_url( $slide['linkUrl'] ?? '' );
		$link_new_tab = ! empty( $slide['linkNewTab'] );

		$allowed_link_styles = array( 'full', 'button' );
		$link_style          = in_array( $slide['linkStyle'] ?? 'full', $allowed_link_styles, true )
			? ( $slide['linkStyle'] ?? 'full' )
			: 'full';
		$link_text           = sanitize_text_field( $slide['linkText'] ?? '' );

		$use_full_link = $link_url && 'full' === $link_style;
		$use_button    = $link_url && 'button' === $link_style;
		$target        = $link_new_tab ? ' target="_blank" rel="noopener noreferrer"' : '';

		$html       = '';
		$heading_id = ! empty( $heading ) ? wp_unique_id( 'wpff-heading-' ) : '';

		$aria_hidden = $is_first ? 'false' : 'true';
		$inert_attr  = $is_first ? '' : ' inert';

		// Use <a> as the slide wrapper when full-slide link is selected.
		if ( $use_full_link ) {
			if ( $heading_id ) {
				$aria = sprintf( 'aria-labelledby="%s"', esc_attr( $heading_id ) );
			} else {
				/* translators: %d: slide number */
				$slide_label = sprintf( __( 'Slide %d', 'wpff-slider' ), $i + 1 );
				if ( $link_new_tab ) {
					/* translators: appended to link label when link opens in a new tab */
					$slide_label .= ', ' . __( 'opens in new tab', 'wpff-slider' );
				}
				$aria = sprintf( 'aria-label="%s"', esc_attr( $slide_label ) );
			}
			$html .= sprintf(
				'<a class="%s" href="%s" %s%s aria-hidden="%s"%s>',
				esc_attr( $slide_cls ),
				$link_url,
				$aria,
				$target,
				$aria_hidden,
				$inert_attr
			);
		} else {
			$html .= sprintf( '<div class="%s" aria-hidden="%s"%s>', esc_attr( $slide_cls ), $aria_hidden, $inert_attr );
		}

		// Image — use wp_get_attachment_image() so WordPress generates a full
		// srcset/sizes, letting the browser pick the right size per viewport.
		// Fall back to a plain <img> if no image ID is stored.
		$img_attrs = array(
			'class'         => 'wpff-slide__image ' . esc_attr( $kb_class ),
			'style'         => 'object-position:' . esc_attr( $block_settings['object_position'] ) . ';',
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
				'<img src="%s" alt="%s" class="%s" style="%s" loading="%s" fetchpriority="%s" decoding="%s" sizes="100vw" />',
				$image_url,
				esc_attr( $image_alt ),
				esc_attr( $img_attrs['class'] ),
				esc_attr( $img_attrs['style'] ),
				$img_attrs['loading'],
				$img_attrs['fetchpriority'],
				$img_attrs['decoding']
			);
		$html .= '</div>';

		// Content overlay — heading, description, and optional button.
		if ( $heading || $desc || $use_button ) {
			$content_cls = 'wpff-slide__content'
			. ( $block_settings['text_shadow'] ? '' : ' wpff-slide__content--no-shadow' )
			. ( $block_settings['overlay_gradient'] ? '' : ' wpff-slide__content--no-gradient' )
			. ( $use_button ? ' wpff-slide__content--has-button' : '' );
			$html       .= sprintf( '<div class="%s">', esc_attr( $content_cls ) );

			if ( $heading ) {
				$html .= sprintf(
					'<%1$s id="%2$s" class="wpff-slide__heading">%3$s</%1$s>',
					$heading_tag,
					esc_attr( $heading_id ),
					esc_html( $heading )
				);
			}
			if ( $desc ) {
				$html .= '<div class="wpff-slide__description">'
					. wpautop( wp_kses( $desc, array() ) )
					. '</div>';
			}
			if ( $use_button ) {
				$btn_label      = $link_text ? esc_html( $link_text ) : esc_html__( 'Learn More', 'wpff-slider' );
				$new_tab_notice = $link_new_tab
					/* translators: appended to button label when link opens in a new tab */
					? '<span class="wpff-sr-only">' . esc_html__( ', opens in new tab', 'wpff-slider' ) . '</span>'
					: '';
				$html .= sprintf(
					'<a class="wpff-slide__button" href="%s"%s>%s%s</a>',
					$link_url,
					$target,
					$btn_label,
					$new_tab_notice
				);
			}

			$html .= '</div>';
		}

		// When a heading labels the full-slide link and it opens in a new tab,
		// aria-labelledby can't be appended to, so a hidden span carries the notice.
		if ( $use_full_link && $link_new_tab && $heading_id ) {
			$html .= sprintf(
				'<span class="wpff-sr-only">%s</span>',
				/* translators: appended to screen-reader label when link opens in a new tab */
				esc_html__( ', opens in new tab', 'wpff-slider' )
			);
		}

		$html .= $use_full_link ? '</a>' : '</div>'; // .wpff-slide

		return $html;
	}
}
