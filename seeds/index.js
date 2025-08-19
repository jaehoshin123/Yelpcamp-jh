const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelper');

const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/campgroundDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
    console.log('Connected to the database');
});


const UNSPLASH_COLLECTION_ID = 483251; // 원하는 컬렉션 ID
const UNSPLASH_URL = `https://api.unsplash.com/collections/${UNSPLASH_COLLECTION_ID}/photos`;

async function fetchCollectionImages() {
    try {
        const {data} = await axios.get(UNSPLASH_URL, {
            params: {
                per_page: 30, // 한 번에 가져올 이미지 수,
                page: 1
            },
            headers: {
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
            }
        });
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }
        return data;
    } catch (error) {
        console.error('Error fetching images from Unsplash:', error);
        return [];
    }
}

const seedDB = async () => {
    await Campground.deleteMany({});

    const photos = await fetchCollectionImages();

    for (let i = 0; i < 30; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10; // 가격을 10에서 30 사이로 설정
        const c = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: photos[i].urls.regular,
            description: "camping site",
            price: price
        })
        await c.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
    console.log('Database seeded and connection closed');
});
