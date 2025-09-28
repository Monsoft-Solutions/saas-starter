#!/usr/bin/env tsx

import { writeFileSync } from 'fs';
import { join } from 'path';

import { generateEmailPreviewPage } from '@/lib/emails/preview';

/**
 * Script to generate email preview HTML file for local development
 */
async function main() {
  try {
    console.log('Generating email preview page...');

    const html = await generateEmailPreviewPage();

    const outputPath = join(process.cwd(), 'email-preview.html');
    writeFileSync(outputPath, html, 'utf-8');

    console.log(`✅ Email preview generated: ${outputPath}`);
    console.log('Open the file in your browser to view all email templates');
  } catch (error) {
    console.error('❌ Failed to generate email preview:', error);
    process.exit(1);
  }
}

main();
