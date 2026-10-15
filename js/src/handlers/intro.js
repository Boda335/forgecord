const boxen = require('boxen').default;
const gradient = require('gradient-string').default;
const chalk = require('chalk').default;

const coolGradient = gradient(['#00fffe', '#f30dff']);
async function intro() {
  const asciiArt = `
 ______ ____  _____   _____ ______ _____ ____  _____  _____  
|  ____/ __ \\|  __ \\ / ____|  ____/ ____/ __ \\|  __ \\|  __ \\ 
| |__ | |  | | |__) | |  __| |__ | |   | |  | | |__) | |  | |
|  __|| |  | |  _  /| | |_ |  __|| |   | |  | |  _  /| |  | |
| |   | |__| | | \\ \\| |__| | |___| |___| |__| | | \\ \\| |__| |
|_|    \\____/|_|  \\_\\\\_____|______\\_____\\____/|_|  \\_\\_____/ 
                                                             
                                                             
`;

  const footerText = chalk.bold('Forgecord v1.0.0 | The Ultimate Discord Bot toolkit!');

  const message = `${coolGradient.multiline(asciiArt)}\n${footerText}`;

  console.log(
    boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'doubleSingle',
      borderColor: 'green',
      textAlignment: 'center',
    })
  );
}

module.exports = intro;
