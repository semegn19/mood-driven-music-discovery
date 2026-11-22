/**
 * Supabase Audio Upload & Sync Utility
 * -------------------------------------
 * This script uploads local audio files from public/music/[mood]/
 * into your Supabase Storage "music" bucket and updates the
 * tracks table in your PostgreSQL database with the CDN audio path.
 *
 * Usage:
 *   node scripts/upload-audio.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load .env.local if present
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = val;
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.error('\n❌ Missing Supabase credentials!');
  console.error('Please configure your .env.local file with:');
  console.error('  VITE_SUPABASE_URL=https://<your-project-id>.supabase.co');
  console.error('  VITE_SUPABASE_ANON_KEY=<your-anon-or-service-role-key>\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const moods = ['calm', 'focused', 'melancholic', 'energetic', 'romantic', 'chaotic'];
const musicDir = path.join(rootDir, 'public', 'music');

async function syncAudio() {
  console.log('🚀 Starting Supabase Audio Sync & CDN Upload...\n');

  if (!fs.existsSync(musicDir)) {
    console.log(`ℹ️ No local public/music directory found at ${musicDir}.`);
    return;
  }

  for (const mood of moods) {
    const moodFolder = path.join(musicDir, mood);
    if (!fs.existsSync(moodFolder)) continue;

    const files = fs.readdirSync(moodFolder).filter(f => /\.(mp3|m4a|wav|ogg|flac)$/i.test(f));
    if (files.length === 0) continue;

    console.log(`📁 Processing [${mood}] (${files.length} audio files found)...`);

    for (const file of files) {
      const filePath = path.join(moodFolder, file);
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `${mood}/${file}`;

      console.log(`  ⬆️ Uploading ${file} -> music/${storagePath}...`);
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(storagePath, fileBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error(`    ❌ Failed to upload ${file}:`, uploadError.message);
        if (uploadError.message.includes('row-level security')) {
          console.error(`\n💡 Tip: To resolve this Row-Level Security (RLS) error:`);
          console.error(`   Either add your SUPABASE_SERVICE_ROLE_KEY to .env.local (recommended for admin scripts),`);
          console.error(`   or run the Storage RLS policies in supabase/schema.sql in your Supabase SQL Editor.\n`);
          return;
        }
      } else {
        console.log(`    ✅ Uploaded to CDN successfully.`);

        // Sync track audio_path in PostgreSQL database
        const numMatch = file.match(/\d+/);
        if (numMatch) {
          const trackIndex = parseInt(numMatch[0], 10) - 1;
          if (trackIndex >= 0 && trackIndex < 12) {
            const { error: dbError } = await supabase
              .from('tracks')
              .update({ audio_path: storagePath })
              .eq('mood', mood)
              .eq('order_index', trackIndex);

            if (!dbError) {
              console.log(`    🔗 Linked track #${trackIndex + 1} in database to ${storagePath}`);
            }
          }
        }
      }
    }
  }

  console.log('\n✨ Audio sync completed!');
}

syncAudio().catch(err => {
  console.error('Fatal error during audio sync:', err);
  process.exit(1);
});
