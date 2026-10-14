import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive:true });
fs.cpSync(path.join(root, 'site'), dist, { recursive:true });
for (const file of ['index.html', 'story.html', 'quantum-field.js', 'quantum-math.js', 'field-loader.js', 'main.js', 'styles.css', 'site-config.js', 'particle-sources.json', 'vendor/three.min.js', 'CNAME']) {
  if (!fs.existsSync(path.join(dist, file))) throw new Error('Missing export ' + file);
}
console.log('Exported index.html, story.html, modules, and assets to dist/.');
