const postsContainer = document.querySelector('.instagram-posts'); // Global variable to store posts html elements
const commentPopupBackground = document.querySelector('.comment-popup-background');
const textColour = {video: 'text-white', image: 'text-dark', text: 'text-dark'};
let allPostsData = []; // Start with an empty array

function formatTimeAgo(createdAt) {
    const createdTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdTime)) return '';

    const seconds = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

    return new Date(createdTime).toLocaleDateString();
}

function refreshPostTimes() {
    document.querySelectorAll('.js-post-time-value').forEach(timeElement => {
        timeElement.textContent = formatTimeAgo(timeElement.dataset.createdAt);
    });
}

setInterval(refreshPostTimes, 60000);

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
        if (typeof clearFeedAdvancedSearch === 'function') {
        clearFeedAdvancedSearch();} // clear filter button
        renderPosts(allPostsData);
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

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
            return { success: true, post: createdPost };
        } else {
            // If the server blocked it (like XSS), extract the error message
            const errData = await response.json();
            return { success: false, error: errData.error || errData.message || "Failed to upload post." };
        }
    } catch (error) {
        console.error('Error adding new post:', error);
        return { success: false, error: "Connection error. Please try again." };
    }
}

// Update the deletePostById function to send delete request to the server
async function deletePostById(deleteId) {
    // Disable any clicked delete button to prevent duplicate triggers
    const deleteBtn = document.querySelector(`.delete-post-btn[data-id="${deleteId}"]`);
    if (deleteBtn) deleteBtn.classList.add('pe-none');

    let deleteLoadingScreen = document.getElementById('postDeleteLoadingScreen');
    if (deleteLoadingScreen) {
        deleteLoadingScreen.classList.remove('d-none');
        deleteLoadingScreen.classList.add('d-flex');
    }

    try {
        const response = await fetch(`/api/posts/deletePost/${deleteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closePopupComment(null, true);
            await fetchPostsFromServer();
        }
    } catch (error) {
        console.error('Error deleting post:', error);
    } finally {
        if (deleteBtn) deleteBtn.classList.remove('pe-none');
        if (deleteLoadingScreen) {
            deleteLoadingScreen.classList.remove('d-flex');
            deleteLoadingScreen.classList.add('d-none');
        }
    }
}

async function editPostData(postId, newCaption, newLocation) {
    const loadingScreen = document.getElementById('postUploadLoadingScreen');
    const loadingText = loadingScreen ? loadingScreen.querySelector('h5') : null;
    const originalText = loadingText ? loadingText.innerText : "";
    const saveBtn = document.querySelector('#editPostModal .btn-primary');

    if (loadingText) loadingText.innerText = "Saving your edits...";
    if (loadingScreen) loadingScreen.classList.remove('d-none');

    try {
        const response = await fetch(`/api/posts/updatePost/${postId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caption: newCaption, location: newLocation })
        });

        if (response.ok) {
            const postIndex = allPostsData.findIndex(p => p._id === postId);
            if (postIndex !== -1) {
                allPostsData[postIndex].caption = newCaption;
                allPostsData[postIndex].location = newLocation;
            }
            renderPosts(allPostsData);
            closeEditModal();
            return { success: true };
        } else {
            const errData = await response.json();
            return { success: false, error: errData.error || errData.message || "Failed to update post" };
        }
    } catch (error) {
        console.error('Error updating post:', error);
        return { success: false, error: "Connection error. Please try again." };
    } finally {
        // Re-enable save button and reset loading screen
        if (loadingScreen) loadingScreen.classList.add('d-none');
        if (loadingText) loadingText.innerText = originalText;
    }
}

