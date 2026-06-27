'use strict';
/**
 * One-time migration script:
 * Downloads each team member image from Cloudinary and re-uploads to S3,
 * then updates the MongoDB document with the new S3 URL.
 *
 * Run: node scripts/migrateTeamImagesToS3.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3, BUCKET } = require('../src/config/s3');
const TeamMember = require('../src/models/TeamMember');

const downloadBuffer = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
      res.on('error', reject);
    }).on('error', reject);
  });

const getExt = (url, contentType) => {
  const fromUrl = url.split('.').pop().split('?')[0].toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(fromUrl)) return fromUrl === 'jpeg' ? 'jpg' : fromUrl;
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const members = await TeamMember.find();
  console.log(`📋 Found ${members.length} team members`);

  let migrated = 0, skipped = 0, failed = 0;

  for (const member of members) {
    const url = member.imageUrl;
    if (!url) { skipped++; continue; }
    if (url.includes('amazonaws.com')) {
      console.log(`⏭  Already on S3: ${member.name}`);
      skipped++;
      continue;
    }

    try {
      console.log(`⬇️  Downloading: ${member.name} — ${url}`);
      const { buffer, contentType } = await downloadBuffer(url);
      const ext = getExt(url, contentType);
      const key = `robin-studio/team/${Date.now()}-${member.name.replace(/\s+/g, '_')}.${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }));

      const s3Url = `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${key}`;
      await TeamMember.findByIdAndUpdate(member._id, { imageUrl: s3Url });
      console.log(`✅ Migrated: ${member.name} → ${s3Url}`);
      migrated++;

      // small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ Failed: ${member.name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n🎉 Done! Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
