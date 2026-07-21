const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = path.join(root, 'src');
const output = path.join(root, 'build', 'pwa');
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });
fs.mkdirSync(path.join(output, 'mathjs'), { recursive: true });
fs.copyFileSync(path.join(root, 'node_modules', 'mathjs', 'lib', 'browser', 'math.js'), path.join(output, 'mathjs', 'math.js'));

const units = fs.readdirSync(path.join(source, 'units')).filter(file => file.endsWith('.js')).map(file => {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(source, 'units', file), 'utf8'), { module, exports: module.exports });
  return module.exports;
});
fs.writeFileSync(path.join(output, 'units.json'), JSON.stringify(units));

const htmlPath = path.join(output, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8').replace('../node_modules/mathjs/lib/browser/math.js', 'mathjs/math.js');
html = html.replace('<script type="module" src="renderer.js"></script>', '<script src="pwa-api.js"></script>\n  <script type="module" src="renderer.js"></script>');
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(path.join(output, 'manifest.webmanifest'), JSON.stringify({ name: 'Tally', short_name: 'Tally', start_url: './', display: 'standalone', background_color: '#111827', theme_color: '#111827', icons: [{ src: 'assets/icon.png', sizes: '512x512', type: 'image/png' }] }, null, 2));
fs.writeFileSync(path.join(output, 'sw.js'), `const CACHE = 'tally-v2'; self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['./', './index.html', './index.css', './renderer.js', './pwa-api.js', './mathjs/math.js'])))); self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { if (event.request.method === 'GET' && new URL(event.request.url).origin === location.origin) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); } return response; }))));`);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
fs.writeFileSync(htmlPath, fs.readFileSync(htmlPath, 'utf8').replace('</head>', '  <link rel="manifest" href="manifest.webmanifest">\n</head>').replace('</body>', '  <script>if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");</script>\n</body>'));
console.log(`PWA built at ${output}`);
