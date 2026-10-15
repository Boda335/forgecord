import boxen from 'boxen';
import gradient from 'gradient-string';
import chalk from 'chalk';

const coolGradient = gradient(['#00fffe', '#f30dff']);

export default async function intro(): Promise<void> {
  const asciiArt = `
 ______ ____  _____   _____ ______ _____ ____  _____  _____  
|  ____/ __ \\|  __ \\ / ____|  ____/ ____/ __ \\|  __ \\|  __ \\ 
| |__ | |  | | |__) | |  __| |__ | |   | |  | | |__) | |  | |
|  __|| |  | |  _  /| | |_ |  __|| |   | |  | |  _  /| |  | |
| |   | |__| | | \\ \\| |__| | |___| |___| |__| | | \\ \\| |__| |
|_|    \\____/|_|  \\_\\\\_____|______\\_____\\____/|_|  \\_\\_____/ 
                                                             
                                                             
`;

  const footerText = chalk.bold('Forgecord v1.0.0 (TypeScript) | The Ultimate Discord Bot toolkit!');
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
