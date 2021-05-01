const { ESLint } = require("eslint");
const dependencyTree = require('dependency-tree');
const path = require('path');
const fs = require('fs');
const walk = require('walkdir');
const byteSize = require('byte-size');
const chalk = require('chalk')

 const parse = async (directory, options) => {
  
   const cwd = path.resolve(__dirname, options.cwd);
   const rootDir = path.resolve(__dirname, directory);
   const baseDir = path.resolve(__dirname, options.dir);

   console.log(`Using ${chalk.blue(cwd)} ESLint working directory`);
   console.log(`Using ${chalk.blue(rootDir)} root directory`);
   console.log(`Using ${chalk.blue(baseDir)} base directory`);
  

  const filesInDir = [];

  walk.sync(rootDir, (filePath, stat) => {
    if (
      filePath.indexOf('node_modules') !== -1 ||
      filePath.indexOf('.next') !== -1 ||
      filePath.indexOf('.git') !== -1 ||
      filePath.indexOf('images') !== -1 ||
      filePath.indexOf('api') !== -1) {
      return;
    }

    const ext = path.extname(filePath).replace('.', '');

    if (filesInDir.indexOf(filePath) === -1 && ext === 'js') {
      filesInDir.push(filePath);
    }
  });

  const visited = {};
  const tree = {};

  console.log(`Found files: ${chalk.blue(JSON.stringify(filesInDir, null, 2))}`);

  filesInDir.forEach(file => {
    if (visited[file]) {
      return;
    }

    Object.assign(tree, dependencyTree({
      filename: file,
      directory: baseDir,
      filter: p => p.indexOf('node_modules') === -1 && path.extname(p) !== '.css' && p.indexOf('images') === -1,
      visited,
    }))
  });

  

  const eslint = new ESLint({
     fix: false, 
     extensions: ['.js'], 
     cwd,
  });

  const results = await eslint.lintFiles(path.join(cwd, "**/*.js"));

  const report = results;

  const reportMap = report.reduce((acc, item) => {
    const { source, usedDeprecatedRules, filePath, ...rest } = item;
    acc[item.filePath] = rest;
    return acc;
  }, {});


  let newTree = [];


  const traverse = (obj, res, parentName=null, depth=0) => {
    for (let k in obj) {

      const { size } = fs.statSync(k);

      const fileName = path.basename(k);

      const node = {
        path: k,
        fileName,
        fileSize: `${byteSize(size)}`, 
        parent: parentName, 
        depth
      };

      if (reportMap[k]) {
        Object.assign(node, reportMap[k]);
      };

      res.push(node);

      if (obj[k] && typeof obj[k] === 'object' && Object.keys(obj[k]).length) {
        traverse(obj[k], res, k, depth + 1)
      }
    }
  }

  traverse(tree, newTree);

  console.log(`Saving report to ${chalk.blue(options.output)}`);
  fs.writeFile(options.output, JSON.stringify(newTree, null, 2), (err, res) => { });


}


module.exports = parse;