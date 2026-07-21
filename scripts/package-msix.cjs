const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const packageJson = require(path.join(__dirname, '..', 'package.json'));
const appxConfig = packageJson.build.appx;

const root = path.join(__dirname, '..');
const arch = process.env.MSIX_ARCH || 'x64';
const processorArchitecture = arch === 'x86' ? 'x86' : 'x64';
const msixVersion = `${packageJson.version}.0`;
const unpackedFolder = arch === 'x86' ? 'win-ia32-unpacked' : 'win-unpacked';
const unpacked = path.join(root, 'build', `msix-unpacked-${arch}`, 'extra', unpackedFolder);
const stage = path.join(root, 'build', `msix-stage-${arch}`);
const output = path.join(root, 'build', 'msix', `Tally-${packageJson.version}-${arch}.msix`);
const windowsKitRoots = [
  process.env['ProgramFiles(x86)'],
  process.env.ProgramFiles
].filter(Boolean).map(programFiles => path.join(programFiles, 'Windows Kits', '10', 'bin'));
const windowsKitCandidates = windowsKitRoots.flatMap(binRoot => {
  if (!fs.existsSync(binRoot)) return [];
  return fs.readdirSync(binRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^\d+\.\d+\.\d+\.\d+$/.test(entry.name))
    .sort((left, right) => right.name.localeCompare(left.name, undefined, { numeric: true }))
    .flatMap(entry => [
      path.join(binRoot, entry.name, 'x64', 'makeappx.exe'),
      path.join(binRoot, entry.name, 'x86', 'makeappx.exe')
    ]);
});
const makeAppxCandidates = [
  process.env.MAKEAPPX_PATH,
  path.join(root, 'build', 'builder-cache', 'winCodeSign-2.6.0', 'windows-10', 'x64', 'makeappx.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'electron-builder', 'Cache', 'winCodeSign', 'windows-10', 'x64', 'makeappx.exe'),
  ...windowsKitCandidates
].filter(Boolean);
const makeAppx = makeAppxCandidates.find(file => fs.existsSync(file));

if (!makeAppx) throw new Error('makeappx.exe was not found. Install the Windows SDK or set MAKEAPPX_PATH.');
if (!fs.existsSync(unpacked)) throw new Error(`Unpacked app not found at ${unpacked}`);

fs.rmSync(stage, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
fs.mkdirSync(path.join(stage, 'app'), { recursive: true });
fs.mkdirSync(path.join(stage, 'Assets'), { recursive: true });
fs.cpSync(unpacked, path.join(stage, 'app'), { recursive: true });
for (const name of ['StoreLogo.png', 'Square150x150Logo.png', 'Square44x44Logo.png']) {
  fs.copyFileSync(path.join(root, 'src', 'assets', 'icon.png'), path.join(stage, 'Assets', name));
}

fs.writeFileSync(path.join(stage, 'AppxManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10" xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities">
  <Identity Name="${appxConfig.identityName}" ProcessorArchitecture="${processorArchitecture}" Publisher="${appxConfig.publisher}" Version="${msixVersion}" />
  <Properties>
    <DisplayName>Tally | Smart Calculator</DisplayName>
    <PublisherDisplayName>aidan846</PublisherDisplayName>
    <Description>A simple calculator for your daily tasks.</Description>
    <Logo>Assets\\StoreLogo.png</Logo>
  </Properties>
  <Resources><Resource Language="en-us" /></Resources>
  <Dependencies><TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22631.0" /></Dependencies>
  <Capabilities><rescap:Capability Name="runFullTrust" /></Capabilities>
  <Applications>
    <Application Id="Tally" Executable="app\\Tally.exe" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="Tally | Smart Calculator" Description="A simple calculator for your daily tasks." Square150x150Logo="Assets\\Square150x150Logo.png" Square44x44Logo="Assets\\Square44x44Logo.png" BackgroundColor="#111827" />
    </Application>
  </Applications>
</Package>`);

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.rmSync(output, { force: true, maxRetries: 5, retryDelay: 200 });
const pack = new Promise((resolve, reject) => {
  const child = spawn(makeAppx, ['pack', '/d', stage, '/p', output, '/o'], { cwd: root, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`makeappx exited with code ${code}`)));
});
pack.then(() => {
  console.log(`MSIX built at ${output}`);
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
