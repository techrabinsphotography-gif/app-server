'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const mongoose = require('mongoose');
const TeamMember = require('../src/models/TeamMember');

const BIOS = {
  // Photographers
  photographer: [
    'Capturing raw emotions and timeless moments with a creative eye and precision.',
    'Passionate storyteller who transforms every shot into a lasting memory.',
    'Specializes in candid wedding photography with a cinematic touch.',
    'Dedicated to delivering high-quality images that speak louder than words.',
    'Crafting visual stories through light, composition, and emotion.',
    'Bringing creativity and technical skill to every photography session.',
    'Focused on capturing genuine moments that clients treasure forever.',
    'Expert in portrait and event photography with 5+ years of experience.',
  ],
  // Cinematographers
  cinematographer: [
    'Creating cinematic wedding films with a deep passion for visual storytelling.',
    'Expert in capturing motion and emotion through a cinematic lens.',
    'Turning your special day into a beautifully crafted film to cherish forever.',
    'Specializes in documentary-style wedding films with artistic flair.',
    'Bringing cinematic vision and technical expertise to every project.',
    'Master of light and motion, crafting films that move and inspire.',
    'Dedicated to creating wedding films that feel like a Hollywood production.',
    'Combining artistry and technology to deliver breathtaking visual stories.',
  ],
  cinematography: [
    'Creating cinematic wedding films with a deep passion for visual storytelling.',
    'Expert in capturing motion and emotion through a cinematic lens.',
    'Turning your special day into a beautifully crafted film to cherish forever.',
  ],
  // Drone Pilots
  dronePilot: [
    'Certified drone pilot delivering breathtaking aerial footage that elevates every story.',
    'Expert aerial cinematographer with an eye for dramatic shots and safe operations.',
    'Licensed drone operator capturing stunning bird\'s-eye perspectives of your special day.',
    'Specializes in smooth, cinematic drone footage that adds a new dimension to wedding films.',
  ],
};

const DEFAULT_BIO = 'A dedicated professional at Rabin\'s Photography, bringing passion and expertise to every project.';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const members = await TeamMember.find({ $or: [{ bio: '' }, { bio: { $exists: false } }] });
  console.log(`📋 Found ${members.length} members without bio`);

  const counters = {};

  for (const member of members) {
    const pos = member.position?.toLowerCase().trim() || '';
    const pool = BIOS[pos] || [];
    const idx = counters[pos] || 0;
    const bio = pool[idx % pool.length] || DEFAULT_BIO;
    counters[pos] = idx + 1;

    await TeamMember.findByIdAndUpdate(member._id, { bio });
    console.log(`✅ ${member.name} (${member.position}) → "${bio.substring(0, 60)}..."`);
  }

  console.log(`\n🎉 Done! Added bios to ${members.length} members`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
