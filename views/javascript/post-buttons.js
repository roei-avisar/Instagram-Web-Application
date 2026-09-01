<<<<<<< HEAD
const timeDictionary = {
    's': 'seconds',
    'm': 'minutes',
    'h': 'hours',
    'd': 'days',
    'w': 'weeks'
};
=======
const friends = [
    { 
        id: "jamil-1",
        username: "jamil.abukhaima", 
        fullName: "Jamil", 
    },
    { 
        id: "sara-2",
        username: "sara22", 
        fullName: "Sara Haya", 
    },
    { 
        id: "tomer-3",
        username: "tomer19", 
        fullName: "TOMER ;)", 
    },
    { 
        id: "maya-4",
        username: "maya_99", 
        fullName: "Mayosh", 
    },
    { 
        id: "nalin-5",
        username: "nalin12", 
        fullName: "נלין", 
    },
    { 
        id: "jacob-6",
        username: "jacob-ashkenazi2", 
        fullName: "jacob the king", 
    },
    { 
        id: "noa-7",
        username: "noa.nesh1", 
        fullName: "NOA NESHIKA", 
    },
    { 
        id: "omer-8",
        username: "omer_44", 
        fullName: "omer isha", 
    },
    { 
        id: "alex-9",
        username: "alex_56", 
        fullName: "אלכס קורקינט", 
    },
    { 
        id: "lili-10",
        username: "lili_18", 
        fullName: "lola", 
    },
    { 
        id: "guy-11",
        username: "guy_13", 
        fullName: "some guy ;0", 
    },
    { 
        id: "dan-12",
        username: "dan_11", 
        fullName: "danny din", 
    }
];
>>>>>>> 8da847c0719d056e2a1d5a603f55bf7caac3d153

let selectedShareFriends = {};
let shareContactsCache = []; // last contact list rendered in the Share popup (same source as the chat list)

async function likePost(button) {
    let idDiv = button.closest('[data-post-id]');
    if (!idDiv) return;
    let postId = idDiv.dataset.postId;

    // 1. Optimistic local data update using user ID
    let post = allPostsData.find(p => p._id === postId);
    if (post) {
        if (post.likedByUsers.some(u => (u._id || u) === CURRENT_USER_ID)) {
            post.likedByUsers = post.likedByUsers.filter(u => (u._id || u) !== CURRENT_USER_ID);
            post.stats.likes = Math.max(0, post.stats.likes - 1);
        } else {
            post.likedByUsers.push(CURRENT_USER_ID);
            post.stats.likes += 1;
        }
    }

    button.classList.add('button-pop-animation');
    setTimeout(() => button.classList.remove('button-pop-animation'), 300);

    // 2. Render UI based on updated local data
    updatePostButtonsUI(postId);

    // 3. Sync with server using userId parameter
    await fetch(`/api/posts/like/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: CURRENT_USER_ID })
    });
}

async function savePost(button) {
    let idDiv = button.closest('[data-post-id]');
    if (!idDiv) return;
    let postId = idDiv.dataset.postId;

    // 1. Optimistic local data update using user ID
    let post = allPostsData.find(p => p._id === postId);
    if (post) {
        if (post.savedByUsers.some(u => (u._id || u) === CURRENT_USER_ID)) {
            post.savedByUsers = post.savedByUsers.filter(u => (u._id || u) !== CURRENT_USER_ID);
        } else {
            post.savedByUsers.push(CURRENT_USER_ID);
        }
    }

    button.classList.add('button-pop-animation');
    setTimeout(() => button.classList.remove('button-pop-animation'), 300);

    // 2. Render UI based on updated local data
    updatePostButtonsUI(postId);

    // 3. Sync with server using userId parameter
    await fetch(`/api/posts/save/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: CURRENT_USER_ID })
    });
}

// Main comments function to open and startup a post comments popup
function popupCommentMaker(comment) {
    let commentPopupBackground = document.querySelector(".comment-popup-background");
    commentPopupBackground.classList.remove('d-none');
    commentPopupBackground.classList.add('d-flex'); // display the pop up window (changing from d-none to d-flex) 
    commentPopupBackground.querySelector(".comment-popup-container").classList.add('comment-popup-animation'); // adding animation class to the pop up window 
    document.body.classList.add('overflow-hidden'); // make the scrolling behind the popup to unavailable 
    let allPost = comment.closest(".js-all-post");
    let postId = allPost.dataset.postId;
    commentPopupBackground.dataset.postId = postId;
        
    addPostToPopupComment(commentPopupBackground, allPost);
    addHeaderToPopupComment(commentPopupBackground, allPost);
    addLikedByToPopupComment(commentPopupBackground, allPost);
    addCommentsToPopupComment(commentPopupBackground, allPost);
    addTypingLineToPopupComment(commentPopupBackground, allPost);

    // Sync the buttons in the popup to the current state of the post
    updatePostButtonsUI(postId);
}

