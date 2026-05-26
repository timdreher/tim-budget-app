import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'fs'

// App icon: dark blue background, green coin ring, € arc
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1F4E79" rx="96"/>
  <circle cx="256" cy="256" r="152" fill="none" stroke="#70AD47" stroke-width="36"/>
  <path d="M 330 190 A 100 100 0 0 0 220 256 A 100 100 0 0 0 330 322"
    stroke="white" stroke-width="34" fill="none" stroke-linecap="round"/>
  <line x1="194" y1="234" x2="290" y2="234"
    stroke="white" stroke-width="28" stroke-linecap="round"/>
  <line x1="194" y1="278" x2="290" y2="278"
    stroke="white" stroke-width="28" stroke-linecap="round"/>
</svg>`

const sizes = [
  { size: 512, file: 'public/pwa-512x512.png' },
  { size: 192, file: 'public/pwa-192x192.png' },
  { size: 180, file: 'public/apple-touch-icon.png' },
  { size: 32,  file: 'public/favicon.png' },
]

for (const { size, file } of sizes) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  writeFileSync(file, resvg.render().asPng())
  console.log(`✓ ${file} (${size}×${size})`)
}
