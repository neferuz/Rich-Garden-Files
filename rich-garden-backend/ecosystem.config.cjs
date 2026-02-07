const path = require('path');
const fs = require('fs');
const backendDir = __dirname;
const uvicornPath = path.join(backendDir, 'venv/bin/uvicorn');
const venvPython = path.join(backendDir, 'venv/bin/python');

module.exports = {
  apps: [
    {
      name: 'rich-garden-backend',
      cwd: backendDir,
      script: fs.existsSync(uvicornPath) ? uvicornPath : 'uvicorn',
      args: ['app.main:app', '--host', '0.0.0.0', '--port', '8000'],
      interpreter: 'none',
    },
    {
      name: 'rich-garden-bot-group',
      cwd: backendDir,
      script: 'run_bot_group.py',
      interpreter: fs.existsSync(venvPython) ? venvPython : 'python3',
      autorestart: true,
      watch: false,
    },
    {
      name: 'rich-garden-bot-main',
      cwd: backendDir,
      script: 'run_bot.py',
      interpreter: fs.existsSync(venvPython) ? venvPython : 'python3',
      autorestart: true,
      watch: false,
    },
    {
      name: 'rich-garden-bot-admin',
      cwd: backendDir,
      script: 'run_bot_admin.py',
      interpreter: fs.existsSync(venvPython) ? venvPython : 'python3',
      autorestart: true,
      watch: false,
    },
  ],
};
