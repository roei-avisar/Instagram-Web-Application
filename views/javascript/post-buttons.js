const timeDictionary = {
    's': 'seconds',
    'm': 'minutes',
    'h': 'hours',
    'd': 'days',
    'w': 'weeks'
};

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

let selectedShareFriends = {};

async function likePost(button) {
    let idDiv = button.closest('[data-post-id]');
    if (!idDiv) return;
    let postId = idDiv.dataset.postId;

    // 1. Optimistic local data update using user ID
    let post = allPostsData.find(p => p._id === postId);
    if (post) {
        if (post.likedByUsers.some(u => (u._id || u) === currentUserId)) {
            post.likedByUsers = post.likedByUsers.filter(u => (u._id || u) !== currentUserId);
            post.stats.likes = Math.max(0, post.stats.likes - 1);
        } else {
            post.likedByUsers.push(currentUserId);
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
        body: JSON.stringify({ userId: currentUserId })
    });
}

async function savePost(button) {
    let idDiv = button.closest('[data-post-id]');
    if (!idDiv) return;
    let postId = idDiv.dataset.postId;

    // 1. Optimistic local data update using user ID
    let post = allPostsData.find(p => p._id === postId);
    if (post) {
        if (post.savedByUsers.some(u => (u._id || u) === currentUserId)) {
            post.savedByUsers = post.savedByUsers.filter(u => (u._id || u) !== currentUserId);
        } else {
            post.savedByUsers.push(currentUserId);
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
        body: JSON.stringify({ userId: currentUserId })
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
    let postTime = commentPopupHeader.querySelector(".js-post-time"); 
    let commentPopuplikedBy = commentPopupBackground.querySelector(".js-popup-likedBy-slot");
    let likedBy = allPost.querySelector(".js-liked-by").outerHTML;

    let time = postTime.innerText.replace('•', '').trim(); // Take the time of the post and slice it to a number and letter
    let timeNumber = time.slice(0, -1);
    let timeLetter = time.slice(-1);

    commentPopuplikedBy.innerHTML = `
        ${likedBy}
        <div class="text-muted text-12 mt-2">${timeNumber} ${timeDictionary[timeLetter]} ago</div>
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
                <img src="${authorProfilePic}" data-username="${popupAuthorUsername}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
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
            let isLiked = comment.likedBy && comment.likedBy.some(u => (u._id || u) === currentUserId);
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
                        <img src="${commentProfilePic}" data-username="${commentUsername}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
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
    typingElement.innerHTML = `${currentUsername} is typing<span class="typing-dots ms-1"><span>.</span><span>.</span><span>.</span></span>`;
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
    let isLiked = comment.likedBy.some(u => (u._id || u) === currentUserId);

    // Optimistic UI update
    if (isLiked) {
        // Unlike the comment
        comment.likedBy = comment.likedBy.filter(u => (u._id || u) !== currentUserId);
        comment.likes = Math.max(0, comment.likes - 1);
        buttonElement.classList.remove("bi-heart-fill", "text-danger");
        buttonElement.classList.add("bi-heart", "text-muted");
    } else {
        // Like the comment
        comment.likedBy.push(currentUserId);
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
            body: JSON.stringify({ userId: currentUserId })
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

function searchShareFriends(query) // function that search on share friend list by first and second name
{
    let lowerQuery = query.toLowerCase();
    
    let filteredFriends = friends.filter(friend => 
        friend.username.toLowerCase().includes(lowerQuery) || 
        friend.fullName.toLowerCase().includes(lowerQuery)
    );
    
    createShareList(filteredFriends);
}

function createShareList(listToRender = friends) //render a share list from all of our friends 
{
    let friendsContainer = document.querySelector(".share-popup-background .overflow-y-auto");
    friendsContainer.innerHTML = "";

    listToRender.forEach(friend => {
        let isChecked = selectedShareFriends[friend.id] === true ? "checked" : "";

        let friendHTML = 
        `<label class="d-flex align-items-center justify-content-between mb-2 p-2 rounded js-friend-row" style="cursor: pointer;" onmouseenter="this.classList.add('bg-light')" onmouseleave="this.classList.remove('bg-light')">
            <div class="d-flex align-items-center gap-2">
                <img src="elements/media/profile-pictures/${friend.username}.jpg" class="rounded-circle" style="width: 44px; height: 44px; object-fit: cover;">
                <div class="d-flex flex-column lh-1">
                    <span class="fw-semibold">${friend.username}</span>
                    <span class="text-muted text-12">${friend.fullName}</span>
                </div>
            </div>
            <input class="form-check-input rounded-circle fs-5 m-0 js-share-checkbox" type="checkbox" value="${friend.id}" onchange="toggleShareFriend(this, '${friend.id}')" ${isChecked}>
        </label>`;
        friendsContainer.innerHTML += friendHTML;
    });
}

function openSharePopup(button) 
{
    let idDiv = button.closest('[data-post-id]');
    if (!idDiv) return;
    let postId = idDiv.dataset.postId;
    
    let sharePopup = document.querySelector(".share-popup-background");
    sharePopup.dataset.postId = postId ;

    selectedShareFriends = {}; 
    let searchInput = document.querySelector(".js-share-search-input");
    if (searchInput) searchInput.value = ""; 

    createShareList();
    
    sharePopup.classList.remove('d-none');
    sharePopup.classList.add('d-flex');
    document.body.classList.add('overflow-hidden'); 
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

function sendSharedPost() 
{
    let sharePopup = document.querySelector(".share-popup-background");
    let postId = sharePopup.dataset.postId;
    let selectedIds = Object.keys(selectedShareFriends);
    
    if (selectedIds.length === 0) return ;

    selectedIds.forEach(friendId => {
        if (!chatsDatabase[friendId]) {
            chatsDatabase[friendId] = [];
        }
        
        chatsDatabase[friendId].push({ // add to chat database
            type: "shared_post",
            postId: postId,
            sender: "me",
            time: "Just now"
        });
    });

    closeSharePopup(null, true);
    renderMessagesList();
    let chatWindow = document.querySelector(".chat-window-container");
    
    if (!chatWindow.classList.contains("d-none")) {
        let currentOpenFriendId = chatWindow.dataset.friendId;
        
       
        if (selectedIds.includes(currentOpenFriendId)) {
            renderChatHistory(currentOpenFriendId);
            let chatHistoryContainer = document.querySelector(".js-chat-history-container");
            chatHistoryContainer.scrollTo({
                top: chatHistoryContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    let feedPost = document.querySelector(`.js-all-post[data-post-id="${postId}"]`);
    
    if (feedPost) { // adding number of shares to the share count on html
        let shareIcon = feedPost.querySelector('.bi-send');
        if (shareIcon) {
            let counterSpan = shareIcon.nextElementSibling;
            if (counterSpan) {
                let currentCount = parseInt(counterSpan.innerText) || 0;
                counterSpan.innerText = currentCount + selectedIds.length;
            }
        }
    }

    let postInData = allPostsData.find(post => post._id === postId);
        
    if (postInData) {
        let currentSharesCount = parseInt(postInData.stats.shares) || 0; // adding number of shares to share count on posts database
        postInData.stats.shares = (currentSharesCount + selectedIds.length).toString();
    }
}

function prepareReply(username) {
    let commentInput = document.querySelector(".js-comment-input");
    if (commentInput) {
        commentInput.value = "@" + username + " ";
        commentInput.focus();
        commentInput.dispatchEvent(new Event('input')); // making an event like someone is typing
    }
}