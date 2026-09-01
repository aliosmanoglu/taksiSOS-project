const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-service-account.json');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkPlates() {
    try {
        const usersSnapshot = await db.collection('users').get();
        let totalUsers = 0;
        let invalidUsers = 0;
        
        const plateRegex = /^34T[A-Z0-9]{2,6}$/i;
        const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]{3,}$/;
        const phoneRegex = /^(05|5)[0-9]{9}$/;

        usersSnapshot.forEach(doc => {
            totalUsers++;
            const data = doc.data();
            const phone = data.phone || '';
            const plate = data.plate || '';
            const name = data.name || '';
            
            const plateClean = plate.replace(/\s/g, '');
            const phoneClean = phone.replace(/\s/g, '');
            
            let isInvalid = false;

            if (!plateRegex.test(plateClean)) isInvalid = true;
            if (!nameRegex.test(name.trim())) isInvalid = true;
            if (!phoneRegex.test(phoneClean)) isInvalid = true;

            if (isInvalid) {
                invalidUsers++;
            }
        });

        console.log(`Toplam ${totalUsers} kullanıcı tarandı, ${invalidUsers}'si plaka/isim/telefon kuralına uymuyor bulundu.`);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

checkPlates();