// Copy post media to the post comments popup
function addPostToPopupComment(commentPopupBackground, allPost) {
    let commentPopupPost = commentPopupBackground.querySelector(".comment-popup-post");
    let postMedia = allPost.querySelector(".js-post-media");
    
    if (postMedia) {
        commentPopupPost.innerHTML = postMedia.outerHTML; 
    } else {
        commentPopupPost.innerHTML = "";
    }

    let popupVolumeBtn = commentPopupPost.querySelector('.bi-volume-up-fill');
    if (popupVolumeBtn) {
        popupVolumeBtn.classList.remove('bi-volume-up-fill');
        popupVolumeBtn.classList.add('bi-volume-mute-fill');
    }
    document.querySelectorAll('.instagram-posts audio, .instagram-posts video').forEach(media => {
        media.muted = true;
    });
    document.querySelectorAll('.instagram-posts .bi-volume-up-fill').forEach(btn => {
        btn.classList.remove('bi-volume-up-fill');
        btn.classList.add('bi-volume-mute-fill');
    });
}

function addHeaderToPopupComment(commentPopupBackground, allPost){
    let commentPopupHeader = commentPopupBackground.querySelector(".js-popup-header-slot");
    commentPopupHeader.innerHTML = allPost.querySelector(".js-post-header").outerHTML; // header post copy to popup 

    let copiedHeader = commentPopupHeader.querySelector(".js-post-header");
    copiedHeader.className = "card-header bg-white d-flex justify-content-between align-items-center border-0 js-post-header";// override all the classes from the video profile headers
    
    let whiteTexts = copiedHeader.querySelectorAll(".text-white");
    whiteTexts.forEach(el => {
        el.classList.remove("text-white");
        el.classList.add("text-dark");
    });

    let postTime = commentPopupHeader.querySelector(".js-post-time"); // Hide the time 
    postTime.classList.add("d-none");
}

function addLikedByToPopupComment(commentPopupBackground, allPost){
    let commentPopupHeader = commentPopupBackground.querySelector(".js-popup-header-slot");
    let commentPopuplikedBy = commentPopupBackground.querySelector(".js-popup-likedBy-slot");
    let likedBy = allPost.querySelector(".js-liked-by").outerHTML;
    let currentPost = allPostsData.find(post => post._id === allPost.dataset.postId);

    commentPopuplikedBy.innerHTML = `
        ${likedBy}
        <div class="text-muted text-12 mt-2">${formatTimeAgo(currentPost?.createdAt)} ago</div>
    `;

}

