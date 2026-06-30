const postsContainer = document.querySelector('.instagram-posts'); // Global variable to store posts html elements
const commentPopupBackground = document.querySelector('.comment-popup-background');
const textColour = {video: 'text-white', image: 'text-dark', text: 'text-dark'};

let allPostsData = [
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
    },
];

let lastPostId = 7;

const filtersList = {
    mediaType: [ "image", "video", "text" ],
    searchString: ''
};

const filtersFunctions = {
    mediaType: function(postsData, values) {
        return postsData.filter(post => values.includes(post.mediaType));
    },
    searchString: function(postsData, value) {
        return postsData.filter(post => {
            const inCaption = post.caption.toLowerCase().includes(value.toLowerCase());
            const inAuthors = post.authors.some(author => author.toLowerCase().includes(value.toLowerCase()));
            const inText = post.mediaType === 'text' && post.mediaSource.toLowerCase().includes(value.toLowerCase());
            return inCaption || inAuthors || inText;
        });
    }
};

function addNewPost(newPost) {
    lastPostId = lastPostId + 1
    newPost.id = lastPostId
    allPostsData.unshift(newPost);
    renderPosts(allPostsData);

    const newPostElement = document.querySelector(`[data-post-id="${lastPostId}"]`);
    newPostElement.classList.add('new-post-glow');
    setTimeout(() => {
            newPostElement.classList.remove('new-post-glow');
        }, 5000);
}

function applyFilters() {
    let currentPosts = allPostsData;

    Object.keys(filtersList).forEach(key => {
        currentPosts = filtersFunctions[key](currentPosts, filtersList[key]);
    });

    renderPosts(currentPosts);
}

function updateSearchFilter(text) {
    filtersList.searchString = text;
    applyFilters();
}

function updateMediaFilter(mediaTypes) {
    filtersList.mediaType = mediaTypes;
    applyFilters();
}

function deletePostById(deleteId) {
    allPostsData = allPostsData.filter(post => post.id !== deleteId);
    closePopupComment(null, true)
    renderPosts(allPostsData);
}


function createAuthorsHTML(post) {
    let authorsNamesHTML = '';
    if (post.authors.length > 1) {
        authorsNamesHTML = `
            <a href="#!" class="username ms-2 fw-semibold text-decoration-none ${textColour[post.mediaType]} small-text">${post.authors[0]}</a>
            <span class="ms-1">and</span>
            <a href="#!" class="username ms-1 fw-semibold text-decoration-none ${textColour[post.mediaType]} small-text">${post.authors[1]}</a>
        `;
    } else {
        authorsNamesHTML = `
            <a href="#!" class="username ms-2 fw-semibold text-decoration-none ${textColour[post.mediaType]} small-text">${post.authors[0]}</a>
        `;
    }
    return authorsNamesHTML;
}

function createProfilePicsHTML(post) {
    let profilePicsHTML = '';
    if (post.authors.length > 1) {
        profilePicsHTML = `
            <div>
                <a href="#!" class="text-decoration-none text-dark">
                    <img src="elements/media/profile-pictures/${post.authors[0]}.jpg" class="img-fluid rounded-circle joint-first-profile-pic position-relative z-2 border border-1 border-white" alt="Image">
                </a>
                <a href="#!" class="text-decoration-none text-dark">
                    <img src="elements/media/profile-pictures/${post.authors[1]}.jpg" class="img-fluid rounded-circle joint-second-profile-pic position-relative z-1 border border-1 border-white" alt="Image">
                </a>
            </div>
        `;
    } else {
        profilePicsHTML = `
            <a href="#!" class="text-decoration-none text-dark profile-circle">
                <img src="elements/media/profile-pictures/${post.authors[0]}.jpg" class="img-fluid rounded-circle post-profile-pic" alt="Image">
            </a>
        `;
    }
    return profilePicsHTML;
}

