const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PRIVATE_REPO = 'DEXTER-KING-ID/GROUP-BROADCAST-SYSTEM';
const BRANCH = 'main';
const CLONE_DIR = './DEXTER';
const AUTO_UPDATE = process.env.AUTO_UPDATE === 'true';

// Color Functions
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;
const blue = (msg) => `\x1b[36m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`;

console.log(bold(green('\n🌟 DEXTER BOT STARTING...\n')));

function cloneRepo() {
  console.log(blue('📥 Cloning private bot repo...'));
  execSync(`git clone -b ${BRANCH} https://${GITHUB_TOKEN}@github.com/${PRIVATE_REPO}.git ${CLONE_DIR}`, {
    stdio: 'inherit',
  });
}

function updateRepo() {
  console.log(blue('🔄 Checking for updates...'));
  const oldHash = execSync(`git -C ${CLONE_DIR} rev-parse HEAD`).toString().trim();

  // Fetch + log status
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

  // Pull changes
  execSync(`git -C ${CLONE_DIR} pull`, { stdio: 'inherit' });

  const newHash = execSync(`git -C ${CLONE_DIR} rev-parse HEAD`).toString().trim();
  return oldHash !== newHash;
}

function writeEnvFile() {
  const envContent = `SESSION_ID=${process.env.SESSION_ID}
OWNER_NUMBER=${process.env.OWNER_NUMBER}
`;
  fs.writeFileSync(`${CLONE_DIR}/.env`, envContent);
  console.log(blue('🧾 .env file written to bot directory.\n'));
}

// === EXECUTION ===
if (!fs.existsSync(CLONE_DIR)) {
  cloneRepo();
  writeEnvFile();
} else if (AUTO_UPDATE) {
  const updated = updateRepo();
  if (updated) {
    writeEnvFile();
    console.log(red('\n🔁 Update detected. Restarting bot...\n'));
    process.exit(1); // Triggers auto-restart
  }
} else {
  console.log(yellow('⚠️ Repo exists. AUTO_UPDATE is off.\n'));
}

writeEnvFile();
require(path.resolve(CLONE_DIR, 'index.js'));
