function openMessagesPopup() {
    let messagesPopup = document.querySelector(".messages-popup-container");
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    
    if (messagesCapsule) {
        messagesCapsule.classList.add("d-none");
    }
    
    messagesPopup.classList.remove("d-none");
    renderMessagesList();
}

function closeMessagesPopup() {
    let messagesPopup = document.querySelector(".messages-popup-container");
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    
    messagesPopup.classList.add("d-none");
    
    if (messagesCapsule) {
        messagesCapsule.classList.remove("d-none");
    }
}

async function renderMessagesList() {
    // Prepare the screen by selecting the messages list for future use
    let container = document.querySelector(".js-messages-list-container");
    if (!container){ // Safety check in case the popup of the messages isn't on the page
        return;
    }

    // Show a temporary loading message while we fetch from the database
    container.innerHTML = `<div class="text-center text-muted mt-3">Loading friends...</div>`;

    try {
        // Fetch the list of users the current user is following
        let response = await fetch('/api/user/check_following');
        let result = await response.json();

        // Clear the loading message
        container.innerHTML = "";

        // Handle server-side or response errors specifically
        if (result.error) {
            container.innerHTML = `<div class="text-center text-danger mt-3">Error loading following list.</div>`;
            return;
        }

        // Handle the scenario where the user isn't following anyone yet (empty list)
        if (!result.following || result.following.length === 0) {
            container.innerHTML = `<div class="text-center text-muted mt-3">You aren't following anyone yet.</div>`;
            return;
        }

        // Loop through the actual followed users from the response of the fetch request
        result.following.forEach(friend => {
            // Default subtitle of last chat message
            let lastMessageText = "Tap to chat";

            // Create and add the HTML element for each friend using the profilePic + username from the fetch response
            let chatHTML = `
            <div class="d-flex align-items-center p-2 rounded mb-1 chat-row" style="cursor: pointer;" onclick="openChatWindow('${friend.userId}', '${friend.username}', '${friend.profilePic}')">
                <img src="${friend.profilePic}" class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="d-flex flex-column border-bottom flex-grow-1 pb-2">
                    <span class="fw-semibold text-dark">${friend.username}</span>
                    <span class="text-muted text-12">${lastMessageText}</span>
                </div>
            </div>
            `;

            container.innerHTML += chatHTML;
        });

    } catch (error) {
        // Log the exact error to the console if the fetch fails
        console.error("Error fetching following list:", error);
        container.innerHTML = `<div class="text-center text-danger mt-3">Failed to load friends list.</div>`;
    }
}

async function openChatWindow(friendId, friendUsername = null, friendProfilePic = null){
    // Hide all the chat list of all the possible users to chat with
    document.querySelector(".messages-popup-container").classList.add("d-none");

    // Select the chat window and history container
    let chatWindow = document.querySelector(".chat-window-container");
    let chatHistoryContainer = document.querySelector(".js-chat-history-container");


    // Only clear the screen if the user clicked on a different friend
    if (chatWindow.dataset.friendId !== friendId) {
        if (chatHistoryContainer) {
            chatHistoryContainer.innerHTML = ""; 
        }
    }

    // Select and show the relevant chat (and attache the relevant friendId to this chat)
    chatWindow.dataset.friendId = friendId;
    chatWindow.classList.remove("d-none");

    // Only update the header if we passed in a username and picture
    // This is necessary because the function is called both when the chat needs to load for the first time and whenever a message in the chat changes
    if (friendUsername && friendProfilePic) {
        let headerInfo = document.querySelector(".js-chat-header-info");
        headerInfo.innerHTML = `
            <img src="${friendProfilePic}" class="rounded-circle" style="width: 30px; height: 30px; object-fit: cover;">
            <span class="fw-bold">${friendUsername}</span>
        `;
    }

    try {
        // Fetch the chat history from the DB using the router routes and the controller functions
        let response = await fetch('/api/chats/getAllMessages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderId: CURRENT_USER_ID,
                receiverId: friendId
            })
        });

        let result = await response.json();

        if (result.success) {
            if (!result.data || result.data.length === 0) {
                // Handle empty chat / new chat directly here
                let chatHistoryContainer = document.querySelector(".js-chat-history-container");
                chatHistoryContainer.innerHTML = `<div class="text-center text-muted mt-5">No messages yet. Say hi! 👋</div>`;
            } else {
                // Render the actual messages normally
                renderChatHistory(result.data);
            }
        } else {
            // Handle actual server/network errors
            let chatHistoryContainer = document.querySelector(".js-chat-history-container");
            chatHistoryContainer.innerHTML = `<div class="text-center text-danger mt-5">Failed to load messages. Please try again.</div>`;
        }

    } catch (error) {
        console.error("Network or server error while fetching messages:", error);
        if (chatHistoryContainer) {
            chatHistoryContainer.innerHTML = `<div class="text-center text-danger mt-5">Network error. Please try again.</div>`;
        }
    }

    // Select the rest of the chat window, clear the text box and put the blinking typing cursor inside the text box immediately
    let chatInput = chatWindow.querySelector(".js-chat-message-input");
    if (chatInput) {
        chatInput.value = "";
        setTimeout(() => chatInput.focus(), 100);
    }

    // Scroll to the bottom of the chat
    if (chatHistoryContainer) {
        // Use a tiny timeout to ensure the rendering process for the new bubbles is complete before scrolling
        setTimeout(() => {
            chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
        }, 10);
    }
}