function createPostContentHTML(post, profilePicsHTML, authorsNamesHTML) {
    const optionsMenuHTML = `
    <div class="position-relative">
        <button class="bi bi-three-dots fs-4 bg-transparent border-0 p-0 ${textColour[post.mediaType]} options-btn"></button>

        <div class="d-none post-options-dropdown">
                <button class="delete-post-btn" data-id="${post.id}">
                    Delete Post <span class="bi bi-trash"></span>
                </button>
        </div>
    </div>
    `;

    let audioTagHTML = '';
    if (post.audioSource) {
        let isLoop = post.mediaType === "video" ? "" : "loop"; // if the media is a photo the sound is looped automaticlly if its a video then the sound will be looped with the video
        audioTagHTML = `<audio id="audio-${post.id}" src="${post.audioSource}" autoplay muted ${isLoop}></audio>`;
    }

    let muteButtonHTML = '';
    if (post.hasMuteButton) {
        muteButtonHTML = `
        <div class="tiny-icon-background position-absolute bottom-0 end-0 m-3 bg-dark bg-opacity-50 rounded-circle d-flex justify-content-center align-items-center" style="z-index: 5;">
            <button class="bi bi-volume-mute-fill text-white bg-transparent border-0 p-0" onclick="togglePostAudio(this, '${post.id}')"></button>
        </div>`;
    }

    let postContentHTML = '';
    if (post.mediaType === "video") {
        postContentHTML = `
            <div class="position-relative">
                <div class="position-absolute w-100 top-0 start-0 z-3 p-3 bg-transparent d-flex justify-content-between align-items-center border-0 js-post-header">
                    <div class="d-flex align-items-center">
                        ${profilePicsHTML}
                        <div class="lh-1">
                            <div class="d-flex align-items-center">
                                ${authorsNamesHTML}
                            ${post.isVerified ? '<span class="ms-1 bi bi-patch-check-fill text-primary verified-icon"></span>' : ''}
                                <div class="js-post-time d-flex align-items-center">
                                    <span class="text-white ms-1 fw-medium small-text">&bull;</span>
                                    <span class="text-white ms-1 small-text">${post.timeAgo}</span>
                                </div>
                            </div>
                            <a href="#!" class="ms-2 text-decoration-none text-white text-12">${post.subHeader}</a>
                        </div>
                    </div>
                    ${optionsMenuHTML}
                </div>
                
                <div class="js-post-media position-relative">
                    <video id="video-${post.id}" src="${post.mediaSource}" class="img-fluid rounded-2 main-post w-100" autoplay muted playsinline onended="restartMedia(this)"></video>
                    ${audioTagHTML}
                    ${muteButtonHTML}
                </div>
            </div> 
        `;
            
    } else if (post.mediaType === "image") {
        postContentHTML = `
            <div class="card-header bg-white d-flex justify-content-between align-items-center border-0 js-post-header">
                <div class="d-flex align-items-center">
                    ${profilePicsHTML}
                    <div class="lh-1">
                        <div class="d-flex align-items-center">
                            ${authorsNamesHTML}
                            ${post.isVerified ? '<span class="ms-1 bi bi-patch-check-fill text-primary verified-icon"></span>' : ''}
                            <span class="js-post-time">
                                <span class="text-muted ms-1 fw-bold small-text">&bull;</span>
                                <span class="text-muted ms-1 small-text">${post.timeAgo}</span>
                            </span>
                        </div>
                        <button class="bg-transparent border-0 p-0 ms-2 text-12">${post.subHeader}</button>
                    </div>
                </div>
                ${optionsMenuHTML}
            </div>
            
            <div class="position-relative js-post-media">
                <img src="${post.mediaSource}" class="img-fluid rounded-2 main-post" alt="Image">
                ${audioTagHTML}
                ${muteButtonHTML}
            </div>
        `;
    } else if (post.mediaType == "text") {
        postContentHTML = `
            <div class="card-header bg-white d-flex justify-content-between align-items-center border-0 js-post-header">
                <div class="d-flex align-items-center">
                    ${profilePicsHTML}
                    <div class="lh-1">
                        <div class="d-flex align-items-center">
                            ${authorsNamesHTML}
                            ${post.isVerified ? '<span class="ms-1 bi bi-patch-check-fill text-primary verified-icon"></span>' : ''}
                            <span class="js-post-time">
                                <span class="text-muted ms-1 fw-bold small-text">&bull;</span>
                                <span class="text-muted ms-1 small-text">${post.timeAgo}</span>
                            </span>
                        </div>
                        <button class="bg-transparent border-0 p-0 ms-2 text-12">${post.subHeader}</button>
                    </div>
                </div>
                ${optionsMenuHTML}
            </div>
            
            <div class="position-relative text-post-container d-flex justify-content-center align-items-center p-4 rounded-2 js-post-media">
                <h3 class="text-post-content m-0 text-center fw-bold">${post.mediaSource}</h3>
            </div>
        `;
    }
    return postContentHTML;
}

