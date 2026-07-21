import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { uploadToR2 } from './r2';

const execAsync = promisify(exec);

export async function runDatabaseBackup(): Promise<string> {
  const dbUrlString = process.env.DATABASE_URL;
  if (!dbUrlString) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const dbUrl = new URL(dbUrlString);
  const username = dbUrl.username;
  const password = decodeURIComponent(dbUrl.password);
  const host = dbUrl.hostname;
  const port = dbUrl.port || '3306';
  const database = dbUrl.pathname.replace(/^\//, '').split('?')[0];

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tempFilename = `backup-${database}-${timestamp}.sql`;
  const tempFilePath = path.join(os.tmpdir(), tempFilename);

  try {
    // Execute mysqldump securely with MYSQL_PWD env var
    await execAsync(
      `mysqldump -h ${host} -P ${port} -u ${username} ${database} > ${tempFilePath}`,
      {
        env: {
          ...process.env,
          MYSQL_PWD: password,
        },
      }
    );

    // Read the file buffer
    const buffer = fs.readFileSync(tempFilePath);
    const r2Key = `backups/${tempFilename}`;

    // Upload to R2
    const publicUrl = await uploadToR2(r2Key, buffer, 'application/sql');

    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return publicUrl;
  } catch (error) {
    // Ensure clean up on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    console.error('[runDatabaseBackup] failed:', error);
    throw error;
  }
}