// Helper function to neutralize quotes and brackets so they don't break the HTML
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, function(tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;', 
            '"': '&quot;'
        };
        return charsToReplace[tag] || tag;
    });
}

function renderChatHistory(messagesArray){
    // Select the chat messages div where two users are messaging each other (so in the future put there all the chat history)
    let chatHistoryContainer = document.querySelector(".js-chat-history-container");
    if (!chatHistoryContainer){
        return;
    }
    
    chatHistoryContainer.innerHTML = "";

    // Handle the case that there aren't messages to load
    if (!messagesArray || messagesArray.length === 0) {
        return;
    }

    // Loops each message to make the uniq element and add it to the chat history div
    messagesArray.forEach(message => {
        // Checks if each message is the current user message or not and style it accordingly
        let isMe = (message.sender === CURRENT_USER_ID);
        let alignmentClass = isMe ? "justify-content-end" : "justify-content-start";
        let textBubbleColor = isMe ? "bg-primary text-white" : "bg-white text-dark border"; 
        let shareText = isMe ? "You shared a post" : "Shared a post";

        // Secure the text before putting it into buttons or bubbles
        let safeContent = escapeHTML(message.content);

        // Generate Edit and Delete buttons only for the current user messages
        let actionButtons = "";
        if (isMe) {
            let editBtn = (message.type === "text") 
                ? `<span style="cursor:pointer; font-size:12px; margin-right:10px; text-decoration:underline;" onclick="handleEditMessage('${message._id}', '${safeContent}')">Edit</span>` 
                : "";
                
            let deleteBtn = `<span style="cursor:pointer; font-size:12px; text-decoration:underline;" onclick="handleDeleteMessage('${message._id}')">Delete</span>`;
            
            actionButtons = `<div class="mt-1 text-end" style="opacity: 0.8;">${editBtn}${deleteBtn}</div>`;
        }

        // Handle Shared Posts
        if (message.type === "shared_post") {
            let mediaTag = "";
            let post = message.postId; // The full post object from the backend .populate()
            
            if (post) {
                let actualPostId = post._id; 
                
                // Check the mediaType saved in the DB schema
                if (post.mediaType === 'video') {
                    mediaTag = `<video src="${post.mediaSource}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
                } else if (post.mediaType === 'image') {
                    mediaTag = `<img src="${post.mediaSource}" style="width: 100%; height: 100%; object-fit: cover;">`;
                } else {
                    // Checks to see if the post is empty, then the message "Text Post" will represent its posts
                    let captionText = escapeHTML(post.caption) || "Text Post";
                    mediaTag = `<div class="d-flex justify-content-center align-items-center p-2 w-100 h-100" style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); overflow: hidden;"><span class="text-center fw-bold text-dark" style="font-size: 12px;">${captionText}</span></div>`;
                }

                // Creating and adding the complete message, including all the checks and tags we have created so far
                let bubbleHTML = `
                <div class="d-flex ${alignmentClass} mb-3">
                    <div class="bg-light border rounded-4 p-2 shadow-sm" style="max-width: 75%;">
                        <div class="d-flex align-items-center gap-2 mb-2 px-1 cursor-pointer" onclick="openSharedPostComments('${actualPostId}')">
                            <span class="fw-semibold text-12 text-muted">${shareText}</span>
                        </div>
                        <div class="rounded-3 overflow-hidden position-relative cursor-pointer" style="height: 200px; width: 150px; display: flex; align-items: center; justify-content: center; background-color: #000;" onclick="openSharedPostComments('${actualPostId}')">
                            ${mediaTag}
                        </div>
                        <div class="mt-2 text-center fw-semibold text-12 py-1 cursor-pointer text-primary" onclick="openSharedPostComments('${actualPostId}')">View Post</div>
                        ${actionButtons}
                    </div>
                </div>
                `;
                chatHistoryContainer.innerHTML += bubbleHTML;
            } else {
                // Render a placeholder if the original post was deleted
                let bubbleHTML = `
                <div class="d-flex ${alignmentClass} mb-3">
                    <div class="bg-light border rounded-4 p-3 shadow-sm text-muted fst-italic" style="font-size: 14px;">
                        This post has been deleted.
                        ${actionButtons}
                    </div>
                </div>`;
                chatHistoryContainer.innerHTML += bubbleHTML;
            }
        }
        // Handle standard text messages
        else if (message.type === "text") {
            let bubbleHTML = `
            <div class="d-flex ${alignmentClass} mb-3">
                <div class="${textBubbleColor} rounded-4 px-3 py-2 shadow-sm" style="max-width: 75%;">
                    <div class="text-break" style="font-size: 15px;">${safeContent}</div>
                    ${actionButtons}
                </div>
            </div>`;
            chatHistoryContainer.innerHTML += bubbleHTML;
        }
    });
}

