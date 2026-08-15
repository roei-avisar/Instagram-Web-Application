const mongoose = require('mongoose');
// Import the Mongoose model you created
const Post = require('./models/postsModel'); 

// The URI we built for the database
const MONGO_URI = "mongodb+srv://ronhefetz1_db_user:.7AyZgf7XBw9X%3B%2C@webapp.rcexxoq.mongodb.net/Instagram_db";

// The mock data array from your postModel.js file
const allPostsData = [
    {
        "id": 1,
        "authors": [ "yardenaaa_", "haza.ofra" ], 
        "isVerified": false, 
        "timeAgo": "52m", 
        "subHeader": "Ofra Haza &bull; שיר הפרחה", 
        "mediaType": "image", 
        "mediaSource": "./elements/media/posts/main-posts/ofra-and-yardena-post.jpeg", 
        "audioSource": "./elements/media/posts/posts-audio/freha-song.mp3",
        "hasMuteButton": true, 
        "stats": {
            "likes": "1342",
            "comments": "7",
            "shares": "133"
        },
        "likedByUsers": [ "gali_atari10", "nalin12", "ofra_fan99" ], 
        "caption": "אתם טים עופרה או טים ירדנה? הצביעו בסקר של החדשות עכשיו!", 
        "isSuggested": false
    },
    {
        "id": 2,
        "authors": [ "noa.kirel1" ], 
        "isVerified": true, 
        "timeAgo": "6h", 
        "subHeader": "Noa Kirel &bull; מיליון דולר", 
        "mediaType": "video", 
        "mediaSource": "./elements/media/posts/main-posts/noa-kirel-post.mp4",
        "audioSource": "./elements/media/posts/posts-audio/million-dollar-song.mp3", 
        "hasMuteButton": true, 
        "stats": {
            "likes": "9989",
            "comments": "3",
            "shares": "328"
        },
        "likedByUsers": [ "donald.j.trump", "yardena.arazi.fanpage", "sara22" ], 
        "caption": "מי שרוצה שיר חדש שיעשה לייק", 
        "isSuggested": false
    },
    {
        "id": 3,
        "authors": [ "abba.band" ], 
        "isVerified": true, 
        "timeAgo": "1d", 
        "subHeader": "Stockholm, Sweden", 
        "mediaType": "image", 
        "mediaSource": "./elements/media/posts/main-posts/abba-post.jpeg", 
        "hasMuteButton": false, 
        "stats": {
            "likes": "788",
            "comments": "4",
            "shares": "98"
        },
        "likedByUsers": [ "john_len99" ], 
        "caption": "Last night was SUPE-PER TROUPE-PER!", 
        "isSuggested": false
    },
    {
        "id": 4,
        "authors": [ "louis_arm_strong" ], 
        "isVerified": false, 
        "timeAgo": "14h", 
        "subHeader": "", 
        "mediaType": "image", 
        "mediaSource": "./elements/media/posts/main-posts/louis-armstrong-post.jpeg", 
        "hasMuteButton": false, 
        "stats": {
            "likes": "941",
            "comments": "2",
            "shares": "3"
        },
        "likedByUsers": [ "jamil_jamal", "tomer19", "mrs.lady" ], 
        "caption": "What a wonderful world! Love to all of my followers ❤️", 
        "isSuggested": false
    },
    {
        "id": 5,
        "authors": [ "bonjovi_x" ], 
        "isVerified": true, 
        "timeAgo": "2d", 
        "subHeader": "Suggested for you", 
        "mediaType": "image", 
        "mediaSource": "./elements/media/posts/main-posts/bon-jovi-post.png", 
        "hasMuteButton": false, 
        "stats": {
            "likes": "4231",
            "comments": "3",
            "shares": "15"
        },
        "likedByUsers": [ "lihi_griner67" ], 
        "caption": "My new track is out, listen now on Youtube!", 
        "isSuggested": true
    },
    {
        "id": 6,
        "authors": [ "tina.terner111" ], 
        "isVerified": false, 
        "timeAgo": "2h", 
        "subHeader": "Original audio", 
        "mediaType": "video", 
        "mediaSource": "./elements/media/posts/main-posts/tina-terner-post.mp4", 
        "audioSource": "./elements/media/posts/posts-audio/proud-mary-song.mp3",
        "hasMuteButton": true, 
        "stats": {
            "likes": "3842",
            "comments": "3",
            "shares": "15"
        },
        "likedByUsers": [ "galit_gg4", "liat.dell" ], 
        "caption": "Proud Mary keep on burnin'🔥", 
        "isSuggested": false
    },
    {
        "id": 7,
        "authors": [ "besteam_ever" ], 
        "isVerified": true, 
        "timeAgo": "55m", 
        "subHeader": "The College Of Management, Israel", 
        "mediaType": "text", 
        "mediaSource": "אחרי הרבה עבודה קשה שמחים להגיש את המטלה בפיתוח אפליקציות אינטרנטיות. מקווים לקבל לא פחות מ100!",
        "hasMuteButton": false, 
        "stats": {
            "likes": "5555",
            "comments": "5",
            "shares": "5"
        },
        "likedByUsers": [ "noa.kirel1", "abba.band", "gual.nefesh" ],
        "caption": "תחזיקו לנו אצבעות",
        "isSuggested": false
    }
];

async function seedDatabase() {
    try {
        // Establish connection to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log("Connected to database.");

        // We explicitly DO NOT call deleteMany here to preserve existing data

        // Insert the JSON data array into the database
        await Post.insertMany(allPostsData);
        console.log("Successfully seeded the database with posts.");

        // Close the connection once done
        mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding database:", error);
        mongoose.disconnect();
    }
}

// Execute the seed function
seedDatabase();