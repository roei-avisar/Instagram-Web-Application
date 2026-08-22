function openMessagesPopup() 
{
    let messagesPopup = document.querySelector(".messages-popup-container");
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    
    if (messagesCapsule) {
        messagesCapsule.classList.add("d-none");
    }
    
    messagesPopup.classList.remove("d-none");
    renderMessagesList();
}

function closeMessagesPopup() 
{
    let messagesPopup = document.querySelector(".messages-popup-container");
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    
    messagesPopup.classList.add("d-none");
    
    if (messagesCapsule) {
        messagesCapsule.classList.remove("d-none");
    }
}

function renderMessagesList() 
{
    let container = document.querySelector(".js-messages-list-container");
    container.innerHTML = "";

    friends.forEach(friend => {
        let lastMessageText = "Tap to chat";
        let chatHistory = chatsDatabase[friend.id];
        
        if (chatHistory && chatHistory.length > 0) {
            let lastMessage = chatHistory[chatHistory.length - 1];
            if (lastMessage.type === "shared_post") {
                lastMessageText = "Sent an attachment";
            }
        }

        let chatHTML = `
        <div class="d-flex align-items-center p-2 rounded mb-1 chat-row" onclick="openChatWindow('${friend.id}')">
            <img src="elements/media/profile-pictures/${friend.username}.jpg" class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">
            <div class="d-flex flex-column">
                <span class="fw-semibold">${friend.username}</span>
                <span class="text-muted text-12">${lastMessageText}</span>
            </div>
        </div>
        `;
        container.innerHTML += chatHTML;
    });
}

function openChatWindow(friendId) 
{
    document.querySelector(".messages-popup-container").classList.add("d-none");

    let chatWindow = document.querySelector(".chat-window-container");
    chatWindow.dataset.friendId = friendId;
    chatWindow.classList.remove("d-none");

    let friend = friends.find(f => f.id === friendId);
    
    let headerInfo = document.querySelector(".js-chat-header-info");
    headerInfo.innerHTML = `
        <img src="elements/media/profile-pictures/${friend.username}.jpg" class="rounded-circle" style="width: 30px; height: 30px; object-fit: cover;">
        <span class="fw-bold">${friend.username}</span>
    `;

    renderChatHistory(friendId);

    let chatInput = chatWindow.querySelector(".js-chat-message-input");
    if (chatInput) {
        chatInput.value = "";
        setTimeout(() => chatInput.focus(), 100);
    }
    let chatHistoryContainer = document.querySelector(".js-chat-history-container");
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}

function renderChatHistory(friendId) {
    let historyContainer = document.querySelector(".js-chat-history-container");
    historyContainer.innerHTML = "";

    let chatHistory = chatsDatabase[friendId] || [];

    chatHistory.forEach(message => {
        if (message.type === "shared_post") {
            
            let postElement = document.querySelector(`.js-all-post[data-post-id="${message.postId}"]`);
            let mediaTag = "";
            
            if (postElement) {
                let videoEl = postElement.querySelector('video');
                let imgEl = postElement.querySelector('img.main-post');
                let textEl = postElement.querySelector('.text-post-content');

                if (videoEl) {
                    mediaTag = `<video src="${videoEl.src}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
                } else if (imgEl) {
                    mediaTag = `<img src="${imgEl.src}" style="width: 100%; height: 100%; object-fit: cover;">`;
                } else if (textEl) {
                    mediaTag = `<div class="d-flex justify-content-center align-items-center p-2 w-100 h-100" style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); overflow: hidden;"><span class="text-center fw-bold text-dark" style="font-size: 12px;">${textEl.innerText}</span></div>`;
                }
            }

            let bubbleHTML = `
            <div class="d-flex justify-content-end mb-3">
                <div class="bg-light border rounded-4 p-2 shadow-sm" style="max-width: 75%; cursor: pointer;" onclick="openSharedPostComments('${message.postId}')">
                    <div class="d-flex align-items-center gap-2 mb-2 px-1">
                        <span class="fw-semibold text-12 text-muted">You shared a post</span>
                    </div>
                    <div class="rounded-3 overflow-hidden position-relative" style="height: 200px; width: 150px; display: flex; align-items: center; justify-content: center; background-color: #000;">
                        ${mediaTag}
                    </div>
                    <div class="mt-2 text-center fw-semibold text-12 py-1">View Post</div>
                </div>
            </div>
            `;
            historyContainer.innerHTML += bubbleHTML;
        }
        else if (message.type === "text") {
            let bubbleHTML = `
            <div class="d-flex justify-content-end mb-3">
                <div class="bg-primary text-white rounded-4 px-3 py-2 shadow-sm" style="max-width: 75%;">
                    <div class="text-break" style="font-size: 15px;">${message.text}</div>
                </div>
            </div>`;
            historyContainer.innerHTML += bubbleHTML;
        }
    });
}

function openSharedPostComments(postId) 
{
    let commentPopupBackground = document.querySelector(".comment-popup-background");
    let allPost = document.querySelector(`[data-post-id="${postId}"]`);
    
    if (!commentPopupBackground || !allPost) return;
    
    commentPopupBackground.dataset.postId = postId;
    
    commentPopupBackground.classList.remove('d-none');
    commentPopupBackground.classList.add('d-flex');
    commentPopupBackground.querySelector(".comment-popup-container").classList.add('comment-popup-animation');
    document.body.classList.add('overflow-hidden');

    syncLikePost(postId, 0);
    syncSavePost(postId);
    addPostToPopupComment(commentPopupBackground, allPost);
    addHeaderToPopupComment(commentPopupBackground, allPost);
    addLikedByToPopupComment(commentPopupBackground, allPost);
    addCommentsToPopupComment(commentPopupBackground, allPost);
    addTypingLineToPopupComment(commentPopupBackground, allPost);
    handleVideoMedia(commentPopupBackground);
}

function backToMessages() 
{
    document.querySelector(".chat-window-container").classList.add("d-none");
    document.querySelector(".messages-popup-container").classList.remove("d-none");
    renderMessagesList();
}

function closeChatWindow() 
{
    document.querySelector(".chat-window-container").classList.add("d-none");
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    if (messagesCapsule) {
        messagesCapsule.classList.remove("d-none");
    }
}

function handleChatInput(event) 
{
    if (event.key === "Enter") {
        event.preventDefault();
        let chatInput = event.target;
        let text = chatInput.value.trim();
        if (text !== "") {
            let chatWindow = document.querySelector(".chat-window-container");
            let friendId = chatWindow.dataset.friendId;
            
            if (!chatsDatabase[friendId]) {
                chatsDatabase[friendId] = [];
            }
            
            chatsDatabase[friendId].push({
                type: "text",
                text: text,
                sender: "me",
                time: "Just now"
            });
            chatInput.value = ""; 
            renderChatHistory(friendId); 
            renderMessagesList();
        }
        let chatHistoryContainer = document.querySelector(".js-chat-history-container");
        chatHistoryContainer.scrollTo({
            top: chatHistoryContainer.scrollHeight,
            behavior: 'smooth'
        });
        
    }
}