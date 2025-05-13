const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// === 🔐 Configuration ===
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PRIVATE_REPO = 'DEXTER-KING-ID/GROUP-BROADCAST-SYSTEM';
const BRANCH = 'main';
const TEMP_DIR = './temp_repo';
const AUTO_UPDATE = process.env.AUTO_UPDATE === 'true';

const ENTRY_FILES = ['index.js', 'start.js', 'running.js', 'bot.js'];

// === CLI Colors ===
const green = msg => `\x1b[32m${msg}\x1b[0m`;
const yellow = msg => `\x1b[33m${msg}\x1b[0m`;
const blue = msg => `\x1b[36m${msg}\x1b[0m`;
const red = msg => `\x1b[31m${msg}\x1b[0m`;
const bold = msg => `\x1b[1m${msg}\x1b[0m`;

console.log(bold(green('\n🚀 Starting DEXTER BOT...\n')));

// === Step 1: Clone Private Repo ===
function cloneRepo() {
  console.log(blue(`📥 Cloning ${PRIVATE_REPO}...`));
  execSync(`git clone -b ${BRANCH} https://${GITHUB_TOKEN}@github.com/${PRIVATE_REPO}.git ${TEMP_DIR}`, {
    stdio: 'inherit',
  });
}

// === Step 2: Write .env file ===
function writeEnvFile() {
  const envContent = `SESSION_ID=${process.env.SESSION_ID}
OWNER_NUMBER=${process.env.OWNER_NUMBER}
`;
  fs.writeFileSync(`${TEMP_DIR}/.env`, envContent);
  console.log(blue('🧾 .env file written to cloned directory.\n'));
}

// === Step 3: Install dependencies ===
function installDependencies() {
  const pkgPath = path.join(TEMP_DIR, 'package.json');
  if (fs.existsSync(pkgPath)) {
    console.log(blue('📦 Installing dependencies...'));
    execSync(`cd ${TEMP_DIR} && npm install`, { stdio: 'inherit' });
  }
}

// === Step 4: Run bot main file ===
function runEntryFile() {
  const foundFile = ENTRY_FILES.find(file => fs.existsSync(path.join(TEMP_DIR, file)));

  if (!foundFile) {
    console.log(red('❌ No valid entry file (index.js, running.js, etc) found inside repo.\n'));
    console.log(yellow('📂 Available files inside repo:'));
    const files = fs.readdirSync(TEMP_DIR);
    files.forEach(f => console.log('  -', f));
    process.exit(1);
  }

  console.log(green(`🚀 Running bot from ${foundFile}...\n`));
  require(path.resolve(TEMP_DIR, foundFile));
}

// === EXECUTE ===
if (!fs.existsSync(TEMP_DIR)) {
  cloneRepo();
  writeEnvFile();
  installDependencies();
} else if (AUTO_UPDATE) {
  console.log(yellow('🔄 AUTO_UPDATE enabled — implement git pull here if needed.'));
} else {
  console.log(yellow('⚠️ Repo already exists. Skipping clone.\n'));
}

runEntryFile();
