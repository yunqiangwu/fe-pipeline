const path = require('path');
const fs = require('fs');

const distDir = path.join(__dirname, '../dist');
const distPackagesDir = path.join(distDir, 'packages');

const packageList = fs
  .readdirSync(distPackagesDir)
  .filter((item) => fs.existsSync(path.join(distPackagesDir, `${item}/package.json`)));

const microConfig = packageList.reduce((result, current) => {
  const packageInfoFile = path.join(distPackagesDir, `${current}/package.json`);
  const packageInfo = require(packageInfoFile);
  delete packageInfo.commitHash;
  delete packageInfo.version;
  result[packageInfo.name] = packageInfo;
  return result;
}, {});

const microConfigFilePath = path.join(distPackagesDir, 'microConfig.json');

fs.writeFileSync(microConfigFilePath, JSON.stringify(microConfig));

console.log(microConfig);