// 3. Render the comments list dynamically from MongoDB data
function addCommentsToPopupComment(commentPopupBackground, allPost) {
    let postId = allPost.dataset.postId;
    
    // Fetch the post from our global post array
    let currentPost = allPostsData.find(post => post._id === postId);
    let postComments = currentPost ? currentPost.comments : [];
    
    let commentPopupList = commentPopupBackground.querySelector(".js-popup-comments-slot");
    commentPopupList.innerHTML = "";
    
    // Fetch populated author profile picture
    let authorProfilePic = currentPost && currentPost.authors.length > 0 ? currentPost.authors[0].profilePic : "";
    let captionHTML = allPost.querySelector(".js-post-caption");
    
    let commentPopupHeader = commentPopupBackground.querySelector(".js-popup-header-slot");
    let postTimeElement = commentPopupHeader.querySelector(".js-post-time");
    let time = postTimeElement ? postTimeElement.innerText.replace('•', '').trim() : "";

    // Render the post caption first
    if (captionHTML && captionHTML.innerText.trim() !== "") {
        let caption = captionHTML.innerHTML;
        let popupAuthorUsername = currentPost && currentPost.authors.length > 0 ? currentPost.authors[0].username : "";
        commentPopupList.innerHTML = `
        <div class="d-flex m-3">
            <div class="flex-shrink-0">
                <img src="${authorProfilePic}" data-username="${popupAuthorUsername}" class="rounded-circle" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" style="width: 32px; height: 32px; object-fit: cover;">
            </div>
            <div class="w-100 ms-2 text-break" style="min-width: 0;">
                ${caption}
                <div class="mt-1 text-muted text-12">
                    <span>${time}</span>
                </div>
            </div>
        </div>
        `;
    }

    // Render actual comments from the database
    if (postComments && postComments.length > 0) {
        postComments.forEach((comment, index) => {
            // Guard clause: if comments aren't populated from DB, skip rendering to prevent errors
            if (typeof comment === 'string') return;

            // Check if liked by matching user ID
            let isLiked = comment.likedBy && comment.likedBy.some(u => (u._id || u) === CURRENT_USER_ID);
            let heartClass = isLiked ? "bi-heart-fill text-danger" : "bi-heart text-muted";
            let commentLikes = comment.likes || 0;
            
            // Extract username and profile picture from populated userId object
            let commentUsername = comment.userId && comment.userId.username ? comment.userId.username : "Unknown";
            let commentProfilePic = comment.userId && comment.userId.profilePic ? comment.userId.profilePic : "elements/media/profile-pictures/default.jpg";
            let commentText = comment.text || "";
            
            // Format comment date if available
            let commentTime = comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "Just now";
            
            let commentHTML = `
                <div class="d-flex m-3 align-items-start js-comment-row">
                    <div class="flex-shrink-0">
                        <img src="${commentProfilePic}" data-username="${commentUsername}" class="rounded-circle" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" style="width: 32px; height: 32px; object-fit: cover;">
                    </div>
                    <div class="w-100 ms-2 text-break" style="min-width: 0;">
                        <a href="#!" class="username fw-semibold text-decoration-none text-dark">${commentUsername}</a>
                        <span class="ms-1">${commentText}</span>

                        <div class="d-flex align-items-center mt-1 text-muted text-12" style="gap: 12px;">
                            <span>${commentTime}</span>
                            <span class="fw-semibold js-comment-likes-count" style="cursor: pointer;">${commentLikes} likes</span>
                            <button class="bg-transparent border-0 p-0 text-muted fw-semibold" onclick="prepareReply('${commentUsername}')">Reply</button>
                        </div>
                    </div>
                    <div class="ms-3 mt-1">
                        <button class="bi ${heartClass} fs-6 bg-transparent border-0 p-0 post-icons" onclick="toggleCommentLike('${postId}', ${index}, this)"></button>
                    </div>
                </div>
            `;
            commentPopupList.innerHTML += commentHTML;
        });
    }
}

function addTypingLineToPopupComment(commentPopupBackground, allPost){
    let commentInput = commentPopupBackground.querySelector(".js-comment-input");
    let postButton = commentPopupBackground.querySelector(".js-post-button");
    let commentPopupList = commentPopupBackground.querySelector(".js-popup-comments-slot");
    
    commentInput.value = "";
    postButton.classList.add("opacity-50");
    postButton.classList.remove("opacity-100"); // while enter is pressed remove this class, this line has no meaning on first render
    postButton.classList.add("pe-none");
    postButton.dataset.postId = allPost.dataset.postId;

    let typingElement = document.createElement("div"); // make the "'user' is typing..."
    typingElement.className = "someone-is-typing my-3 mx-4 d-none";
    typingElement.innerHTML = `${CURRENT_USERNAME} is typing<span class="typing-dots ms-1"><span>.</span><span>.</span><span>.</span></span>`;
    commentPopupList.appendChild(typingElement);

    commentInput.oninput = () =>
         {
        if (commentInput.value.trim() !== "") // if someome wrote something that is not a blank line make posting available
        {
            if (postButton.classList.contains("pe-none")) // only on first letter that have been written the screen will scroll down
            {
                postButton.classList.remove("opacity-50");
                postButton.classList.add("opacity-100");
                postButton.classList.remove("pe-none");
                typingElement.classList.remove("d-none");
                commentPopupList.scrollTop = commentPopupList.scrollHeight;
            }
            
        } 
        else
        {
            postButton.classList.add("opacity-50");
            postButton.classList.remove("opacity-100");
            postButton.classList.add("pe-none");
            typingElement.classList.add("d-none");
        }
    };
    commentInput.onkeydown = (event) =>
    {
        if (event.key === "Enter") {
            event.preventDefault(); // do not get line down

            if (commentInput.value.trim() !== "") { //if enter pressed then publish a comment
                publishNewComment();
            }
        }
    };


    setTimeout(() => {
        if (commentInput) {
            commentInput.focus(); 
        }
    }, 100);
}

