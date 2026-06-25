const { spawn, execSync } = require('child_process');

execSync('npm run build', { stdio: 'inherit' });

const processes = [
  spawn('npx', ['tsc', '--watch'], { stdio: 'inherit', shell: true }),
  spawn('node', ['--env-file=./config/.env', '--watch', './dist/index.js'], {
    stdio: 'inherit',
    shell: true,
  }),
];

const shutdown = () => {
  processes.forEach((proc) => proc.kill());
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
