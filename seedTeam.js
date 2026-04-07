const mongoose = require('mongoose');

// Same URI from setup-admin.js
const uri = 'mongodb+srv://techrabinsphotography_db_user:P1v3VD4D6bun105U@cluster0.h8zldpj.mongodb.net/?appName=Cluster0';

const teamData = {
  backbone: {
    cinematography: [
      { name: "Samrat Manna", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576889/Samrat_Manna_rvujd5.jpg" },
      { name: "Gopal Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576881/Gopal_Das_dtzzij.jpg" },
      { name: "Souvik Ganguli", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576881/Souvik_Ganguli_hzyywf.jpg" },
      { name: "Arpan Goswami", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576880/Arpan_Goswami_jnynzr.jpg" },
      { name: "Ayan Bagchi", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576879/Ayan_Bagchi_erauhj.jpg" },
      { name: "Surya Sekhar Mondal", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576878/Surya_Sekhar_Mondal_bhjk6j.jpg" },
      { name: "Swarup Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576877/swarup_das_rnbjx8.jpg" },
    ],
    dronePilot: [
      { name: "Kushal Saha", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576896/Kushal_Saha_p481fq.jpg" },
      { name: "Dinesh Kumar Ghosh", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576893/Dinesh_Kumar_Ghosh_q9d734.heic" },
      { name: "Chinmoy Paul", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576890/Chinmoy_Paul_hoz67v.jpg" },
    ],
    photographer: [
      { name: "Manotosh Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576894/Manotosh_Das_n4x1cb.jpg" },
      { name: "Tridib Purkait", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576888/Tridib_Purkait_f6udyi.jpg" },
      { name: "Niladri Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576885/Niladri_Das_vjjnjn.jpg" },
      { name: "Shreyankan Dey", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576885/Shreyankan_Dey_x3vk1m.jpg" },
      { name: "Souvik Mitra", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576883/Souvik_Mitra_gcmews.jpg" },
      { name: "Arup Halder", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576882/ARUP_HALDER_zodfxq.jpg" },
    ],
  },
  crew: {
    cinematographer: [
      { name: "Sanat Bardolai", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576885/Sanat_Bardolai_eyzghe.jpg" },
    ],
    photographer: [
      { name: "Shreyan Roychowdhury", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576884/Shreyan_Roychowdhury_vqk8ga.jpg" },
      { name: "Rohan Banik", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576882/ROHAN_BANIK_gtq6ls.jpg" },
      { name: "Debdibs Daw", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576877/Debdibs_Daw_acoeob.jpg" },
    ],
  },
  core: {
    dronePilot: [
      { name: "Sabyasachi Mondal", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576873/Sabyasachi_Mondal_pyygxs.jpg" },
    ],
    cinematographer: [
      { name: "Suman Bhattacharjee", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576872/Suman_Bhattacharjee_h4aweg.jpg" },
      { name: "Kiron Das Ghosh", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576870/Kiron_Das_Ghosh_gprk1w.jpg" },
      { name: "Anirban Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576868/Anirban_Das_walyxl.jpg" },
      { name: "Rone Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576867/Rone_Das_adtzlj.jpg" },
      { name: "Diponkor Paul", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576866/Diponkor_Paul_dqoigg.jpg" },
      { name: "Sayan Mukherjee", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576866/Sayan_Mukherjee_lbnqyf.jpg" },
      { name: "Sk Salim", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576865/Sk_Salim_qcd9zq.jpg" },
      { name: "Rohan Roy", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576866/Rohan_Roy_tojyww.jpg" },
    ],
    photographer: [
      { name: "Rohit Saha", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576880/Rohit_Saha_dhxwrf.webp" },
      { name: "Puspal Bhattacharya", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576874/Puspal_Bhattacharya_gasovp.jpg" },
      { name: "Sayantan Saha", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576871/Sayantan_Saha_lpati0.jpg" },
      { name: "Amit Roy", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576871/Amit_Roy_o3mmyh.jpg" },
      { name: "Prosenjit Mondal", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576871/Prosenjit_Mondal_ugyxau.jpg" },
      { name: "Jayanta Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576870/Jayanta_Das_d730xy.jpg" },
      { name: "Samit Das", image: "https://res.cloudinary.com/dfcf6ug0s/image/upload/q_auto/f_auto/v1775576869/Samit_Das_mesm7z.jpg" },
    ],
  },
};

mongoose.connect(uri).then(async () => {
    const TeamMember = require('./src/models/TeamMember');
    await TeamMember.deleteMany({}); // clear existing
    
    const docs = [];
    let order = 0;

    for (const [tier, posGroups] of Object.entries(teamData)) {
        for (const [pos, members] of Object.entries(posGroups)) {
            for (const member of members) {
                docs.push({
                    name: member.name,
                    position: pos,
                    tier: tier.toUpperCase(),
                    imageUrl: member.image,
                    order: order++
                });
            }
        }
    }

    await TeamMember.insertMany(docs);
    console.log(`✅ Inserted ${docs.length} team members successfully.`);
    process.exit(0);
}).catch(console.error);