// 4. Publish a new comment by sending a POST request to the server
async function publishNewComment() {
    let commentInput = document.querySelector(".js-comment-input");
    let postButton = document.querySelector(".js-post-button");
    let typingElement = document.querySelector(".someone-is-typing");
    
    let newCommentText = commentInput.value.trim();
    
    if (newCommentText !== "") {
        let currentPostId = postButton.dataset.postId;

        try {
            // 1. Send the new comment to the server
            const response = await fetch(`/api/posts/addComment/${currentPostId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: newCommentText
                })
            });

            if (response.ok) {
                // 2. Clear input fields immediately
                commentInput.value = "";
                postButton.classList.add("opacity-50");
                postButton.classList.remove("opacity-100");
                postButton.classList.add("pe-none");
                if (typingElement) typingElement.classList.add("d-none");
                
                // 3. Fetch all posts again to update local data with the new comment
                await fetchPostsFromServer();
                
                // 4. Re-open/update the popup UI with the newly fetched comments
                let commentPopupBackground = document.querySelector(".comment-popup-background");
                let allPost = document.querySelector(`[data-post-id="${currentPostId}"]`);
                
                if (commentPopupBackground && allPost) {
                    addCommentsToPopupComment(commentPopupBackground, allPost);

                    const commentsCounter = allPost.querySelector('.js-comments-counter');
                    if (commentsCounter) {
                        commentsCounter.textContent = allPostsData.find(post => post._id === currentPostId)?.comments.length || 0;
                    }
                    
                    // Scroll to bottom to see the new comment
                    let commentPopupList = document.querySelector(".js-popup-comments-slot");
                    commentPopupList.scrollTop = commentPopupList.scrollHeight;
                }
            } else {
                console.error("Server failed to add comment");
            }
        } catch (error) {
            console.error("Error connecting to server for adding comment:", error);
        }
    }
}

async function toggleCommentLike(postId, commentIndex, buttonElement) {
    // Find the specific post and comment in our frontend database
    let currentPost = allPostsData.find(p => p._id === postId);
    if (!currentPost || !currentPost.comments) return;

    let comment = currentPost.comments[commentIndex];
    if (!comment) return;

    // Ensure likedBy array exists
    if (!comment.likedBy) comment.likedBy = [];

    // Check if current user ID is in likedBy array
    let isLiked = comment.likedBy.some(u => (u._id || u) === CURRENT_USER_ID);

    // Optimistic UI update
    if (isLiked) {
        // Unlike the comment
        comment.likedBy = comment.likedBy.filter(u => (u._id || u) !== CURRENT_USER_ID);
        comment.likes = Math.max(0, comment.likes - 1);
        buttonElement.classList.remove("bi-heart-fill", "text-danger");
        buttonElement.classList.add("bi-heart", "text-muted");
    } else {
        // Like the comment
        comment.likedBy.push(CURRENT_USER_ID);
        comment.likes += 1;
        buttonElement.classList.remove("bi-heart", "text-muted");
        buttonElement.classList.add("bi-heart-fill", "text-danger");
    }

    buttonElement.classList.add('button-pop-animation');
    setTimeout(() => buttonElement.classList.remove('button-pop-animation'), 300);

    let commentRow = buttonElement.closest('.js-comment-row');
    let likesCountSpan = commentRow.querySelector('.js-comment-likes-count');
    likesCountSpan.innerText = comment.likes + " likes";

    // Sync with the server using userId
    try {
        await fetch(`/api/posts/likeComment/${comment._id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: CURRENT_USER_ID })
        });
    } catch (error) {
        console.error("Error updating comment like on server:", error);
    }
}

function closePopupComment(event, forcedExit)
{
    let commentPopupBackground = document.querySelector(".comment-popup-background");
    if (forcedExit || !event?.target.closest('.comment-popup-container')) // if the mouse click were on the black background and not the white pop up window then delete the window
    {
        let popupMediaToStop = commentPopupBackground.querySelectorAll('video, audio');
        popupMediaToStop.forEach(media => {
        media.pause();
        });

        commentPopupBackground.classList.remove('d-flex');
        commentPopupBackground.classList.add('d-none'); // delete the pop up window (changing from d-flex to d-none) 
        commentPopupBackground.querySelector(".comment-popup-container").classList.remove('comment-popup-animation'); // removing animation class from the pop up window 
        document.body.classList.remove('overflow-hidden'); // make scrolling available again 
    }
}

