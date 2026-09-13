import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

// Secrets live outside the repository and OneDrive on Windows.
const privateFile=process.platform==='win32'
 ? join(process.env.LOCALAPPDATA||join(homedir(),'AppData','Local'),'TradeAtlas','.env')
 : join(homedir(),'.config','trade-atlas','.env');
try {
 if(existsSync(privateFile))process.loadEnvFile(privateFile);
 else if(existsSync('.env.local'))process.loadEnvFile('.env.local');
} catch {
 console.error('Cannot read the private traffic configuration. Run this app from your own Windows account.');
 process.exit(1);
}
await import('./traffic-server.mjs');
