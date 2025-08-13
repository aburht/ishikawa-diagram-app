const fs = require('fs-extra');
const path = require('path');

async function copyDatabase() {
  try {
    const sourcePath = path.join(__dirname, 'apps', 'backend', 'src', 'db.json');
    const destPath = path.join(__dirname, 'dist', 'apps', 'backend', 'src', 'db.json');

    console.log('Copying database file...');
    console.log('From:', sourcePath);
    console.log('To:', destPath);

    // Ensure the destination directory exists
    await fs.ensureDir(path.dirname(destPath));

    // Copy the file
    await fs.copy(sourcePath, destPath);

    console.log('Database file copied successfully!');
  } catch (error) {
    console.error('Failed to copy database file:', error.message);
    process.exit(1);
  }
}

copyDatabase();
