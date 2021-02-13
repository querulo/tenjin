const fs = require('fs')



function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest)

  let fileNames = fs.readdirSync(src)
  let filePaths = fileNames.map(file => src + '/' + file)
  let newFilePaths = fileNames.map(file => dest + '/' + file)

  for (let i = 0; i < filePaths.length; i++) {
    let stat = fs.statSync(filePaths[i])
    if (stat.isDirectory()) {
      copyDirRecursive(filePaths[i], newFilePaths[i])
    } else {
      fs.copyFileSync(filePaths[i], newFilePaths[i])
    }
  }
}



module.exports = { copyDirRecursive }