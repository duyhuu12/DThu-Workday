import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [
  spawn(npmCommand, ['run', 'dev', '--prefix', 'BE'], { stdio: 'inherit', shell: false }),
  spawn(npmCommand, ['run', 'dev', '--prefix', 'FE'], { stdio: 'inherit', shell: false }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 300);
}

for (const child of processes) {
  child.on('exit', (code) => {
    if (!stopping && code && code !== 0) stop(code);
  });
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
