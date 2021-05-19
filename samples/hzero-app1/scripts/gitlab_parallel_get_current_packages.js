const path = require('path');
const fs = require('fs');

const hzercConfig = require('../.hzerorc.js');

const packageList = hzercConfig.packages.map((item) => item.name);

if (fs.existsSync(path.join(__dirname, '../.hzerorc.json'))) {
  const hzercJson = require('../.hzerorc.json');
  if (hzercJson && hzercJson.packages) {
    hzercJson.packages.forEach((item) => {
      if (!packageList.includes(item.name)) {
        packageList.push(item.name);
      }
    });
  }
}

// CI_NODE_INDEX CI_NODE_TOTAL 由gitlab-ci提供
// https://docs.gitlab.com/ee/ci/variables/predefined_variables.html
// CI_NODE_TOTAL 为 parallel 的值
// CI_NODE_INDEX 为当前是第几台机器 根据这两个参数进行一个打包的平均分配
const ciNodeTotal = +(process.env.CI_NODE_TOTAL || 1);
const ciNodeIndex = +(process.env.CI_NODE_INDEX || 1);

const buildPackageList = packageList.filter((_, index) => index % ciNodeTotal === ciNodeIndex - 1);

console.log(buildPackageList.join(','));