function toggleShareFriend(checkbox, friendId) { // select friends on share popup
    if (checkbox.checked) 
        {
        selectedShareFriends[friendId] = true;
        } 
    else 
        {
        delete selectedShareFriends[friendId];
        }
}

function searchShareFriends(query) // filter the Share popup list by username
{
    let lowerQuery = query.trim().toLowerCase();

    if (lowerQuery === "") {
        createShareList(shareContactsCache);
        return;
    }

    let filtered = shareContactsCache.filter(friend =>
        friend.username.toLowerCase().includes(lowerQuery)
    );

    createShareList(filtered);
}

function createShareList(listToRender = shareContactsCache) // render the Share popup list from the shared smart-contact source
{
    let friendsContainer = document.querySelector(".share-popup-background .overflow-y-auto");
    if (!friendsContainer) {
        return;
    }
    friendsContainer.innerHTML = "";

    // Only real, reachable users can receive a shared post
    let selectable = (listToRender || []).filter(friend => !friend.unavailable);

    if (selectable.length === 0) {
        friendsContainer.innerHTML = `<div class="text-center text-muted mt-3">No contacts to share with yet.</div>`;
        return;
    }

    selectable.forEach(friend => {
        let isChecked = selectedShareFriends[friend.userId] === true ? "checked" : "";
        let safeUserId = escapeHTML(String(friend.userId));
        let safeUsername = escapeHTML(friend.username);
        let safeProfilePic = escapeHTML(friend.profilePic);

        let friendHTML =
        `<label class="d-flex align-items-center justify-content-between mb-2 p-2 rounded js-friend-row" style="cursor: pointer;" onmouseenter="this.classList.add('bg-light')" onmouseleave="this.classList.remove('bg-light')">
            <div class="d-flex align-items-center gap-2">
                <img src="${safeProfilePic}" class="rounded-circle" onerror="this.onerror = null; this.src='${DEFAULT_PROFILE_PIC}'" style="width: 44px; height: 44px; object-fit: cover;">
                <span class="fw-semibold">${safeUsername}</span>
            </div>
            <input class="form-check-input rounded-circle fs-5 m-0 js-share-checkbox" type="checkbox" value="${safeUserId}" onchange="toggleShareFriend(this, '${safeUserId}')" ${isChecked}>
        </label>`;
        friendsContainer.innerHTML += friendHTML;
    });
}

async function openSharePopup(button)
{
    let idDiv = button.closest('[data-post-id]');
    if (!idDiv) return;
    let postId = idDiv.dataset.postId;

    let sharePopup = document.querySelector(".share-popup-background");
    if (!sharePopup) return;
    sharePopup.dataset.postId = postId;

    selectedShareFriends = {};
    let searchInput = document.querySelector(".js-share-search-input");
    if (searchInput) searchInput.value = "";

    // Show the popup FIRST so a slow or failing fetch can never make the button feel dead
    sharePopup.classList.remove('d-none');
    sharePopup.classList.add('d-flex');
    document.body.classList.add('overflow-hidden');

    let friendsContainer = sharePopup.querySelector(".overflow-y-auto");
    if (friendsContainer) {
        friendsContainer.innerHTML = `<div class="text-center text-muted mt-3">Loading contacts...</div>`;
    }

    try {
        // Reuse the EXACT same source the chat list uses (getSmartContactList lives in messages.js)
        shareContactsCache = await getSmartContactList();
        createShareList(shareContactsCache);
    } catch (error) {
        console.error("Error loading contacts for the Share popup:", error);
        if (friendsContainer) {
            friendsContainer.innerHTML = `<div class="text-center text-danger mt-3">Could not load contacts. Please try again.</div>`;
        }
    }
}

function closeSharePopup(event, forceClose = false) 
{
    let sharePopup = document.querySelector(".share-popup-background");
    
    if (forceClose || event.target.classList.contains('share-popup-background')) {
        sharePopup.classList.remove('d-flex');
        sharePopup.classList.add('d-none');
        document.body.classList.remove('overflow-hidden');
    }
}

