import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageJsonPath = resolve(root, 'package.json');
const packageLockPath = resolve(root, 'package-lock.json');
const tauriConfigPath = resolve(root, 'src-tauri/tauri.conf.json');
const cargoTomlPath = resolve(root, 'src-tauri/Cargo.toml');
const indexHtmlPath = resolve(root, 'src/index.html');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`package.json has an invalid semantic version: ${version}`);
}

const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));
tauriConfig.version = version;
writeFileSync(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);

const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
packageLock.version = version;
packageLock.packages ??= {};
packageLock.packages[''] ??= {};
packageLock.packages[''].version = version;
writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);

const cargoToml = readFileSync(cargoTomlPath, 'utf8');
const cargoVersionPattern = /(\[package\][\s\S]*?\nversion = ")[^"]+(")/;
if (!cargoVersionPattern.test(cargoToml)) {
  throw new Error('Could not find the package version in src-tauri/Cargo.toml');
}
const updatedCargoToml = cargoToml.replace(cargoVersionPattern, `$1${version}$2`);
writeFileSync(cargoTomlPath, updatedCargoToml);

const indexHtml = readFileSync(indexHtmlPath, 'utf8');
const indexVersionPattern = /(meta name="tally-version" content=")[^"]+(")/;
if (!indexVersionPattern.test(indexHtml)) {
  throw new Error('Could not find tally-version metadata in src/index.html');
}
const updatedIndexHtml = indexHtml.replace(indexVersionPattern, `$1${version}$2`);
writeFileSync(indexHtmlPath, updatedIndexHtml);

console.log(`Synced project version to ${version}`);
