

const commander = require('commander');
const parse = require('./parser');

commander
  .storeOptionsAsProperties(false)
  .description(require('./package.json').description)
  .version(require('./package.json').version, '-v')
  .usage('[options] <file ...>')
  .option(
    '-cwd, --cwd <cwd>',
    'ESLint working directory',
  )
  .option(
    '-o, --output <path>',
    'Report output path',
  )
  .on('--help', function () {
    console.log('');
    console.log('Examples:');
    console.log('    # Parse specific folder');
    console.log('    $ debt-visualized src/lib');
    console.log('');
  })
  .parse(process.argv);



const main = (commander) => {

  if (commander.args && commander.args.length > 0) {
    return parse(commander.args[0], commander.opts());
  }

};

main(commander);