async function sendSharedPost()
{
    let sharePopup = document.querySelector(".share-popup-background");
    if (!sharePopup) return;

    let postId = sharePopup.dataset.postId;
    let selectedIds = Object.keys(selectedShareFriends);

    if (!postId || selectedIds.length === 0) return;

    // Confirm identity once before the loop
    let currentUserId = await ensureCurrentUser();
    if (!currentUserId) {
        showShareResultModal("Share Post", "We couldn't verify your session. Please refresh the page and try again.", true);
        return;
    }

    let sendBtn = sharePopup.querySelector(".js-send-share-btn");
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.classList.add("opacity-50");
    }

    // Create a real shared_post message per recipient, through the existing chat API
    let failures = 0;
    for (let friendId of selectedIds) {
        try {
            let response = await fetch('/api/chats/createMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: currentUserId,
                    receiver: friendId,
                    type: "shared_post",
                    postId: postId
                })
            });
            let result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                failures++;
                console.error("Failed to share post with", friendId, result);
            }
        } catch (error) {
            failures++;
            console.error("Network error while sharing post with", friendId, error);
        }
    }

    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove("opacity-50");
    }

    closeSharePopup(null, true);

    if (failures > 0) {
        showShareResultModal(
            "Share Post",
            `This post couldn't be sent to ${failures} of ${selectedIds.length} contact(s).`,
            true
        );
    }

    // Refresh whichever chat surface is currently visible
    let messagesPopup = document.querySelector(".messages-popup-container");
    if (messagesPopup && !messagesPopup.classList.contains("d-none")) {
        renderMessagesList();
    }

    let chatWindow = document.querySelector(".chat-window-container");
    if (chatWindow && !chatWindow.classList.contains("d-none")) {
        let openFriendId = chatWindow.dataset.friendId;
        if (openFriendId && selectedIds.includes(openFriendId)) {
            await openChatWindow(openFriendId);
        }
    }

    // Optimistic feed share-count bump (the Post backend has no share-count field)
    let feedPost = document.querySelector(`.js-all-post[data-post-id="${postId}"]`);
    if (feedPost) {
        let shareIcon = feedPost.querySelector('.bi-send');
        if (shareIcon && shareIcon.nextElementSibling) {
            let counterSpan = shareIcon.nextElementSibling;
            let currentCount = parseInt(counterSpan.innerText) || 0;
            counterSpan.innerText = currentCount + selectedIds.length;
        }
    }

    let postInData = (typeof allPostsData !== 'undefined' && Array.isArray(allPostsData))
        ? allPostsData.find(post => post._id === postId)
        : null;
    if (postInData && postInData.stats) {
        let currentSharesCount = parseInt(postInData.stats.shares) || 0;
        postInData.stats.shares = (currentSharesCount + selectedIds.length).toString();
    }

    selectedShareFriends = {};
}

// Injects the "Share result" modal once — mirrors injectDeleteModal in messages.js
function injectShareResultModal() {
    if (document.getElementById('shareResultModal')) {
        return;
    }

    const modalHTML = `
    <div class="modal fade" id="shareResultModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4">
                <div class="modal-header border-bottom-0">
                    <h5 class="modal-title fw-bold" id="shareResultModalTitle">Share Post</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body py-0">
                    <p class="mb-0 text-dark" id="shareResultModalMessage"></p>
                </div>
                <div class="modal-footer border-top-0">
                    <button type="button" class="btn btn-primary px-4" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Blur focus on close to avoid the aria-hidden focus warning (same as the other modals)
    const modalElement = document.getElementById('shareResultModal');
    modalElement.addEventListener('hide.bs.modal', () => {
        if (document.activeElement && modalElement.contains(document.activeElement)) {
            document.activeElement.blur();
        }
    });
}

function showShareResultModal(title, message, isError = false) {
    injectShareResultModal();

    let titleEl = document.getElementById('shareResultModalTitle');
    let messageEl = document.getElementById('shareResultModalMessage');

    titleEl.textContent = title;
    titleEl.classList.toggle('text-danger', isError === true);
    messageEl.textContent = message;

    let modal = new bootstrap.Modal(document.getElementById('shareResultModal'));
    modal.show();
}

function prepareReply(username) {
    let commentInput = document.querySelector(".js-comment-input");
    if (commentInput) {
        commentInput.value = "@" + username + " ";
        commentInput.focus();
        commentInput.dispatchEvent(new Event('input')); // making an event like someone is typing
    }
}