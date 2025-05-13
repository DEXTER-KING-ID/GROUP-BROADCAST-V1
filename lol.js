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

// === 🎨 CLI Color Helpers ===
const green = msg => `\x1b[32m${msg}\x1b[0m`;
const yellow = msg => `\x1b[33m${msg}\x1b[0m`;
const blue = msg => `\x1b[36m${msg}\x1b[0m`;
const red = msg => `\x1b[31m${msg}\x1b[0m`;
const bold = msg => `\x1b[1m${msg}\x1b[0m`;

console.log(bold(green('\n🚀 Starting DEXTER BOT...\n')));

// === 🧠 Step 1: Clone to temp directory ===
function cloneToTemp() {
  console.log(blue('📥 Cloning private repo to temp directory...'));
  execSync(`git clone -b ${BRANCH} https://${GITHUB_TOKEN}@github.com/${PRIVATE_REPO}.git ${TEMP_DIR}`, {
    stdio: 'inherit',
  });
}

// === 🧠 Step 2: Move files to root directory ===
function moveFilesToRoot() {
  console.log(blue('📦 Moving files to root directory...'));
  const files = fs.readdirSync(TEMP_DIR);
  files.forEach(file => {
    const src = path.join(TEMP_DIR, file);
    const dest = path.join('./', file);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
  });
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log(green('✅ Moved all files to root and cleaned temp directory.\n'));
}

// === 🧠 Step 3: Install NPM Packages ===
function installPackagesIfNeeded() {
  if (fs.existsSync('./package.json')) {
    console.log(blue('📦 Installing dependencies from package.json...'));
    execSync('npm install', { stdio: 'inherit' });
  }
}

// === 🧠 Step 4: Write .env File ===
function writeEnv() {
  const envContent = `SESSION_ID=${process.env.SESSION_ID}
OWNER_NUMBER=${process.env.OWNER_NUMBER}
`;
  fs.writeFileSync('./.env', envContent);
  console.log(blue('🧾 .env file written.\n'));
}

// === 🧠 Step 5: Run entry file (e.g., index.js, running.js) ===
function runMainFile() {
  const entryFiles = ['index.js', 'start.js', 'running.js', 'bot.js'];
  for (const file of entryFiles) {
    if (fs.existsSync(file)) {
      console.log(green(`🚀 Starting bot from ${file}...\n`));
      require(path.resolve('./', file));
      return;
    }
  }
  console.error(red('❌ No valid entry file (index.js, running.js, etc) found.\n'));
  process.exit(1);
}

// === 🔄 AUTO_UPDATE (optional logic) ===
// You can add git fetch + diff logic here if AUTO_UPDATE === true

// === 🚀 Start Process ===
if (!fs.existsSync('./.git')) {
  cloneToTemp();
  moveFilesToRoot();
  writeEnv();
  installPackagesIfNeeded();
} else if (AUTO_UPDATE) {
  console.log(yellow('🔁 AUTO_UPDATE enabled — Add update logic here...'));
} else {
  console.log(yellow('⚠️ Repo already exists. Skipping clone.\n'));
}

runMainFile();
