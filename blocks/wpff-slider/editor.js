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

  function uid() {
    return Math.random().toString(36).slice(2, 9)
  }

  // -------------------------------------------------------------------------
  // Block registration
  // -------------------------------------------------------------------------

  registerBlockType('wpff-slider/slider', {
    title: __('Ken Burns Slider', 'wpff-slider'),
    description: __('Full-width image slider with Ken Burns pan-and-zoom effect.', 'wpff-slider'),
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
      sliderHeightMobile: { type: 'string', default: '' }
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

        )
      )

      /* ---- slide cards ---- */

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

          // Image picker
          el(
            MediaUploadCheck,
            null,
            el(MediaUpload, {
              onSelect: function (media) {
                // All three fields must go in one setAttributes call.
                // Separate calls each read the stale `slides` snapshot
                // and overwrite each other, leaving imageUrl empty.
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
                    null,
                    el(
                      'div',
                      { className: 'wpff-slide-card__preview', style: { height: attributes.sliderHeight || '600px' } },
                      el('img', {
                        src: slide.imageUrl,
                        alt: slide.imageAlt,
                        className: 'wpff-slide-card__thumb',
                        style: { objectPosition: attributes.objectPosition || 'center center' }
                      }),
                      (slide.heading || slide.description || slide.linkUrl)
                        ? el(
                            'div',
                            { className: 'wpff-slide-card__overlay' },
                            slide.heading
                              ? el('strong', { className: 'wpff-slide-card__overlay-heading' }, slide.heading)
                              : null,
                            slide.description
                              ? el('span', { className: 'wpff-slide-card__overlay-desc' }, slide.description)
                              : null,
                            slide.linkUrl
                              ? el('span', { className: 'wpff-slide-card__overlay-link' }, slide.linkUrl)
                              : null
                          )
                        : null
                    ),
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
            label: __('Ken Burns Slider', 'wpff-slider'),
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
