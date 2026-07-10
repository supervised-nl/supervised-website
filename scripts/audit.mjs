import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(process.argv[2] || 'public');
const repo = resolve(process.argv[3] || '.');
const failures = [];
const warnings = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function fail(message) {
  failures.push(message);
}

function publicTargetExists(url) {
  const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const target = join(root, pathname);
  return existsSync(target)
    || existsSync(`${target}.html`)
    || existsSync(join(target, 'index.html'));
}

const files = walk(root);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
let jsonLdBlocks = 0;
let internalTargets = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const size = Buffer.byteLength(html);
  if (size > 30_000) warnings.push(`${file.slice(root.length + 1)} is ${size} bytes HTML (target: 30 KB)`);
  if (size > 32_000) fail(`${file.slice(root.length + 1)} exceeds the 32 KB HTML ceiling`);

  for (const match of html.matchAll(/<script type=application\/ld\+json>([\s\S]*?)<\/script>/g)) {
    jsonLdBlocks += 1;
    try {
      JSON.parse(match[1]);
    } catch (error) {
      fail(`${file.slice(root.length + 1)} contains invalid JSON-LD: ${error.message}`);
    }
  }

  for (const match of html.matchAll(/(?:href|src)=["']?([^"'\s>]+)/g)) {
    const url = match[1];
    if (!url.startsWith('/') || url.startsWith('//') || url.startsWith('/_vercel/') || url === '/plan') continue;
    internalTargets += 1;
    if (!publicTargetExists(url)) fail(`${file.slice(root.length + 1)} references missing target ${url}`);
  }
}

const homepage = readFileSync(join(root, 'index.html'), 'utf8');
const cssUrl = homepage.match(/href=([^\s>]+\/css\/[^\s>]+\.css)|href=(\/css\/[^\s>]+\.css)/)?.[1]
  || homepage.match(/href=(\/css\/[^\s>]+\.css)/)?.[1];
const siteJsUrl = homepage.match(/src=(\/js\/site\.[^\s>]+\.js)/)?.[1];
const heroUrl = homepage.match(/<div class=hero-image><img src=(\/img\/profile_picture_[^\s>]+)/)?.[1];

for (const [label, url] of [['CSS', cssUrl], ['site JavaScript', siteJsUrl], ['hero image', heroUrl]]) {
  if (!url) fail(`Could not find the homepage ${label} asset`);
}

const cssPath = cssUrl && join(root, cssUrl);
const siteJsPath = siteJsUrl && join(root, siteJsUrl);
const heroPath = heroUrl && join(root, heroUrl);
if (cssPath && statSync(cssPath).size > 30_000) fail('Minified CSS exceeds 30 KB');
if (siteJsPath && statSync(siteJsPath).size > 5_000) fail('Minified site JavaScript exceeds 5 KB');

const fontPath = join(root, 'fonts/GeneralSans-Variable.woff2');
if (cssPath && siteJsPath && heroPath && existsSync(fontPath)) {
  const firstLoad = [join(root, 'index.html'), cssPath, siteJsPath]
    .reduce((total, file) => total + gzipSync(readFileSync(file)).length, 0)
    + statSync(fontPath).size
    + statSync(heroPath).size;
  if (firstLoad > 150_000) fail(`Estimated homepage first load is ${firstLoad} bytes (limit: 150 KB)`);
  console.log(`Estimated homepage first load: ${firstLoad} bytes`);
}

const inlineTheme = homepage.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const vercelConfig = readFileSync(join(repo, 'vercel.json'), 'utf8');
if (!inlineTheme) {
  fail('Could not find the inline theme script');
} else {
  const hash = createHash('sha256').update(inlineTheme).digest('base64');
  if (!vercelConfig.includes(`sha256-${hash}`)) fail('The inline theme script CSP hash is stale');
}

console.log(`Checked ${htmlFiles.length} HTML files, ${jsonLdBlocks} JSON-LD blocks and ${internalTargets} internal references.`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`Error: ${failure}`);
  process.exit(1);
}
console.log('Technical audit passed.');
