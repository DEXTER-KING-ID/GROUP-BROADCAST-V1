const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PRIVATE_REPO = 'DEXTER-KING-ID/GROUP-BROADCAST-SYSTEM';
const BRANCH = 'main';
const TEMP_DIR = path.join(__dirname, 'temp_repo');
const AUTO_UPDATE = process.env.AUTO_UPDATE === 'true';

// Color functions
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;
const blue = (msg) => `\x1b[36m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`;

console.log(bold(green('\n🚀 Starting DEXTER BOT...\n')));

// Clone Repo
function cloneRepo() {
  console.log(blue('📥 Cloning private repo...'));
  execSync(`git clone -b ${BRANCH} https://${GITHUB_TOKEN}@github.com/${PRIVATE_REPO}.git ${TEMP_DIR}`, {
    stdio: 'inherit',
  });
}

// Update Repo
function updateRepo() {
  console.log(blue('🔄 Checking for updates...'));
  const oldHash = execSync(`git -C ${TEMP_DIR} rev-parse HEAD`).toString().trim();

  execSync(`git -C ${TEMP_DIR} fetch`, { stdio: 'ignore' });
  const status = execSync(`git -C ${TEMP_DIR} diff --name-only HEAD origin/${BRANCH}`).toString();

  if (status.trim() === '') {
    console.log(green('✅ No updates found. Bot is up-to-date.'));
    return false;
  }

  console.log(yellow('\n📂 Files updated:'));
  status.split('\n').forEach(file => {
    if (file.trim()) console.log('   → ' + yellow(file.trim()));
  });

  execSync(`git -C ${TEMP_DIR} pull`, { stdio: 'inherit' });

  const newHash = execSync(`git -C ${TEMP_DIR} rev-parse HEAD`).toString().trim();
  return oldHash !== newHash;
}

// Write .env to cloned repo
function writeEnvFile() {
  const envContent = `SESSION_ID=${process.env.SESSION_ID}
OWNER_NUMBER=${process.env.OWNER_NUMBER}
`;
  fs.writeFileSync(`${TEMP_DIR}/.env`, envContent);
  console.log(blue('🧾 .env file written to cloned repo.\n'));
}

// === EXECUTION ===
if (!fs.existsSync(TEMP_DIR)) {
  cloneRepo();
  writeEnvFile();
} else if (AUTO_UPDATE) {
  const updated = updateRepo();
  if (updated) {
    writeEnvFile();
    console.log(red('\n🔁 Update detected. Restarting bot...\n'));
    process.exit(1);
  }
} else {
  console.log(yellow('⚠️ Repo already exists. Skipping clone.\n'));
}

writeEnvFile();

// Auto detect entry point (JS/HTML)
const possibleJSFiles = ['index.js', 'main.js', 'running.js', 'app.js'];
let foundJSFile;
let foundHTMLFile = false;

// Check for JS entry files
for (const file of possibleJSFiles) {
  const filePath = path.join(TEMP_DIR, file);
  if (fs.existsSync(filePath)) {
    foundJSFile = filePath;
    break;
  }
}

// Check for index.html file if no JS found
if (!foundJSFile) {
  if (fs.existsSync(path.join(TEMP_DIR, 'index.html'))) {
    foundHTMLFile = true;
  }
}

if (foundJSFile) {
  console.log(green(`✅ Found JS entry: ${path.basename(foundJSFile)}`));
  require(foundJSFile);
} else if (foundHTMLFile) {
  console.log(green('✅ Found HTML entry: index.html'));
  const app = express();
  app.use(express.static(TEMP_DIR));
  app.get('/', (req, res) => {
    res.sendFile(path.join(TEMP_DIR, 'index.html'));
  });
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(blue(`🌐 Serving HTML on http://localhost:${PORT}`));
  });
} else {
  console.log(red('❌ No valid entry file (index.js, running.js, main.js, index.html) found.'));
  process.exit(1);
}
