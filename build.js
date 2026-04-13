import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const files = [
  ['assets/js/wpff-slider.js',             'assets/js/wpff-slider.min.js'],
  ['blocks/wpff-slider/editor.js',          'blocks/wpff-slider/editor.min.js'],
  ['assets/css/wpff-slider.css',            'assets/css/wpff-slider.min.css'],
  ['assets/css/wpff-slider-editor.css',     'assets/css/wpff-slider-editor.min.css'],
]

async function main() {
  const contexts = await Promise.all(
    files.map(([entry, outfile]) =>
      esbuild.context({ entryPoints: [entry], outfile, minify: true })
    )
  )

  if (watch) {
    await Promise.all(contexts.map(ctx => ctx.watch()))
    console.log('Watching for changes...')
    files.forEach(([entry, outfile]) => console.log(' ', entry, '→', outfile))
  } else {
    await Promise.all(contexts.map(ctx => ctx.rebuild()))
    await Promise.all(contexts.map(ctx => ctx.dispose()))
    console.log('Build complete:')
    files.forEach(([, outfile]) => console.log(' ', outfile))
  }
}

main().catch(() => process.exit(1))
