import { execSync } from 'node:child_process';
import fs from 'node:fs';

const BLOCKED_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /\.(pem|key|pfx|p12|pkcs12)$/i,
  /^id_(rsa|dsa|ed25519|ecdsa)$/i,
  /(^|\/)(credentials|client_secret.*)\.json$/i,
];

const ALLOWED_FILES = ['.env.example'];

const SENSITIVE_PATTERNS = [
  { name: 'Clave privada', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'Token Mercado Pago', regex: /(?:APP_USR|TEST)-[0-9a-zA-Z_\-]{20,}/ },
  { name: 'Clave AWS de acceso', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'JWT hardcodeado', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ },
  { name: 'Contraseña en cadena de conexión', regex: /Password=[^;\s"']{3,};/i },
  { name: 'Credencial / Secret asignado en código', regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{20,}['"]/i },
];

function checkStagedFiles() {
  let stagedFiles = [];
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    stagedFiles = output.split('\n').map(f => f.trim()).filter(Boolean);
  } catch {
    return;
  }

  if (stagedFiles.length === 0) {
    return;
  }

  const errors = [];

  for (const file of stagedFiles) {
    const fileName = file.split('/').pop();
    if (ALLOWED_FILES.includes(fileName)) {
      continue;
    }

    for (const pattern of BLOCKED_FILE_PATTERNS) {
      if (pattern.test(fileName)) {
        errors.push(`Archivo sensible bloqueado para commit: ${file}`);
      }
    }
  }

  try {
    const diff = execSync('git diff --cached', { encoding: 'utf-8' });
    const lines = diff.split('\n');

    let currentFile = '';
    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        currentFile = line.replace('+++ b/', '').trim();
      }

      if (!line.startsWith('+') || line.startsWith('+++')) {
        continue;
      }

      const addedContent = line.slice(1);
      for (const { name, regex } of SENSITIVE_PATTERNS) {
        if (regex.test(addedContent)) {
          errors.push(`Posible credencial detectada [${name}] en ${currentFile}: "${addedContent.trim().substring(0, 40)}..."`);
        }
      }
    }
  } catch {
  }

  if (errors.length > 0) {
    console.error('\n[PRE-COMMIT BLOQUEADO]: Se detectaron credenciales o archivos sensibles:');
    for (const error of errors) {
      console.error(` - ${error}`);
    }
    console.error('\nEvitá subir secretos o tokens al repositorio. Utilizá variables de entorno locales o User Secrets.\n');
    process.exit(1);
  }
}

checkStagedFiles();
