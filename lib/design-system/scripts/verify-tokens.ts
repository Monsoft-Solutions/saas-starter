import fs from 'node:fs';
import path from 'node:path';

import { colors } from '../tokens/colors';

function readCssVariables() {
  const globalsPath = path.resolve(process.cwd(), 'app/globals.css');
  const css = fs.readFileSync(globalsPath, 'utf8');
  const regex = /--color-([a-z0-9-]+)\s*:/g;
  const tokens = new Set<string>();
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(css)) !== null) {
    tokens.add(match[1]);
  }

  return tokens;
}

function getDesignSystemTokens() {
  const lightTokens = Object.keys(colors.light);
  const darkTokens = Object.keys(colors.dark);

  const missingInDark = lightTokens.filter(
    (token) => !darkTokens.includes(token)
  );
  const extraInDark = darkTokens.filter(
    (token) => !lightTokens.includes(token)
  );

  if (missingInDark.length || extraInDark.length) {
    throw new Error(
      `Design token mismatch between light and dark themes.\nMissing in dark: ${missingInDark.join(', ') || 'none'}\nExtra in dark: ${extraInDark.join(', ') || 'none'}`
    );
  }

  return new Set(lightTokens);
}

const cssTokens = readCssVariables();
const designTokens = getDesignSystemTokens();

const missingInCss: string[] = [];
const extraInCss: string[] = [];

for (const token of designTokens) {
  if (!cssTokens.has(token)) {
    missingInCss.push(token);
  }
}

for (const token of cssTokens) {
  if (!designTokens.has(token)) {
    extraInCss.push(token);
  }
}

if (missingInCss.length || extraInCss.length) {
  const details = [
    missingInCss.length ? `Missing in CSS: ${missingInCss.join(', ')}` : null,
    extraInCss.length ? `Extra in CSS: ${extraInCss.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  throw new Error(
    `Design token mismatch between TS definitions and globals.css.\n${details}`
  );
}

console.log('Design tokens validated successfully.');
