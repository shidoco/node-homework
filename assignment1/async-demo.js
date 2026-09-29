const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration

const sampleDir = path.join(__dirname, 'sample-files');
const sampleFile = path.join(sampleDir, 'sample.txt');

fs.mkdirSync(sampleDir, { recursive: true});
fs.writeFileSync(sampleFile, 'Hello, async world!', 'utf8');

// 1. Callback style

fs.readFile(sampleFile, 'utf8', (error, data) => {
  if (error) {
    console.error('Callback error:', error.message);
    return;
  }

  console.log('Callback:', data);
})

  // Callback hell example (test and leave it in comments):

  //fs.readFile('first.txt', 'utf8', (error, firstText) => {
  //if (error) return console.error(error);

  //fs.readFile('second.txt', 'utf8', (error, secondText) => {
    //if (error) return console.error(error);

    //fs.readFile('third.txt', 'utf8', (error, thirdText) => {
      //if (error) return console.error(error);

      //console.log(firstText, secondText, thirdText);
    //});
  //});
//});

  // 2. Promise style

  function readTextFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
      });
    });
  }
  
  readTextFile(sampleFile)
    .then((data) => {
      console.log('Promise:', data);
    })
    .catch((error) => {
      console.error('Promise error:', error.message);
    });

      // 3. Async/Await style
    
      async function run() {
        try {
          const data = await readTextFile(sampleFile);
          console.log('Async/Await:', data)
        } catch (error) {
          console.error('Async/Await error:', error.message);
        }
    }

    run();


    