// Update a post's UI after a like/unlike or save/unsave action
async function updatePostButtonsUI(postId) {
    const post = allPostsData.find(p => p._id === postId);
    if (!post) return;

    // Use CURRENT_USER_ID to check if the user liked or saved the post
    const isLiked = post.likedByUsers.some(u => (u._id || u) === CURRENT_USER_ID);
    const isSaved = post.savedByUsers.some(u => (u._id || u) === CURRENT_USER_ID);

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

function getSafeAuthors(post) {
    const authors = post?.authors;
    return (Array.isArray(authors) ? authors : []).filter(Boolean);
}

function createAuthorsHTML(post) {
    const safeAuthors = getSafeAuthors(post);
    const primaryUsername = safeAuthors[0]?.username || 'Unknown';
    const secondaryUsername = safeAuthors[1]?.username || 'Unknown';
    const mediaTypeClass = textColour[post?.mediaType] || '';

    let authorsNamesHTML = '';
    if (safeAuthors.length > 1) {
        authorsNamesHTML = `
            <a href="#!" class="username ms-2 fw-semibold text-decoration-none ${mediaTypeClass} small-text">${primaryUsername}</a>
            <span class="ms-1">and</span>
            <a href="#!" class="username ms-1 fw-semibold text-decoration-none ${mediaTypeClass} small-text">${secondaryUsername}</a>
        `;
    } else {
        authorsNamesHTML = `
            <a href="#!" class="username ms-2 fw-semibold text-decoration-none ${mediaTypeClass} small-text">${primaryUsername}</a>
        `;
    }
    return authorsNamesHTML;
}

function createProfilePicsHTML(post) {
    const safeAuthors = getSafeAuthors(post);
    const primaryProfilePic = safeAuthors[0]?.profilePic || '/elements/media/profile-pictures/Default_pfp.jpg';
    const secondaryProfilePic = safeAuthors[1]?.profilePic || '/elements/media/profile-pictures/Default_pfp.jpg';
    const primaryUsername = safeAuthors[0]?.username || 'Unknown';
    const secondaryUsername = safeAuthors[1]?.username || 'Unknown';

    let profilePicsHTML = '';
    if (safeAuthors.length > 1) {
        profilePicsHTML = `
            <div>
                <a href="#!" class="text-decoration-none text-dark">
                    <img src="${primaryProfilePic}" data-username="${primaryUsername}" class="img-fluid rounded-circle joint-first-profile-pic position-relative z-2 border border-1 border-white" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" alt="Image">
                </a>
                <a href="#!" class="text-decoration-none text-dark">
                    <img src="${secondaryProfilePic}" data-username="${secondaryUsername}" class="img-fluid rounded-circle joint-second-profile-pic position-relative z-1 border border-1 border-white" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" alt="Image">
                </a>
            </div>
        `;
    } else {
        profilePicsHTML = `
            <a href="#!" class="text-decoration-none text-dark profile-circle">
                <img src="${primaryProfilePic}" data-username="${primaryUsername}" class="img-fluid rounded-circle post-profile-pic" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" alt="Image">
            </a>
        `;
    }
    return profilePicsHTML;
}

function createPostContentHTML(post, profilePicsHTML, authorsNamesHTML) {
    let optionsMenuHTML = '';

    const safeAuthors = getSafeAuthors(post);

    // Check if the current user is one of the authors or the group admin
    const isCurrentUserAuthor = safeAuthors.some(author => String(author._id || author) === CURRENT_USER_ID);
    const isGroupAdmin = Boolean(post.groupAdminId && String(post.groupAdminId) === CURRENT_USER_ID);

    if (isCurrentUserAuthor || isGroupAdmin) {
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
        // If the current user is not an author or group admin, leave it empty
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

    // Extract location name from new location object
    let combinedSubHeaderText = '';
    let postLocationName = post.location && post.location.name ? post.location.name : '';
    
    // Combine group name with location if both exist
    if (post.group && post.group.name) {
        if (postLocationName.trim() !== "") {
            combinedSubHeaderText = `<span class="fw-bold">${post.group.name}</span> &bull; <span class="text-decoration-none text-muted">${postLocationName}</span>`;
        } else {
            combinedSubHeaderText = `<span class="fw-bold">${post.group.name}</span>`;
        }
    } else {
        combinedSubHeaderText = postLocationName;
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
                                    <span class="text-white ms-1 small-text js-post-time-value" data-created-at="${post.createdAt}">${formatTimeAgo(post.createdAt)}</span>
                                </div>
                            </div>
                            <a href="#!" class="ms-2 text-decoration-none text-white text-12 text-start">${combinedSubHeaderText}</a>
                        </div>
                    </div>
                    ${optionsMenuHTML}
                </div>
                
                <div class="js-post-media position-relative">
                    <video id="video-${post._id}" src="${post.mediaSource}" class="img-fluid rounded-2 main-post w-100" autoplay muted playsinline controls onended="restartMedia(this)" onerror="this.outerHTML='<img src=&quot;/elements/media/posts/main-posts/error-post.jpg&quot; class=&quot;img-fluid rounded-2 main-post&quot;>'"></video>
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
                                <span class="text-muted ms-1 small-text js-post-time-value" data-created-at="${post.createdAt}">${formatTimeAgo(post.createdAt)}</span>
                            </span>
                        </div>
                        <button class="bg-transparent border-0 p-0 ms-2 text-12 text-start">${combinedSubHeaderText}</button>
                    </div>
                </div>
                ${optionsMenuHTML}
            </div>
            
            <div class="position-relative js-post-media">
                <img src="${post.mediaSource}" class="img-fluid rounded-2 main-post" onerror="this.onerror=null; this.src='/elements/media/posts/main-posts/error-post.jpg'" alt="Image">
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
                                <span class="text-muted ms-1 small-text js-post-time-value" data-created-at="${post.createdAt}">${formatTimeAgo(post.createdAt)}</span>
                            </span>
                        </div>
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
    let isLiked = post.likedByUsers && post.likedByUsers.some(u => (u._id || u) === CURRENT_USER_ID);
    let isSaved = post.savedByUsers && post.savedByUsers.some(u => (u._id || u) === CURRENT_USER_ID);

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
                    <span class="ms-1 js-comments-counter">${post.stats.comments}</span>
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
    const otherUsers = likedByUsers.filter(user => (user._id || user) !== CURRENT_USER_ID);
    
    const usersToShow = otherUsers.slice(0, 3);

    usersToShow.forEach(user => {
        // Access populated profile picture directly
        likedByProfilesHTML += `
            <img src="${user.profilePic}" data-username="${user.username}" class="liked-by-profile-pic rounded-circle" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" alt="Image">
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
    const safeAuthors = getSafeAuthors(post);
    const primaryAuthor = safeAuthors[0] || { username: 'Unknown' };

    let captionHTML = `
    <div class="js-post-caption">
        <a href="#!" class="username fw-semibold text-decoration-none text-dark">${primaryAuthor.username || 'Unknown'}</a>
        ${post.isVerified ? '<span class="bi bi-patch-check-fill text-primary verified-icon"></span>' : ''}
        <span>${post.caption || ''}</span>
    </div>
    <button class="small-text fw-semibold bg-transparent border-0 p-0 text-muted" onclick="showRickRollTranslation()">See translation</button>
    `;
    return captionHTML;
}

function showRickRollTranslation() {
    alert("Never gonna give you up\nNever gonna let you down\nNever gonna run around and desert you\nNever gonna make you cry\nNever gonna say goodbye\nNever gonna tell a lie and hurt you");
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

let globalPostsMap = null;

// ===== Global Map Feature =====
// Renders an interactive map showing all posts with location data
// Allows users to see geographic distribution of posts and view post info via markers
function showAllPostsOnMap() {
    const mapOverlay = document.getElementById('globalPostsMapOverlay');
    mapOverlay.classList.remove('d-none');

    setTimeout(() => {
        if (!globalPostsMap) {
            globalPostsMap = L.map('globalLeafletMap').setView([32.0853, 34.7818], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(globalPostsMap);
        } else {
            // Reset the map view to default center and zoom when reopened
            globalPostsMap.setView([32.0853, 34.7818], 5);
            
            // Close any active popups from previous views
            globalPostsMap.closePopup();
        }

        // Remove existing markers before rendering new ones
        globalPostsMap.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                globalPostsMap.removeLayer(layer);
            }
        });

        // Render all posts with location markers on map
        // Each marker shows location name and author info on click
        allPostsData.forEach(post => {
            // Only show posts that have valid location coordinates
            if (post.location && post.location.lat !== null && post.location.lng !== null) {
                const marker = L.marker([post.location.lat, post.location.lng]).addTo(globalPostsMap);
                const authorName = post.authors && post.authors[0] ? post.authors[0].username : "Unknown";
                marker.bindPopup(`<b>${post.location.name}</b><br>Posted by: ${authorName}`);
            }
        });

        // Ensure the map resizes correctly inside the modal
        globalPostsMap.invalidateSize();
    }, 100);
}

fetchPostsFromServer(); // Call the fetchPostsFromServer function to fetch posts from the server and then render them