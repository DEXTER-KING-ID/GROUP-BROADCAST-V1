const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PRIVATE_REPO = 'DEXTER-KING-ID/GROUP-BROADCAST-SYSTEM';
const REPO_NAME = PRIVATE_REPO.split('/')[1]; // ➜ 'GROUP-BROADCAST-SYSTEM'
const BRANCH = 'main';
const CLONE_DIR = path.resolve(__dirname, REPO_NAME);
const AUTO_UPDATE = process.env.AUTO_UPDATE === 'true';

// Colors
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;
const blue = (msg) => `\x1b[36m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`;

console.log(bold(green('\n🌟 DEXTER BOT STARTING...\n')));

function cloneRepo() {
  console.log(blue(`📥 Cloning repo '${REPO_NAME}' into ${CLONE_DIR}...`));
  execSync(`git clone -b ${BRANCH} https://${GITHUB_TOKEN}@github.com/${PRIVATE_REPO}.git`, {
    cwd: __dirname,
    stdio: 'inherit',
  });
}

function installPackages() {
  const packageJsonPath = path.join(CLONE_DIR, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    console.log(blue('📦 Installing npm packages...'));
    execSync('npm install', { cwd: CLONE_DIR, stdio: 'inherit' });
    console.log(green('✅ Packages installed successfully.\n'));
  } else {
    console.log(yellow('⚠️ No package.json found. Skipping npm install.\n'));
  }
}

function updateRepo() {
  console.log(blue('🔄 Checking for updates...'));
  const oldHash = execSync(`git -C ${CLONE_DIR} rev-parse HEAD`).toString().trim();

  execSync(`git -C ${CLONE_DIR} fetch`, { stdio: 'ignore' });
  const status = execSync(`git -C ${CLONE_DIR} diff --name-only HEAD origin/${BRANCH}`).toString();

  if (status.trim() === '') {
    console.log(green('✅ No updates found. Bot is up-to-date.'));
    return false;
  }

  console.log(yellow('\n📂 Files updated:'));
  status.split('\n').forEach(file => {
    if (file.trim()) console.log('   → ' + yellow(file.trim()));
  });

  execSync(`git -C ${CLONE_DIR} pull`, { stdio: 'inherit' });

  const newHash = execSync(`git -C ${CLONE_DIR} rev-parse HEAD`).toString().trim();
  return oldHash !== newHash;
}

function writeEnvFile() {
  const envContent = `SESSION_ID=${process.env.SESSION_ID}
OWNER_NUMBER=${process.env.OWNER_NUMBER}
`;
  fs.writeFileSync(path.join(CLONE_DIR, '.env'), envContent);
  console.log(blue('🧾 .env file written to bot directory.\n'));
}

// === EXECUTION ===
if (!fs.existsSync(CLONE_DIR)) {
  cloneRepo();
  writeEnvFile();
  installPackages();
} else if (AUTO_UPDATE) {
  const updated = updateRepo();
  if (updated) {
    writeEnvFile();
    installPackages();
    console.log(red('\n🔁 Update detected. Restarting bot...\n'));
    process.exit(1);
  }
} else {
  console.log(yellow('⚠️ Repo exists. AUTO_UPDATE is off.\n'));
}

writeEnvFile();

// === Dynamically run the correct startup file ===
const possibleEntryFiles = ['index.js', 'running.js', 'start.js'];

let entryFound = false;
for (const file of possibleEntryFiles) {
  const fullPath = path.join(CLONE_DIR, file);
  if (fs.existsSync(fullPath)) {
    console.log(green(`🚀 Launching: ${file}\n`));
    require(fullPath);
    entryFound = true;
    break;
  }
}

if (!entryFound) {
  console.log(red('❌ No entry file found in cloned repo! Expected one of: index.js, running.js, start.js'));
  process.exit(1);
}
