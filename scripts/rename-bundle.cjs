const fs = require('fs');
const path = require('path');

// bundle 输出目录
const bundleDir = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle');

// 从 tauri.conf.json 读取版本号和产品名
const tauriConfig = require(path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json'));
const productName = tauriConfig.productName;
const version = tauriConfig.version;

console.log(`\n📦 开始重命名打包文件...`);
console.log(`   产品名: ${productName}, 版本: ${version}\n`);

// 需要重命名的规则：[匹配正则, 目标文件名]
const renameRules = [
  // MSI: passvault_0.1.0_x64_en-US.msi -> passvault_0.1.0_x64.msi
  {
    dir: path.join(bundleDir, 'msi'),
    match: new RegExp(`^${productName}_${version}_x64_.*\\.msi$`),
    target: `${productName}_${version}_x64.msi`,
  },
  // EXE(NSIS): passvault_0.1.0_x64-setup.exe -> passvault_0.1.0_x64.exe
  {
    dir: path.join(bundleDir, 'nsis'),
    match: new RegExp(`^${productName}_${version}_x64-setup\\.exe$`),
    target: `${productName}_${version}_x64.exe`,
  },
];

let renamed = 0;

for (const rule of renameRules) {
  if (!fs.existsSync(rule.dir)) {
    console.log(`⚠️  目录不存在，跳过: ${rule.dir}`);
    continue;
  }

  const files = fs.readdirSync(rule.dir);
  for (const file of files) {
    if (rule.match.test(file)) {
      const oldPath = path.join(rule.dir, file);
      const newPath = path.join(rule.dir, rule.target);
      // 如果目标文件名与源文件名相同则跳过
      if (file === rule.target) {
        console.log(`✅ 已符合命名规则，跳过: ${file}`);
        continue;
      }
      // 如果目标文件已存在则先删除
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }
      fs.renameSync(oldPath, newPath);
      console.log(`✅ 重命名: ${file} -> ${rule.target}`);
      renamed++;
    }
  }
}

if (renamed === 0) {
  console.log(`ℹ️  没有需要重命名的文件`);
} else {
  console.log(`\n🎉 重命名完成，共 ${renamed} 个文件\n`);
}
