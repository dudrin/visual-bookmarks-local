const fs = require('fs'), path = require('path'), archiver = require('archiver')
const root = path.join(__dirname,'..'), dist = path.join(root,'dist')
const pkg = require(path.join(root,'package.json'))
const out = path.join(root,'releases',`visual-bookmarks-${pkg.version}.zip`)
if(!fs.existsSync(dist)){console.error('Run build first'); process.exit(1)}
fs.mkdirSync(path.dirname(out),{recursive:true})
const output=fs.createWriteStream(out); const zip=archiver('zip',{zlib:{level:9}})
output.on('close',()=>console.log('ZIP',out,zip.pointer()))
zip.on('error',e=>{throw e}); zip.pipe(output); zip.directory(dist,false); zip.finalize()
