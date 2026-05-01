/* global wp */
;(function () {
  'use strict'

  const registerBlockType = wp.blocks.registerBlockType
  const el = wp.element.createElement
  const Fragment = wp.element.Fragment
  const useState = wp.element.useState
  const __ = wp.i18n.__
  const useBlockProps = wp.blockEditor.useBlockProps
  const InspectorControls = wp.blockEditor.InspectorControls
  const MediaUpload = wp.blockEditor.MediaUpload
  const MediaUploadCheck = wp.blockEditor.MediaUploadCheck
  const URLInput = wp.blockEditor.URLInput
  const PanelBody = wp.components.PanelBody
  const SelectControl = wp.components.SelectControl
  const RangeControl = wp.components.RangeControl
  const UnitControl = wp.components.UnitControl || wp.components.__experimentalUnitControl
  const TextControl = wp.components.TextControl
  const TextareaControl = wp.components.TextareaControl
  const CheckboxControl = wp.components.CheckboxControl
  const RadioControl = wp.components.RadioControl
  const NumberControl = wp.components.__experimentalNumberControl
  const Button = wp.components.Button
  const Placeholder = wp.components.Placeholder
  const BaseControl = wp.components.BaseControl
  const ColorPalette = wp.components.ColorPalette
  const FontSizePicker = wp.blockEditor.FontSizePicker
  const ServerSideRender = wp.serverSideRender
  const useSelect = wp.data.useSelect

  function uid() {
    return Math.random().toString(36).slice(2, 9)
  }

  // -------------------------------------------------------------------------
  // Block registration
  // -------------------------------------------------------------------------

  registerBlockType('wpff-slider/slider', {
    title: __('WPFF Slider', 'wpff-slider'),
    description: __('Full-width image slider with Ken Burns effect and per-slide content controls.', 'wpff-slider'),
    icon: 'slides',
    category: 'media',

    // Attributes mirror the PHP registration exactly.
    attributes: {
      slides: { type: 'array', default: [] },
      objectPosition: { type: 'string', default: 'center center' },
      kenBurns: { type: 'boolean', default: true },
      contentAnim: { type: 'boolean', default: true },
      slideDuration: { type: 'integer', default: 6 },
      headingTag: { type: 'string', default: 'h2' },
      sliderHeight: { type: 'string', default: '400px' },
      sliderHeightMobile: { type: 'string', default: '450px' },
      aspectRatio: { type: 'string', default: '16 / 6' },
      contentPosition: { type: 'string', default: 'bottom center' },
      textShadow: { type: 'boolean', default: true },
      overlayGradient: { type: 'boolean', default: true },
      headingFontSize: { type: 'string', default: '2.5rem' },
      descriptionFontSize: { type: 'string', default: '1rem' },
      headingColor: { type: 'string', default: '#ffffff' },
      descriptionColor: { type: 'string', default: '#ffffff' },
      constrainContent: { type: 'boolean', default: true },
      pretitleFontSize: { type: 'string', default: '0.75rem' },
      pretitleColor: { type: 'string', default: '#ffffff' },
      kenBurnsAmount: { type: 'integer', default: 15 }
    },

    // -----------------------------------------------------------------
    // Edit
    // -----------------------------------------------------------------

    edit: function (props) {
      const attributes = props.attributes
      const setAttributes = props.setAttributes
      const slides = attributes.slides || []
      const blockProps = useBlockProps({ className: 'wpff-slider-editor-wrap' })

      const { postId, postType } = useSelect(function (select) {
        return {
          postId: select('core/editor').getCurrentPostId(),
          postType: select('core/editor').getCurrentPostType()
        }
      })

      const ratioPresets = [
        { ratio: '21 / 9', label: '21:9', name: __('Cinematic', 'wpff-slider'), w: 21, h: 9 },
        { ratio: '16 / 5', label: '16:5', name: __('Wide hero', 'wpff-slider'), w: 16, h: 5 },
        { ratio: '16 / 6', label: '16:6', name: __('Standard', 'wpff-slider'), w: 16, h: 6 },
        { ratio: '16 / 7', label: '16:7', name: __('Balanced', 'wpff-slider'), w: 16, h: 7 },
        { ratio: '3 / 1', label: '3:1', name: __('Banner', 'wpff-slider'), w: 3, h: 1 },
        { ratio: '4 / 1', label: '4:1', name: __('Slim banner', 'wpff-slider'), w: 4, h: 1 }
      ]
      const [customW, setCustomW] = useState('16')
      const [customH, setCustomH] = useState('9')

      /* ---- slide mutation helpers ---- */

      function addSlide() {
        setAttributes({
          slides: slides.concat([
            {
              id: uid(),
              imageId: 0,
              imageUrl: '',
              imageAlt: '',
              pretitle: '',
              heading: '',
              description: '',
              linkUrl: '',
              linkNewTab: false,
              linkStyle: 'full',
              linkText: ''
            }
          ])
        })
      }

      function removeSlide(idx) {
        setAttributes({
          slides: slides.filter(function (_, i) {
            return i !== idx
          })
        })
      }

      function updateSlide(idx, key, value) {
        setAttributes({
          slides: slides.map(function (s, i) {
            if (i !== idx) return s
            const patch = {}
            patch[key] = value
            return Object.assign({}, s, patch)
          })
        })
      }

      function moveSlide(idx, dir) {
        const to = idx + dir
        if (to < 0 || to >= slides.length) return
        const next = slides.slice()
        const tmp = next[idx]
        next[idx] = next[to]
        next[to] = tmp
        setAttributes({ slides: next })
      }

      /* ---- inspector controls (sidebar) ---- */

      const inspector = el(
        InspectorControls,
        null,
        el(
          PanelBody,
          { title: __('Slider Settings', 'wpff-slider'), initialOpen: true },

          el(
            BaseControl,
            {
              label: __('Aspect Ratio', 'wpff-slider'),
              id: 'wpff-aspect-ratio',
              __nextHasNoMarginBottom: true
            },
            el(
              'div',
              { className: 'wpff-ratio-presets' },
              ratioPresets.map(function (p) {
                var isActive = attributes.aspectRatio === p.ratio
                return el(
                  'button',
                  {
                    key: p.ratio,
                    type: 'button',
                    className: 'wpff-ratio-card' + (isActive ? ' is-active' : ''),
                    onClick: function () {
                      setAttributes({ aspectRatio: isActive ? '' : p.ratio })
                      setCustomW(String(p.w))
                      setCustomH(String(p.h))
                    }
                  },
                  el(
                    'div',
                    { className: 'wpff-ratio-card__preview' },
                    el('div', {
                      className: 'wpff-ratio-card__preview-inner',
                      style: (function () {
                        var maxW = 68,
                          maxH = 38
                        var scale = Math.min(maxW / p.w, maxH / p.h)
                        return {
                          width: Math.round(p.w * scale) + 'px',
                          height: Math.round(p.h * scale) + 'px'
                        }
                      })()
                    })
                  ),
                  el('span', { className: 'wpff-ratio-card__ratio' }, p.label),
                  el('span', { className: 'wpff-ratio-card__name' }, p.name)
                )
              })
            )
          ),

          el(
            'div',
            {
              className:
                'wpff-custom-ratio' +
                (attributes.aspectRatio !== '' &&
                !ratioPresets.some(function (p) {
                  return p.ratio === attributes.aspectRatio
                })
                  ? ' is-active'
                  : '')
            },
            el('p', { className: 'wpff-custom-ratio__label' }, __('Custom Ratio', 'wpff-slider')),
            el(
              'div',
              { className: 'wpff-custom-ratio__row' },
              el(NumberControl, {
                label: __('Width', 'wpff-slider'),
                hideLabelFromVision: true,
                value: customW,
                className: 'wpff-custom-ratio__input',
                min: 1,
                onChange: function (v) {
                  setCustomW(v)
                },
                __nextHasNoMarginBottom: true
              }),
              el('span', { className: 'wpff-custom-ratio__sep' }, '/'),
              el(NumberControl, {
                label: __('Height', 'wpff-slider'),
                hideLabelFromVision: true,
                value: customH,
                className: 'wpff-custom-ratio__input',
                min: 1,
                onChange: function (v) {
                  setCustomH(v)
                },
                __nextHasNoMarginBottom: true
              }),
              el(
                Button,
                {
                  variant: 'secondary',
                  onClick: function () {
                    var w = parseFloat(customW)
                    var h = parseFloat(customH)
                    if (w > 0 && h > 0) {
                      setAttributes({ aspectRatio: w + ' / ' + h })
                    }
                  }
                },
                __('Apply', 'wpff-slider')
              )
            )
          ),

          el(UnitControl, {
            label: __('Min-height (desktop)', 'wpff-slider'),
            value: attributes.sliderHeight,
            units: [
              { value: 'px', label: 'px' },
              { value: 'vh', label: 'vh' },
              { value: '%', label: '%' }
            ],
            onChange: function (v) {
              setAttributes({ sliderHeight: v })
            }
          }),

          el(UnitControl, {
            label: __('Min-height (mobile)', 'wpff-slider'),
            value: attributes.sliderHeightMobile,
            placeholder: __('Same as desktop', 'wpff-slider'),
            units: [
              { value: 'px', label: 'px' },
              { value: 'vh', label: 'vh' },
              { value: '%', label: '%' }
            ],
            onChange: function (v) {
              setAttributes({ sliderHeightMobile: v })
            }
          }),

          el(SelectControl, {
            label: __('Image Focus', 'wpff-slider'),
            value: attributes.objectPosition,
            options: [
              { value: 'top center', label: __('Top', 'wpff-slider') },
              { value: 'center center', label: __('Center', 'wpff-slider') },
              { value: 'bottom center', label: __('Bottom', 'wpff-slider') }
            ],
            onChange: function (v) {
              setAttributes({ objectPosition: v })
            }
          }),

          el(SelectControl, {
            label: __('Content Position', 'wpff-slider'),
            value: attributes.contentPosition,
            options: [
              { value: 'top left', label: __('Top Left', 'wpff-slider') },
              { value: 'top center', label: __('Top Center', 'wpff-slider') },
              { value: 'top right', label: __('Top Right', 'wpff-slider') },
              { value: 'center left', label: __('Center Left', 'wpff-slider') },
              { value: 'center center', label: __('Center', 'wpff-slider') },
              { value: 'center right', label: __('Center Right', 'wpff-slider') },
              { value: 'bottom left', label: __('Bottom Left', 'wpff-slider') },
              { value: 'bottom center', label: __('Bottom Center', 'wpff-slider') },
              { value: 'bottom right', label: __('Bottom Right', 'wpff-slider') }
            ],
            onChange: function (v) {
              setAttributes({ contentPosition: v })
            }
          }),

          el(SelectControl, {
            label: __('Heading tag', 'wpff-slider'),
            value: attributes.headingTag,
            options: [
              { value: 'h1', label: 'H1' },
              { value: 'h2', label: 'H2' },
              { value: 'h3', label: 'H3' },
              { value: 'h4', label: 'H4' },
              { value: 'h5', label: 'H5' },
              { value: 'h6', label: 'H6' },
              { value: 'p', label: __('Paragraph', 'wpff-slider') },
              { value: 'span', label: __('Span', 'wpff-slider') }
            ],
            onChange: function (v) {
              setAttributes({ headingTag: v })
            }
          }),

          el(CheckboxControl, {
            label: __('Enable Ken Burns effect', 'wpff-slider'),
            checked: attributes.kenBurns !== false,
            onChange: function (v) {
              setAttributes({ kenBurns: v })
            }
          }),

          attributes.kenBurns !== false
            ? el(RangeControl, {
                label: __('Ken Burns amount (%)', 'wpff-slider'),
                value: attributes.kenBurnsAmount !== undefined ? attributes.kenBurnsAmount : 15,
                min: 5,
                max: 30,
                step: 1,
                onChange: function (v) {
                  setAttributes({ kenBurnsAmount: v })
                }
              })
            : null,

          el(CheckboxControl, {
            label: __('Enable fade in/out effect', 'wpff-slider'),
            checked: attributes.contentAnim !== false,
            onChange: function (v) {
              setAttributes({ contentAnim: v })
            }
          }),

          el(CheckboxControl, {
            label: __('Enable text shadow', 'wpff-slider'),
            checked: attributes.textShadow !== false,
            onChange: function (v) {
              setAttributes({ textShadow: v })
            }
          }),

          el(CheckboxControl, {
            label: __('Enable overlay gradient', 'wpff-slider'),
            checked: attributes.overlayGradient !== false,
            onChange: function (v) {
              setAttributes({ overlayGradient: v })
            }
          }),

          el(CheckboxControl, {
            label: __('Constrain content width', 'wpff-slider'),
            help: __("Limits content to the theme's wide width (falls back to 1200px).", 'wpff-slider'),
            checked: attributes.constrainContent !== false,
            onChange: function (v) {
              setAttributes({ constrainContent: v })
            }
          }),

          el(RangeControl, {
            label: __('Slide Duration (s)', 'wpff-slider'),
            help: __('How long each slide is displayed.', 'wpff-slider'),
            value: attributes.slideDuration,
            min: 3,
            max: 20,
            onChange: function (v) {
              setAttributes({ slideDuration: v })
            }
          })
        ),

        el(
          PanelBody,
          { title: __('Text & Colors', 'wpff-slider'), initialOpen: false },

          el(
            BaseControl,
            {
              label: __('Pre-title size', 'wpff-slider'),
              __nextHasNoMarginBottom: true
            },
            el(FontSizePicker, {
              fontSizes: [
                { name: 'XS', slug: 'xs', size: '0.65rem' },
                { name: 'S', slug: 's', size: '0.75rem' },
                { name: 'M', slug: 'm', size: '0.875rem' },
                { name: 'L', slug: 'l', size: '1rem' }
              ],
              value: attributes.pretitleFontSize,
              onChange: function (v) {
                setAttributes({ pretitleFontSize: v === undefined ? '0.75rem' : v })
              },
              withReset: true,
              disableCustomFontSizes: false
            })
          ),

          el(
            BaseControl,
            {
              label: __('Pre-title color', 'wpff-slider'),
              __nextHasNoMarginBottom: true
            },
            el(ColorPalette, {
              value: attributes.pretitleColor,
              onChange: function (v) {
                setAttributes({ pretitleColor: v || '' })
              }
            })
          ),

          el(
            BaseControl,
            {
              label: __('Heading size', 'wpff-slider'),
              __nextHasNoMarginBottom: true
            },
            el(FontSizePicker, {
              fontSizes: [
                { name: 'S', slug: 's', size: '1.5rem' },
                { name: 'M', slug: 'm', size: '2rem' },
                { name: 'L', slug: 'l', size: '2.5rem' },
                { name: 'XL', slug: 'xl', size: '3.5rem' }
              ],
              value: attributes.headingFontSize,
              onChange: function (v) {
                setAttributes({ headingFontSize: v === undefined ? '2.5rem' : v })
              },
              withReset: true,
              disableCustomFontSizes: false
            })
          ),

          el(
            BaseControl,
            {
              label: __('Description size', 'wpff-slider'),
              __nextHasNoMarginBottom: true
            },
            el(FontSizePicker, {
              fontSizes: [
                { name: 'S', slug: 's', size: '0.875rem' },
                { name: 'M', slug: 'm', size: '1rem' },
                { name: 'L', slug: 'l', size: '1.25rem' },
                { name: 'XL', slug: 'xl', size: '1.5rem' }
              ],
              value: attributes.descriptionFontSize,
              onChange: function (v) {
                setAttributes({ descriptionFontSize: v === undefined ? '1rem' : v })
              },
              withReset: true,
              disableCustomFontSizes: false
            })
          ),

          el(
            BaseControl,
            {
              label: __('Heading color', 'wpff-slider'),
              __nextHasNoMarginBottom: true
            },
            el(ColorPalette, {
              value: attributes.headingColor,
              onChange: function (v) {
                setAttributes({ headingColor: v || '' })
              }
            })
          ),

          el(
            BaseControl,
            {
              label: __('Description color', 'wpff-slider'),
              __nextHasNoMarginBottom: true
            },
            el(ColorPalette, {
              value: attributes.descriptionColor,
              onChange: function (v) {
                setAttributes({ descriptionColor: v || '' })
              }
            })
          )
        ),

        el(
          PanelBody,
          { title: __('Shortcode', 'wpff-slider'), initialOpen: false },
          postType === 'wp_block'
            ? el(
                'div',
                { className: 'wpff-shortcode-panel' },
                el(
                  'p',
                  { className: 'wpff-shortcode-panel__help' },
                  __(
                    'Use this shortcode to embed the slider in Elementor, WPBakery, or any other page builder:',
                    'wpff-slider'
                  )
                ),
                el('code', { className: 'wpff-shortcode-panel__code' }, '[wpff_slider id="' + postId + '"]')
              )
            : el(
                'p',
                { className: 'wpff-shortcode-panel__help' },
                __(
                  'Save this block as a Synced Pattern to get a shortcode you can use in other page builders.',
                  'wpff-slider'
                )
              )
        )
      )

      /* ---- slide cards (edit controls only — preview via ServerSideRender) ---- */

      const cards = slides.map(function (slide, idx) {
        return el(
          'div',
          { key: slide.id || idx, className: 'wpff-slide-card' },

          // Header row: slide number + reorder/delete buttons
          el(
            'div',
            { className: 'wpff-slide-card__header' },
            el('span', { className: 'wpff-slide-card__number' }, __('Slide', 'wpff-slider') + ' ' + (idx + 1)),
            el(
              'div',
              { className: 'wpff-slide-card__actions' },
              el(Button, {
                icon: 'arrow-up-alt2',
                label: __('Move up', 'wpff-slider'),
                isSmall: true,
                disabled: idx === 0,
                onClick: function () {
                  moveSlide(idx, -1)
                }
              }),
              el(Button, {
                icon: 'arrow-down-alt2',
                label: __('Move down', 'wpff-slider'),
                isSmall: true,
                disabled: idx === slides.length - 1,
                onClick: function () {
                  moveSlide(idx, 1)
                }
              }),
              el(Button, {
                icon: 'trash',
                label: __('Remove slide', 'wpff-slider'),
                isSmall: true,
                isDestructive: true,
                onClick: function () {
                  removeSlide(idx)
                }
              })
            )
          ),

          // Image picker — full width, above the two columns
          el(
            MediaUploadCheck,
            null,
            el(MediaUpload, {
              onSelect: function (media) {
                setAttributes({
                  slides: slides.map(function (s, i) {
                    if (i !== idx) return s
                    return Object.assign({}, s, {
                      imageId: media.id,
                      imageUrl: media.url,
                      imageAlt: media.alt || __('Slider image', 'wpff-slider')
                    })
                  })
                })
              },
              allowedTypes: ['image'],
              value: slide.imageId || 0,
              render: function (ref) {
                if (slide.imageUrl) {
                  return el(
                    'div',
                    { className: 'wpff-slide-card__thumb-wrap' },
                    el('img', {
                      src: slide.imageUrl,
                      alt: slide.imageAlt,
                      className: 'wpff-slide-card__thumb'
                    }),
                    el(
                      Button,
                      {
                        variant: 'secondary',
                        isSmall: true,
                        onClick: ref.open
                      },
                      __('Replace image', 'wpff-slider')
                    )
                  )
                }
                return el(
                  Button,
                  {
                    variant: 'secondary',
                    onClick: ref.open,
                    className: 'wpff-slide-card__image-btn',
                    icon: 'format-image'
                  },
                  __('Select image', 'wpff-slider')
                )
              }
            })
          ),

          // Two-column body — heading/description | link options
          el(
            'div',
            { className: 'wpff-slide-card__body' },

            // Column 1 — heading, description
            el(
              'div',
              { className: 'wpff-slide-card__col' },

              el(TextControl, {
                label: __('Pre-title', 'wpff-slider'),
                value: slide.pretitle || '',
                placeholder: __('Optional pre-title', 'wpff-slider'),
                autoComplete: 'off',
                onChange: function (v) {
                  updateSlide(idx, 'pretitle', v)
                }
              }),
              el(TextControl, {
                label: __('Heading', 'wpff-slider'),
                value: slide.heading,
                placeholder: __('Optional heading', 'wpff-slider'),
                autoComplete: 'off',
                onChange: function (v) {
                  updateSlide(idx, 'heading', v)
                }
              }),
              el(TextareaControl, {
                label: __('Description', 'wpff-slider'),
                value: slide.description,
                placeholder: __('Optional description', 'wpff-slider'),
                onChange: function (v) {
                  updateSlide(idx, 'description', v.replace(/\n{3,}/g, '\n\n'))
                }
              })
            ),

            // Column 2 — link URL and conditional link options
            el(
              'div',
              { className: 'wpff-slide-card__col' },

              el(
                'div',
                { className: 'wpff-url-input-wrap' },
                el('label', { className: 'wpff-url-input-wrap__label' }, __('Link URL', 'wpff-slider')),
                el(URLInput, {
                  value: slide.linkUrl,
                  placeholder: 'https://',
                  autoComplete: 'off',
                  onChange: function (v) {
                    updateSlide(idx, 'linkUrl', v)
                  }
                })
              ),

              slide.linkUrl
                ? el(CheckboxControl, {
                    label: __('Open in new tab', 'wpff-slider'),
                    checked: !!slide.linkNewTab,
                    onChange: function (v) {
                      updateSlide(idx, 'linkNewTab', v)
                    }
                  })
                : null,

              slide.linkUrl
                ? el(
                    'div',
                    { className: 'wpff-link-style-row' },
                    el(RadioControl, {
                      label: __('Link style', 'wpff-slider'),
                      selected: slide.linkStyle || 'full',
                      options: [
                        { label: __('Full slide clickable', 'wpff-slider'), value: 'full' },
                        { label: __('Button', 'wpff-slider'), value: 'button' }
                      ],
                      onChange: function (v) {
                        updateSlide(idx, 'linkStyle', v)
                      }
                    }),
                    slide.linkStyle === 'button'
                      ? el(TextControl, {
                          label: __('Button text', 'wpff-slider'),
                          value: slide.linkText || '',
                          placeholder: __('Learn More', 'wpff-slider'),
                          onChange: function (v) {
                            updateSlide(idx, 'linkText', v)
                          }
                        })
                      : null
                  )
                : null
            )
          )
        )
      })

      /* ---- main edit area ---- */

      let mainContent

      if (slides.length === 0) {
        mainContent = el(
          Placeholder,
          {
            icon: 'slides',
            label: __('WPFF Slider', 'wpff-slider'),
            instructions: __('Add your first slide to get started.', 'wpff-slider')
          },
          el(
            Button,
            {
              variant: 'primary',
              onClick: addSlide
            },
            __('Add First Slide', 'wpff-slider')
          )
        )
      } else {
        mainContent = el(
          'div',
          { className: 'wpff-slides-list' },
          el(ServerSideRender, {
            block: 'wpff-slider/slider',
            attributes: attributes,
            className: 'wpff-slider-ssr-preview'
          }),
          cards,
          el(
            Button,
            {
              variant: 'secondary',
              onClick: addSlide,
              className: 'wpff-add-slide-btn',
              icon: 'plus'
            },
            __('Add Slide', 'wpff-slider')
          )
        )
      }

      return el(Fragment, null, inspector, el('div', blockProps, mainContent))
    },

    // Server-side rendered — no static markup needed.
    save: function () {
      return null
    }
  })
})()
