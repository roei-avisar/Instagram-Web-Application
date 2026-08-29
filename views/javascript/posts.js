const postsContainer = document.querySelector('.instagram-posts'); // Global variable to store posts html elements
const commentPopupBackground = document.querySelector('.comment-popup-background');
const textColour = {video: 'text-white', image: 'text-dark', text: 'text-dark'};
let currentUsername = ""; // Global variable to store the logged-in user
let currentUserId = ""; // Global variable to store the logged-in user ID
let allPostsData = []; // Start with an empty array

// Fetch current user and then load posts
async function initPosts() {
    try {
        const userRes = await fetch('/api/user/getUserDetails');
        if (userRes.ok) {
            const userData = await userRes.json();
            currentUsername = userData.username;
            currentUserId = userData.userId; // Store current user ID
        }
    } catch (error) {
        console.error("Could not fetch current user", error);
    }
    
    // Only fetch posts after we know who the current user is
    fetchPostsFromServer();
}

// Fetch initial post data from the server
async function fetchPostsFromServer() {
    try {
        const response = await fetch('/api/posts/getFeedPosts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        allPostsData = await response.json();
        renderPosts(allPostsData);
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

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
            // Checking against populated username object
            const inAuthors = post.authors.some(author => author.username.toLowerCase().includes(value.toLowerCase()));
            const inText = post.mediaType === 'text' && post.mediaSource.toLowerCase().includes(value.toLowerCase());
            return inCaption || inAuthors || inText;
        });
    }
};

// Create new post by sending a POST request to the server
async function addNewPost(newPostData) {
    try {
        const response = await fetch('/api/posts/createPost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPostData)
        });

        if (response.ok) {
            // Refresh the posts from the server after adding
            await fetchPostsFromServer();
            
            // Re-apply the glow effect to the newest post (which is now at index 0)
            if (allPostsData.length > 0) {
                const newestId = allPostsData[0]._id;
                setTimeout(() => {
                    const newPostElement = document.querySelector(`[data-post-id="${newestId}"]`);
                    if (newPostElement) {
                        newPostElement.classList.add('new-post-glow');
                        setTimeout(() => {
                            newPostElement.classList.remove('new-post-glow');
                        }, 5000);
                    }
                }, 100); // Small delay to allow DOM to render
            }
            const createdPost = await response.json();
            return createdPost;
        }
    } catch (error) {
        console.error('Error adding new post:', error);
    }
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

// Update the deletePostById function to send delete request to the server
async function deletePostById(deleteId) {
    try {
        const response = await fetch(`/api/posts/deletePost/${deleteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closePopupComment(null, true);
            // Refresh the posts from the server after deleting
            await fetchPostsFromServer();
        }
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}

async function editPostData(postId, newCaption, newSubHeader) {
    try {
        const response = await fetch(`/api/posts/updatePost/${postId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caption: newCaption, subHeader: newSubHeader })
        });

        if (response.ok) {
            // Update the local array to avoid the need for a fresh fetch of the entire feed
            const postIndex = allPostsData.findIndex(p => p._id === postId);
            if (postIndex !== -1) {
                allPostsData[postIndex].caption = newCaption;
                allPostsData[postIndex].subHeader = newSubHeader;
            }
            applyFilters(); // Re-render the posts with the updated data
            closeEditModal();
        } else {
            const errData = await response.json();
            alert(errData.message || "Failed to update post");
        }
    } catch (error) {
        console.error('Error updating post:', error);
    }
}

// Update a post's UI after a like/unlike or save/unsave action
async function updatePostButtonsUI(postId) {
    const post = allPostsData.find(p => p._id === postId);
    if (!post) return;

    // Use currentUserId to check if the user liked or saved the post
    const isLiked = post.likedByUsers.some(u => (u._id || u) === currentUserId);
    const isSaved = post.savedByUsers.some(u => (u._id || u) === currentUserId);

    // Update both the main post and any popups that might be open for this post (for example, the comment popup)
    const postElements = document.querySelectorAll(`[data-post-id="${postId}"]`);
    postElements.forEach(postElement => {
        // Update heart icon & counter
        const heartBtn = postElement.querySelector('.js-like-container .post-icons');
        if (heartBtn) {
            heartBtn.className = `bi ${isLiked ? 'bi-heart-fill text-danger' : 'bi-heart'} fs-4 fw-bold bg-transparent border-0 p-0 post-icons`;
        }

        // Counter might not exist in the popup HTML structure, so we check if it exists
        const likeCounter = postElement.querySelector(".js-like-counter");
        if (likeCounter) {
            likeCounter.innerText = post.stats.likes;
        }

        // Update save icon
        const saveBtn = postElement.querySelector('.js-save-button');
        if (saveBtn) {
            saveBtn.className = `js-save-button bi ${isSaved ? 'bi-bookmark-fill text-dark' : 'bi-bookmark'} fs-4 fw-bold bg-transparent border-0 p-0 post-icons`;
        }
    });
}

