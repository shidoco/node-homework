const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module

const cpus = os.cpus();

console.log('Platform:', os.platform());
console.log('CPU:', cpus[0].model);
console.log('Total Memory:', os.totalmem());

// Path module

console.log('Joined path:', path.join(__dirname, 'sample-files', 'folder', 'file.txt'))

// fs.promises API

async function writeAndReadDemoFile() {
  const demoFile = path.join(sampleFilesDir, 'demo.txt');

  try {
    await fs.promises.writeFile(demoFile, 'Hello from fs.promises!', 'utf8');
    const contents = await fs.promises.readFile(demoFile, 'utf8');
    console.log('fs.promises read:', contents);
  } catch (error) {
    console.error('File error:', error.message);
  }
}

writeAndReadDemoFile();

// Streams for large files- log first 40 chars of each chunk