function injectEditModal() {
    // Check if the modal already exists to prevent duplicates
    if (document.getElementById('editMessageModal')){
        return;
    }


    const modalHTML = `
    <div class="modal fade" id="editMessageModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4">
                <div class="modal-header border-bottom-0">
                    <h5 class="modal-title fw-bold">Edit Message</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body py-0">
                    <input type="hidden" id="hiddenEditMessageId">
                    <textarea id="editMessageInput" class="form-control rounded-3" rows="3"></textarea>
                    <div id="editMessageError" class="text-danger mt-2 d-none" style="font-size: 14px;"></div>
                </div>
                <div class="modal-footer border-top-0">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary px-4" onclick="submitEditMessage()">Save Changes</button>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Automatically blur focus when the edit modal closes- to prevent unnecessary console logs warnings in the browser console
    const editModalElement = document.getElementById('editMessageModal');
    editModalElement.addEventListener('hide.bs.modal', () => {
        if (document.activeElement && editModalElement.contains(document.activeElement)) {
            document.activeElement.blur();
        }
    });
}

function handleEditMessage(messageId, oldContent) {
    // Build the popup window
    injectEditModal();

    // Storing inportant values in hidden elements for future use- in submit function
    document.getElementById('hiddenEditMessageId').value = messageId;
    document.getElementById('editMessageInput').value = oldContent;
    document.getElementById('editMessageError').classList.add('d-none');

    // Creating a Bootstrap modal instance and displaying it on the screen
    let editModal = new bootstrap.Modal(document.getElementById('editMessageModal'));
    editModal.show();
}

async function submitEditMessage() {
    // Getting the new relevant values from the screen
    let messageId = document.getElementById('hiddenEditMessageId').value;
    let newContent = document.getElementById('editMessageInput').value.trim();
    let errorBox = document.getElementById('editMessageError');

    // Handle empty message error
    if (newContent === "") {
        errorBox.innerText = "Message cannot be empty.";
        errorBox.classList.remove('d-none');
        return;
    }

    // Getting the current open friend chat from the chat element
    let chatWindow = document.querySelector(".chat-window-container");
    let friendId = chatWindow.dataset.friendId;

    try {
        // Trying to update the message using the controller and router with fetch
        let response = await fetch('/api/chats/updateMessage', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messageId: messageId,
                updatedContent: newContent,
                senderId: CURRENT_USER_ID,
                receiverId: friendId
            })
        });

        let result = await response.json();

        // Checks for potential validation errors (like xss) or other error from the server
        if (!response.ok && result.error) {
            errorBox.innerText = result.error;
            errorBox.classList.remove('d-none');
            return;
        }

        if (result.success) {
            // Hide the modal on success
            let modalElement = document.getElementById('editMessageModal');
            let modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Refresh the chat window
            await openChatWindow(friendId); 
        } else {
            errorBox.innerText = result.message || "An error occurred while saving.";
            errorBox.classList.remove('d-none');
        }
    } catch (error) {
        console.error("Server error:", error);
        errorBox.innerText = "Network error. Please try again.";
        errorBox.classList.remove('d-none');
    }
}

function injectDeleteModal() {
    // Check if the modal already exists to prevent duplicates
    if (document.getElementById('deleteMessageModal')){
        return;
    }

    const modalHTML = `
    <div class="modal fade" id="deleteMessageModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4">
                <div class="modal-header border-bottom-0">
                    <h5 class="modal-title fw-bold text-danger">Delete Message</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body py-0">
                    <input type="hidden" id="hiddenDeleteMessageId">
                    <p class="mb-1 text-dark">Are you sure you want to delete this message?</p>
                    <p class="text-muted text-12 mb-0">This action cannot be undone.</p>
                    <div id="deleteMessageError" class="text-danger mt-2 d-none" style="font-size: 14px;"></div>
                </div>
                <div class="modal-footer border-top-0">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger px-4" onclick="submitDeleteMessage()">Delete</button>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Automatically blur focus when the edit modal closes- to prevent unnecessary console logs warnings in the browser console
    const modalElement = document.getElementById('deleteMessageModal');
    modalElement.addEventListener('hide.bs.modal', () => {
        if (document.activeElement && modalElement.contains(document.activeElement)) {
            document.activeElement.blur();
        }
    });
}