function createAuthorsHTML(post) {
    let authorsNamesHTML = '';
    if (post.authors.length > 1) {
        // Access populated username
        authorsNamesHTML = `
            <a href="#!" class="username ms-2 fw-semibold text-decoration-none ${textColour[post.mediaType]} small-text">${post.authors[0].username}</a>
            <span class="ms-1">and</span>
            <a href="#!" class="username ms-1 fw-semibold text-decoration-none ${textColour[post.mediaType]} small-text">${post.authors[1].username}</a>
        `;
    } else {
        authorsNamesHTML = `
            <a href="#!" class="username ms-2 fw-semibold text-decoration-none ${textColour[post.mediaType]} small-text">${post.authors[0].username}</a>
        `;
    }
    return authorsNamesHTML;
}

function createProfilePicsHTML(post) {
    let profilePicsHTML = '';
    if (post.authors.length > 1) {
        // Access populated profilePic
        profilePicsHTML = `
            <div>
                <a href="#!" class="text-decoration-none text-dark">
                    <img src="${post.authors[0].profilePic}" class="img-fluid rounded-circle joint-first-profile-pic position-relative z-2 border border-1 border-white" onerror="this.src='/images/profiles/Default_pfp.jpg'" alt="Image">
                </a>
                <a href="#!" class="text-decoration-none text-dark">
                    <img src="${post.authors[1].profilePic}" class="img-fluid rounded-circle joint-second-profile-pic position-relative z-1 border border-1 border-white" onerror="this.src='/images/profiles/Default_pfp.jpg'" alt="Image">
                </a>
            </div>
        `;
    } else {
        profilePicsHTML = `
            <a href="#!" class="text-decoration-none text-dark profile-circle">
                <img src="${post.authors[0].profilePic}" class="img-fluid rounded-circle post-profile-pic" onerror="this.src='/images/profiles/Default_pfp.jpg'" alt="Image">
            </a>
        `;
    }
    return profilePicsHTML;
}

