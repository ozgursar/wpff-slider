/* global wp */
;(function () {
  'use strict'

  const registerBlockType = wp.blocks.registerBlockType
  const el = wp.element.createElement
  const Fragment = wp.element.Fragment
  const __ = wp.i18n.__
  const useBlockProps = wp.blockEditor.useBlockProps
  const InspectorControls = wp.blockEditor.InspectorControls
  const MediaUpload = wp.blockEditor.MediaUpload
  const MediaUploadCheck = wp.blockEditor.MediaUploadCheck
  const PanelBody = wp.components.PanelBody
  const SelectControl = wp.components.SelectControl
  const RangeControl = wp.components.RangeControl
  const UnitControl = wp.components.UnitControl || wp.components.__experimentalUnitControl
  const TextControl = wp.components.TextControl
  const TextareaControl = wp.components.TextareaControl
  const CheckboxControl = wp.components.CheckboxControl
  const Button = wp.components.Button
  const Placeholder = wp.components.Placeholder
  const BaseControl = wp.components.BaseControl
  const ColorPalette = wp.components.ColorPalette
  const FontSizePicker = wp.blockEditor.FontSizePicker
  const ServerSideRender = wp.serverSideRender

  function uid() {
    return Math.random().toString(36).slice(2, 9)
  }

  // -------------------------------------------------------------------------
  // Block registration
  // -------------------------------------------------------------------------

  registerBlockType('wpff-slider/slider', {
    title: __('WPFF Slider', 'wpff-slider'),
    description: __('Full-width image slider with Ken Burns pan-and-zoom effect, configurable content position, text shadow, overlay gradient, and per-slide heading, description, and link controls.', 'wpff-slider'),
    icon: 'slides',
    category: 'media',

    // Attributes mirror the PHP registration exactly.
    attributes: {
      slides: { type: 'array', default: [] },
      objectPosition: { type: 'string', default: 'center center' },
      kenBurns: { type: 'boolean', default: true },
      slideDuration: { type: 'integer', default: 6 },
      headingTag: { type: 'string', default: 'h2' },
      sliderHeight: { type: 'string', default: '600px' },
      sliderHeightMobile: { type: 'string', default: '' },
      contentPosition: { type: 'string', default: 'bottom center' },
      textShadow: { type: 'boolean', default: true },
      overlayGradient: { type: 'boolean', default: true },
      headingFontSize: { type: 'string', default: '2.5rem' },
      descriptionFontSize: { type: 'string', default: '1rem' },
      headingColor: { type: 'string', default: '#ffffff' },
      descriptionColor: { type: 'string', default: '#ffffff' }
    },

    // -----------------------------------------------------------------
    // Edit
    // -----------------------------------------------------------------

    edit: function (props) {
      const attributes = props.attributes
      const setAttributes = props.setAttributes
      const slides = attributes.slides || []
      const blockProps = useBlockProps({ className: 'wpff-slider-editor-wrap' })

      /* ---- slide mutation helpers ---- */

      function addSlide() {
        setAttributes({
          slides: slides.concat([
            {
              id: uid(),
              imageId: 0,
              imageUrl: '',
              imageAlt: '',
              heading: '',
              description: '',
              linkUrl: '',
              linkNewTab: false
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

          el(UnitControl, {
            label: __('Slider height', 'wpff-slider'),
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
            label: __('Slider height (Mobile)', 'wpff-slider'),
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
              { value: 'top center',    label: __('Top',    'wpff-slider') },
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
              { value: 'top left',      label: __('Top Left',      'wpff-slider') },
              { value: 'top center',    label: __('Top Center',    'wpff-slider') },
              { value: 'top right',     label: __('Top Right',     'wpff-slider') },
              { value: 'center left',   label: __('Center Left',   'wpff-slider') },
              { value: 'center center', label: __('Center',        'wpff-slider') },
              { value: 'center right',  label: __('Center Right',  'wpff-slider') },
              { value: 'bottom left',   label: __('Bottom Left',   'wpff-slider') },
              { value: 'bottom center', label: __('Bottom Center', 'wpff-slider') },
              { value: 'bottom right',  label: __('Bottom Right',  'wpff-slider') }
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

          el(RangeControl, {
            label: __('Slide Duration (s)', 'wpff-slider'),
            help: __('How long each slide is displayed.', 'wpff-slider'),
            value: attributes.slideDuration,
            min: 3,
            max: 20,
            onChange: function (v) {
              setAttributes({ slideDuration: v })
            }
          }),

        ),

        el(
          PanelBody,
          { title: __('Text & Colors', 'wpff-slider'), initialOpen: false },

          el(BaseControl, {
            label: __('Heading size', 'wpff-slider'),
            __nextHasNoMarginBottom: true
          },
            el(FontSizePicker, {
              fontSizes: [
                { name: 'S',  slug: 's',  size: '1.5rem' },
                { name: 'M',  slug: 'm',  size: '2rem'   },
                { name: 'L',  slug: 'l',  size: '2.5rem' },
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

          el(BaseControl, {
            label: __('Description size', 'wpff-slider'),
            __nextHasNoMarginBottom: true
          },
            el(FontSizePicker, {
              fontSizes: [
                { name: 'S',  slug: 's',  size: '0.875rem' },
                { name: 'M',  slug: 'm',  size: '1rem'     },
                { name: 'L',  slug: 'l',  size: '1.25rem'  },
                { name: 'XL', slug: 'xl', size: '1.5rem'   }
              ],
              value: attributes.descriptionFontSize,
              onChange: function (v) {
                setAttributes({ descriptionFontSize: v === undefined ? '1rem' : v })
              },
              withReset: true,
              disableCustomFontSizes: false
            })
          ),

          el(BaseControl, {
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

          el(BaseControl, {
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

          // Compact image picker
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
                    el(Button, {
                      variant: 'secondary',
                      isSmall: true,
                      onClick: ref.open
                    }, __('Replace image', 'wpff-slider'))
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

          // Text fields
          el(TextControl, {
            label: __('Heading', 'wpff-slider'),
            value: slide.heading,
            placeholder: __('Optional heading', 'wpff-slider'),
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
          }),
          el(TextControl, {
            label: __('Link URL', 'wpff-slider'),
            value: slide.linkUrl,
            type: 'url',
            placeholder: 'https://',
            onChange: function (v) {
              updateSlide(idx, 'linkUrl', v)
            }
          }),

          // Open in new tab — only shown when a URL is present
          slide.linkUrl
            ? el(CheckboxControl, {
                label: __('Open in new tab', 'wpff-slider'),
                checked: !!slide.linkNewTab,
                onChange: function (v) {
                  updateSlide(idx, 'linkNewTab', v)
                }
              })
            : null
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