function createPostButtonsHTML(post) {
    let heartClass = "bi-heart";
    let heartTextColor = "";

    if (likedPosts[post.id]) {
        heartClass = "bi-heart-fill";
        heartTextColor = "text-danger";
    }

    let bookmarkClass = "bi-bookmark";
    let bookmarkTextColor = "";

    if (savedPosts[post.id]) {
        bookmarkClass = "bi-bookmark-fill";
        bookmarkTextColor = "text-dark";
    }

    let postButtonsHTML = `
        <div class="d-flex justify-content-between js-icon-line">
            <div class="d-flex"> 
                <div class="d-flex align-items-center js-like-container">
                    <button class="bi ${heartClass} ${heartTextColor} fs-4 fw-bold bg-transparent border-0 p-0 post-icons" onclick="likePost(this)"></button>
                    <span class="ms-1 js-like-counter">${post.stats.likes}</span>
                </div>
                <div class="d-flex align-items-center ms-3">
                    <button class="bi bi-chat fs-4 fw-bold bg-transparent border-0 p-0 post-icons" onclick="popupCommentMaker(this)"></button>
                    <span class="ms-1">${post.stats.comments}</span>
                </div>
                <div class="d-flex align-items-center ms-3">
                    <button class="bi bi-send fs-4 fw-bold bg-transparent border-0 p-0 post-icons" onclick="openSharePopup(this)"></button>
                    <span class="ms-1">${post.stats.shares}</span>
                </div>
            </div>
            <button class="js-save-button bi ${bookmarkClass} ${bookmarkTextColor} fs-4 fw-bold bg-transparent border-0 p-0 post-icons" onclick="savePost(this)"></button>
        </div>
    `;
    return postButtonsHTML;
}

function createLikedByHTML(likedByUsers, likes) {
    let likedByProfilesHTML = '';
    let likedByHTML = '';
    likedByUsers.forEach(user => {
        likedByProfilesHTML += `
            <img src="elements/media/profile-pictures/${user}.jpg" class="liked-by-profile-pic rounded-circle" alt="Image">
        `;
    });
    if (likedByUsers.length > 0) {
        likedByHTML = `
        <div class="d-flex align-items-center mt-2 js-liked-by">
            <div class="d-flex">
                ${likedByProfilesHTML}
            </div>
            <div class="ms-1 fs-6">
                Liked by
                <a href="#!" class="fw-semibold fs-6 ms-1 text-decoration-none text-dark">${likedByUsers[0]}</a>
                and
                <button class="fw-semibold fs-6 ms-1 bg-transparent border-0 p-0"><span class="js-liked-by-counter">${likes - 1}</span> others</button>
            </div>
        </div>
        `;
    } else {
        likedByHTML = `
        <div class="js-liked-by">
        </div>
        `;
    }
    
    return likedByHTML;
}

function createCaptionHTML(post) {
    let captionHTML = `
    <div class="js-post-caption">
        <a href="#!" class="username fw-semibold text-decoration-none text-dark">${post.authors[0]}</a>
        ${post.isVerified ? '<span class="bi bi-patch-check-fill text-primary verified-icon"></span>' : ''}
        <span>${post.caption}</span>
    </div>
    <button class="small-text fw-semibold bg-transparent border-0 p-0"> See translation</button>
    `;
    return captionHTML;
}

function renderPosts(postsData) {
    postsContainer.innerHTML = ''; 

    postsData.forEach(post => {
        
        let profilePicsHTML = createProfilePicsHTML(post);

        let authorsNamesHTML = createAuthorsHTML(post);

        let postContentHTML = createPostContentHTML(post, profilePicsHTML, authorsNamesHTML);

        let postButtonsHTML = createPostButtonsHTML(post);

        let likedByHTML = createLikedByHTML(post.likedByUsers, post.stats.likes);

        let captionHTML = createCaptionHTML(post);

        const postHTML = `
        <div class="card mb-2 border-0 js-all-post" data-post-id="${post.id}">
        
            ${postContentHTML}

            <div class="card-body border-0 js-card-body">
                ${postButtonsHTML}

                ${likedByHTML}  
            
                ${captionHTML}
            </div>
        </div>
        `;

        postsContainer.innerHTML += postHTML;

    });
    document.querySelectorAll('video, audio').forEach(media => { // mute all audios
    media.muted = true;
    media.currentTime = 0;
    });
}

renderPosts(allPostsData);