function createPostContentHTML(post, profilePicsHTML, authorsNamesHTML) {
    let optionsMenuHTML = '';

    // Check if the current user is one of the authors of the post
    const isCurrentUserAuthor = post.authors.some(author => (author._id || author) === currentUserId);

    if (isCurrentUserAuthor) {
        optionsMenuHTML = `
        <div class="position-relative">
            <button class="bi bi-three-dots fs-4 bg-transparent border-0 p-0 ${textColour[post.mediaType]} options-btn"></button>

            <div class="d-none post-options-dropdown">
                <button class="edit-post-btn" data-id="${post._id}">
                    Edit Post <span class="bi bi-pencil"></span>
                </button>
                <button class="delete-post-btn" data-id="${post._id}">
                    Delete Post <span class="bi bi-trash"></span>
                </button>
            </div>
        </div>
        `;
    } else {
        // If the current user is not an author leave it empty
        optionsMenuHTML = `<div></div>`;
    }

    let audioTagHTML = '';
    if (post.audioSource) {
        let isLoop = post.mediaType === "video" ? "" : "loop"; 
        audioTagHTML = `<audio id="audio-${post._id}" src="${post.audioSource}" autoplay muted ${isLoop}></audio>`;
    }

    let muteButtonHTML = '';
    if (post.audioSource) {
        muteButtonHTML = `
        <div class="tiny-icon-background position-absolute bottom-0 end-0 m-3 bg-dark bg-opacity-50 rounded-circle d-flex justify-content-center align-items-center" style="z-index: 5;">
            <button class="bi bi-volume-mute-fill text-white bg-transparent border-0 p-0" onclick="togglePostAudio(this, '${post._id}')"></button>
        </div>`;
    }

    let combinedSubHeaderText = '';
    
    if (post.group && post.group.name) {
        // Combine the group name and subHeader if both exist, otherwise just use the group name
        if (post.subHeader && post.subHeader.trim() !== "") {
            combinedSubHeaderText = `<span class="fw-bold">${post.group.name}</span> &bull; ${post.subHeader}`;
        } else {
            combinedSubHeaderText = `<span class="fw-bold">${post.group.name}</span>`;
        }
    } else {
        // If there's no group, just use the subHeader as is (or empty if it's not set)
        combinedSubHeaderText = post.subHeader ? post.subHeader : '';
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
                            <!-- תיקון: שימוש במשתנה המשולב -->
                            <a href="#!" class="ms-2 text-decoration-none text-white text-12 text-start">${combinedSubHeaderText}</a>
                        </div>
                    </div>
                    ${optionsMenuHTML}
                </div>
                
                <div class="js-post-media position-relative">
                    <video id="video-${post._id}" src="${post.mediaSource}" class="img-fluid rounded-2 main-post w-100" autoplay muted playsinline onended="restartMedia(this)"></video>
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
                        <button class="bg-transparent border-0 p-0 ms-2 text-12 text-start">${combinedSubHeaderText}</button>
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
                        <!-- תיקון: שימוש במשתנה המשולב -->
                        <button class="bg-transparent border-0 p-0 ms-2 text-12 text-start">${combinedSubHeaderText}</button>
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
    // Check if the current user ID is in the liked or saved arrays
    let isLiked = post.likedByUsers && post.likedByUsers.some(u => (u._id || u) === currentUserId);
    let isSaved = post.savedByUsers && post.savedByUsers.some(u => (u._id || u) === currentUserId);

    let heartClass = isLiked ? "bi-heart-fill" : "bi-heart";
    let heartTextColor = isLiked ? "text-danger" : "";

    let bookmarkClass = isSaved ? "bi-bookmark-fill" : "bi-bookmark";
    let bookmarkTextColor = isSaved ? "text-dark" : "";

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

    // Filter out current user based on user ID
    const otherUsers = likedByUsers.filter(user => (user._id || user) !== currentUserId);
    
    const usersToShow = otherUsers.slice(0, 3);

    usersToShow.forEach(user => {
        // Access populated profile picture directly
        likedByProfilesHTML += `
            <img src="${user.profilePic}" class="liked-by-profile-pic rounded-circle" onerror="this.src='/images/profiles/Default_pfp.jpg'" alt="Image">
        `;
    });

    if (usersToShow.length > 0) {
        let displayUserName = usersToShow[0].username;

        likedByHTML = `
        <div class="d-flex align-items-center mt-2 js-liked-by">
            <div class="d-flex">
                ${likedByProfilesHTML}
            </div>
            <div class="ms-1 fs-6">
                Liked by
                <a href="#!" class="fw-semibold fs-6 ms-1 text-decoration-none text-dark">${displayUserName}</a>
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
        <a href="#!" class="username fw-semibold text-decoration-none text-dark">${post.authors[0].username}</a>
        ${post.isVerified ? '<span class="bi bi-patch-check-fill text-primary verified-icon"></span>' : ''}
        <span>${post.caption}</span>
    </div>
    <button class="small-text fw-semibold bg-transparent border-0 p-0"> See translation</button>
    `;
    return captionHTML;
}

function renderPosts(postsData) {
    let allPostsHTML = ''; // Accumulate all HTML here

    postsData.forEach(post => {
        let profilePicsHTML = createProfilePicsHTML(post);
        let authorsNamesHTML = createAuthorsHTML(post);
        let postContentHTML = createPostContentHTML(post, profilePicsHTML, authorsNamesHTML);
        let postButtonsHTML = createPostButtonsHTML(post);
        let likedByHTML = createLikedByHTML(post.likedByUsers, post.stats.likes);
        let captionHTML = createCaptionHTML(post);

        const postHTML = `
        <div class="card mb-2 border-0 js-all-post" data-post-id="${post._id}">
            ${postContentHTML}
            <div class="card-body border-0 js-card-body">
                ${postButtonsHTML}
                ${likedByHTML}  
                ${captionHTML}
            </div>
        </div>
        `;

        allPostsHTML += postHTML; // Append to the string, not the html directly to avoid multiple reflows
    });

    // Update the html only once
    postsContainer.innerHTML = allPostsHTML;

    // Mute all audios
    document.querySelectorAll('video, audio').forEach(media => { 
        media.muted = true;
        media.currentTime = 0;
    });

    // Hide the loading screen and show the main app after rendering posts
    document.getElementById('loadingScreen').classList.remove('d-flex');
    document.getElementById('loadingScreen').classList.add('d-none');
    document.getElementById('mainApp').classList.remove('d-none');
}

initPosts(); // Call the initPosts function to fetch current user and then load posts