function handleDeleteMessage(messageId) {
    // Build the popup window
    injectDeleteModal();

    // Store the ID of the message we want to delete
    document.getElementById('hiddenDeleteMessageId').value = messageId;
    
    // Hide any previous error messages
    document.getElementById('deleteMessageError').classList.add('d-none');

    // Creating a Bootstrap modal instance and displaying it on the screen
    let deleteModal = new bootstrap.Modal(document.getElementById('deleteMessageModal'));
    deleteModal.show();
}

async function submitDeleteMessage() {
    // Getting the new relevant values from the screen
    let messageId = document.getElementById('hiddenDeleteMessageId').value;
    let errorBox = document.getElementById('deleteMessageError');
    
    // Getting the current open friend chat from the chat element
    let chatWindow = document.querySelector(".chat-window-container");
    let friendId = chatWindow.dataset.friendId;

    try {
        // Trying to update the message using the controller and router with fetch
        let response = await fetch('/api/chats/deleteSpecificMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messageId: messageId,
                senderId: CURRENT_USER_ID,
                receiverId: friendId
            })
        });

        let result = await response.json();

        // Checks for potential validation errors (like xss) or other error from the server
        if (!response.ok && result.error) {
            errorBox.innerText = result.error;
            errorBox.classList.remove('d-none');
            return;
        }

        if (result.success) {
            // Hide the modal on success
            let modalElement = document.getElementById('deleteMessageModal');
            let modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Refresh the chat window to make the bubble disappear
            await openChatWindow(friendId);
        } else {
            errorBox.innerText = result.message || "An error occurred while deleting.";
            errorBox.classList.remove('d-none');
        }
    } catch (error) {
        console.error("Server error:", error);
        errorBox.innerText = "Network error. Please try again.";
        errorBox.classList.remove('d-none');
    }
}

function openSharedPostComments(postId) {
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

function backToMessages() {
    document.querySelector(".chat-window-container").classList.add("d-none");
    document.querySelector(".messages-popup-container").classList.remove("d-none");
    renderMessagesList();
}

function closeChatWindow() {
    document.querySelector(".chat-window-container").classList.add("d-none");
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    if (messagesCapsule) {
        messagesCapsule.classList.remove("d-none");
    }
}

async function handleChatInput(event) {
    if (event.key === "Enter") { // Handle enter inside the input box- a meaning to send a message!

        // Stop the default action of the key enter and allow us to handle what pressing this key will do
        event.preventDefault();

        // Get the message text
        let chatInput = event.target;
        let content = chatInput.value.trim();

        // Ensure the message isn't empty- if it is the runction will not continue!
        if (content === ""){
            return;
        }

        // Doing only if the message isn't empty
        // Attach friendID to the opened chat div- the main chat div
        let chatWindow = document.querySelector(".chat-window-container");
        let friendId = chatWindow.dataset.friendId;
        
        try {
            let response = await fetch('/api/chats/createMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender: CURRENT_USER_ID,
                    receiver: friendId,
                    type: "text",
                    content: content
                })
            });

            let result = await response.json();

            // Checks for potential validation errors (like xss) or other error from the server
            if (!response.ok && result.error) {
                alert(result.error);
                return;
            }

            if (result.success) {
                // Clear the typing input box
                chatInput.value = ""; 

                // Refresh the chat history (all the messages) to pull the new message from the DB
                await openChatWindow(friendId); 
            } else {
                console.error("Failed to save message:", result.message);
            }

        } catch (error) {
            console.error("Network or server error:", error);
        }
    }
}