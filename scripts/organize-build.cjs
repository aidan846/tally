const fs = require('node:fs/promises');
const path = require('node:path');

const INSTALLER_EXTENSIONS = new Set(['.dmg', '.exe', '.appimage']);

async function moveItem(source, destinationDirectory) {
  await fs.mkdir(destinationDirectory, { recursive: true });
  const destination = path.join(destinationDirectory, path.basename(source));
  await fs.rm(destination, { recursive: true, force: true });
  await fs.rename(source, destination);
}

exports.afterAllArtifactBuild = async function organizeBuild(buildResult) {
  const outputDirectory = buildResult.outDir;
  const installerDirectory = path.join(outputDirectory, 'installer');
  const extrasDirectory = path.join(outputDirectory, 'extra');

  for (const artifactPath of buildResult.artifactPaths) {
    try {
      await fs.access(artifactPath);
    } catch {
      continue;
    }
    const extension = path.extname(artifactPath).toLowerCase();
    await moveItem(artifactPath, INSTALLER_EXTENSIONS.has(extension) ? installerDirectory : extrasDirectory);
  }

  const entries = await fs.readdir(outputDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'installer' || entry.name === 'extra') continue;
    await moveItem(path.join(outputDirectory, entry.name), extrasDirectory);
  }

  return [];
};

if (require.main === module) {
  const outputDirectory = process.argv[2];
  if (!outputDirectory) {
    throw new Error('Usage: node scripts/organize-build.cjs <build-output-directory>');
  }
  exports.afterAllArtifactBuild({ outDir: path.resolve(outputDirectory), artifactPaths: [] }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
