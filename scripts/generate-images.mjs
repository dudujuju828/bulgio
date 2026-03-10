#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY not set in .env');
  process.exit(1);
}

const category = process.argv[2];
if (!category) {
  console.error('Usage: node scripts/generate-images.mjs <category>');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const jsonFile = path.join(process.cwd(), 'src', 'data', 'cards', `${category}.json`);
if (!fs.existsSync(jsonFile)) {
  console.error(`Card file not found: src/data/cards/${category}.json`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const imageDir = path.join(process.cwd(), 'public', 'images', 'cards', category);
fs.mkdirSync(imageDir, { recursive: true });

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

let updated = 0;
let skipped = 0;

for (const card of data.cards) {
  if (card.image) {
    skipped++;
    continue;
  }

  const slug = slugify(card.en);
  const filename = `${slug}.png`;
  const imagePath = path.join(imageDir, filename);

  // Skip if image file already exists on disk
  if (fs.existsSync(imagePath)) {
    card.image = `${category}/${filename}`;
    updated++;
    console.log(`  exists on disk, linked: ${filename}`);
    continue;
  }

  console.log(`Generating: ${card.en}...`);

  const prompt = `Create a simple, clean flat illustration of "${card.en}" on a solid dark background (color #1a1a2e). Minimalist iconic style, suitable as a small vocabulary flashcard icon. No text, no letters, no words in the image. Centered subject, square format.`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      })
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(`  API error: ${result.error?.message || res.status}`);
      continue;
    }

    const parts = result.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      console.error(`  No image returned for ${card.en}`);
      continue;
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    fs.writeFileSync(imagePath, buffer);
    card.image = `${category}/${filename}`;
    updated++;
    console.log(`  saved: ${filename}`);

    // Rate limit delay
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    console.error(`  Failed for ${card.en}: ${err.message}`);
  }
}

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2) + '\n');
console.log(`\nDone! ${updated} generated, ${skipped} already had images.`);
