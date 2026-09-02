function openMessagesPopup() {
    let messagesPopup = document.querySelector(".messages-popup-container");
    let messagesCapsule = document.querySelector(".js-messages-capsule");

    if (messagesCapsule) {
        messagesCapsule.classList.add("d-none");
    }

    let wasHidden = messagesPopup.classList.contains("d-none");
    messagesPopup.classList.remove("d-none");
    if (wasHidden) {
        playChatAnim(messagesPopup, "chat-anim-pop");
    }
    renderMessagesList();
}

function closeMessagesPopup() {
    let messagesPopup = document.querySelector(".messages-popup-container");
    let messagesCapsule = document.querySelector(".js-messages-capsule");

    messagesPopup.classList.add("d-none");
    chatWasInConversation = false;   // explicit close = clean reset

    if (messagesCapsule) {
        messagesCapsule.classList.remove("d-none");
        playChatAnim(messagesCapsule, "chat-anim-capsule");
    }
}

// Default profile picture used whenever a real one is missing or unavailable
const DEFAULT_PROFILE_PIC = "/elements/media/profile-pictures/Default_pfp.jpg";

// Remembers whether the user was inside a specific conversation when the chat UI
// was last minimized, so the capsule can reopen that exact chat (see restoreChatUI).
let chatWasInConversation = false;

// Live refresh of the currently-open conversation (simple poll — no websockets in the stack).
const CHAT_POLL_MS = 4000;
let chatPollTimer = null;

// ===== Chat search (WhatsApp-style) state =====
// Search execution goes through the backend (POST /api/chats/searchForAMessage);
// the server returns the matching TEXT messages, and the frontend highlights the
// query substring inside those bubbles (by data-message-id) in the loaded history.
let isChatSearchOpen = false;
let chatSearchQuery = "";        // the applied query (trimmed) — also the highlight term
let chatSearchResultIds = [];    // message _id strings returned by the backend
let chatSearchMatches = [];      // <mark> elements currently in the DOM, document order
let chatSearchIndex = -1;        // index of the "active" match
let chatSearchSeq = 0;           // guards against out-of-order / stale fetch responses

// Makes sure CURRENT_USER_ID is populated before we call any chat endpoint.
// The first chat action after a page refresh can run before initApp.js has
// finished loading the session user — that race is what caused the 500s.
async function ensureCurrentUser() {
    if (CURRENT_USER_ID) {
        return CURRENT_USER_ID;
    }
    try {
        let response = await fetch('/api/user/getUserDetails');
        if (!response.ok) {
            return null;
        }
        let data = await response.json();
        if (data && data.userId) {
            CURRENT_USER_ID = data.userId;
            if (!CURRENT_USERNAME && data.username) {
                CURRENT_USERNAME = data.username;
            }
            return CURRENT_USER_ID;
        }
        return null;
    } catch (error) {
        console.error("Could not verify the current user:", error);
        return null;
    }
}

// Builds the "smart" contact list that is shared by BOTH the messages popup
// and the Share-Post popup, so the two lists can never drift apart. Sources:
//   A) everyone I follow
//   B) followers who have sent me at least one message
//   C) anyone I already have chat history with
// Returns a clean array (possibly empty). Throws only on a hard network failure
// so the caller can show a proper error state.
//   [{ userId, username, profilePic, unavailable, lastMessageText, lastMessageAt }]
async function getSmartContactList() {
    // We need to know who we are so we can filter ourselves out of the list
    await ensureCurrentUser();

    // Pull the three data sources in parallel:
    //  1. users I follow                    (User route)
    //  2. users who follow me               (User route)
    //  3. my chat history                   (Chat route — other user's id + last message info)
    let [followingRes, followersRes, chatsRes] = await Promise.all([
        fetch('/api/user/check_following'),
        fetch('/api/user/check_followers'),
        fetch('/api/chats/getMyChatsSummary')
    ]);

    let followingData = await followingRes.json();
    let followersData = await followersRes.json();
    let chatsData = await chatsRes.json();

    // displayInfo: userId -> { username, profilePic, unavailable? }
    let displayInfo = new Map();
    let followingIds = new Set();
    let followerIds = new Set();

    // Fill display info + id set from the "following" list
    if (followingData && Array.isArray(followingData.following)) {
        followingData.following.forEach(user => {
            let id = String(user.userId);
            followingIds.add(id);
            displayInfo.set(id, {
                username: user.username || "Unknown",
                profilePic: user.profilePic || DEFAULT_PROFILE_PIC
            });
        });
    }

    // Fill display info + id set from the "followers" list
    if (followersData && Array.isArray(followersData.followers)) {
        followersData.followers.forEach(user => {
            let id = String(user.userId);
            followerIds.add(id);
            if (!displayInfo.has(id)) {
                displayInfo.set(id, {
                    username: user.username || "Unknown",
                    profilePic: user.profilePic || DEFAULT_PROFILE_PIC
                });
            }
        });
    }

    // chatMap: otherUserId -> { lastMessageText, lastMessageAt, theyMessagedMe }
    let chatMap = new Map();
    if (chatsData && chatsData.success && Array.isArray(chatsData.chats)) {
        chatsData.chats.forEach(chat => {
            chatMap.set(String(chat.otherUserId), {
                // lastMessageText is ALWAYS a plain string built by the server
                // ("Shared a post" for shared posts) — never a post object.
                lastMessageText: typeof chat.lastMessageText === 'string' ? chat.lastMessageText : "",
                lastMessageAt: chat.lastMessageAt || null,
                theyMessagedMe: chat.theyMessagedMe === true
            });
        });
    }

    // Decide who belongs in the list:
    //  A) everyone I follow
    //  B) followers who have sent me a message
    //  C) anyone I already have chat history with
    let contactIds = new Set();
    followingIds.forEach(id => contactIds.add(id));                        // A
    followerIds.forEach(id => {                                            // B
        let c = chatMap.get(id);
        if (c && c.theyMessagedMe) {
            contactIds.add(id);
        }
    });
    chatMap.forEach((_meta, id) => contactIds.add(id));                    // C

    // Never list myself
    if (CURRENT_USER_ID) {
        contactIds.delete(String(CURRENT_USER_ID));
    }

    // Nobody to chat with yet
    if (contactIds.size === 0) {
        return [];
    }

    // Resolve display info for "chat history only" contacts — group C entries
    // that were NOT in the following/followers responses.
    let leftoverIds = [...contactIds].filter(id => !displayInfo.has(id));

    if (leftoverIds.length > 0) {
        try {
            // Reuse the existing endpoint — it returns every user except me
            // with userId / username / profilePic, which is all we need here.
            let allUsersRes = await fetch('/api/user/allUsers');

            if (allUsersRes.ok) {
                let allUsersData = await allUsersRes.json();
                let leftoverSet = new Set(leftoverIds);

                if (allUsersData && Array.isArray(allUsersData.users)) {
                    allUsersData.users.forEach(user => {
                        let id = String(user.userId);
                        if (!leftoverSet.has(id)) {
                            return; // only resolve the contacts we're still missing
                        }
                        // The user exists: use their real name and their real
                        // picture, falling back to the default picture ONLY
                        // when the profilePic field itself is empty.
                        displayInfo.set(id, {
                            username: user.username || "Unknown",
                            profilePic: user.profilePic || DEFAULT_PROFILE_PIC
                        });
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching user info for chat contacts:", error);
        }

        // Any leftover id STILL unresolved => the fetch failed, or the user
        // was not returned (deleted / unavailable). Mark it unavailable so the
        // UI can show it but keep it non-clickable / non-selectable.
        leftoverIds.forEach(id => {
            if (!displayInfo.has(id)) {
                displayInfo.set(id, {
                    username: "Unavailable User",
                    profilePic: DEFAULT_PROFILE_PIC,
                    unavailable: true
                });
            }
        });
    }

    // Build the final contact objects
    let contacts = [...contactIds].map(id => {
        let info = displayInfo.get(id) || { username: "Unknown", profilePic: DEFAULT_PROFILE_PIC };
        let chat = chatMap.get(id) || {};
        return {
            userId: id,
            username: info.username,
            profilePic: info.profilePic,
            unavailable: info.unavailable === true,
            lastMessageText: typeof chat.lastMessageText === 'string' ? chat.lastMessageText : "",
            lastMessageAt: chat.lastMessageAt || null
        };
    });

    // Sort: contacts with recent chat activity first (newest first),
    // then the remaining follow-only contacts alphabetically by username
    contacts.sort((a, b) => {
        if (a.lastMessageAt && b.lastMessageAt) {
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        }
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
        return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
    });

    return contacts;
}

async function renderMessagesList() {
    // Prepare the screen by selecting the messages list for future use
    let container = document.querySelector(".js-messages-list-container");
    if (!container){ // Safety check in case the popup of the messages isn't on the page
        return;
    }

    // Show a temporary loading message while we fetch from the database
    container.innerHTML = `<div class="text-center text-muted mt-3">Loading chats...</div>`;

    let contacts;
    try {
        contacts = await getSmartContactList();
    } catch (error) {
        console.error("Error building chat contacts list:", error);
        container.innerHTML = `<div class="text-center text-danger mt-3">Failed to load your chats.</div>`;
        renderCapsuleAvatars([]);
        return;
    }

    renderCapsuleAvatars(contacts);   // keep the floating capsule in sync

    container.innerHTML = "";

    // Handle the scenario where there is nobody to chat with yet
    if (!contacts || contacts.length === 0) {
        container.innerHTML = `<div class="text-center text-muted mt-3">No conversations yet. Follow someone to start chatting.</div>`;
        return;
    }

    // Render each contact row
    contacts.forEach(contact => {
        let safeUsername = escapeHTML(contact.username);
        let safeProfilePic = escapeHTML(contact.profilePic);
        let previewText = contact.lastMessageText
            ? escapeHTML(contact.lastMessageText)
            : "Tap to chat";

        let row = document.createElement("div");
        row.className = "d-flex align-items-center p-2 rounded mb-1 chat-row";

        // Values are read back by the delegated click listener
        row.dataset.userId = contact.userId;
        row.dataset.username = contact.username;
        row.dataset.profilePic = contact.profilePic;

        if (contact.unavailable) {
            // Deleted / unavailable user — visible but NOT clickable
            row.classList.add("opacity-50");
            row.style.cursor = "not-allowed";
            row.title = "This user is unavailable";
        } else {
            row.classList.add("js-chat-row");
            row.style.cursor = "pointer";
        }

        row.innerHTML = `
            <img src="${safeProfilePic}" class="rounded-circle me-3 flex-shrink-0" onerror="this.onerror=null; this.src='${DEFAULT_PROFILE_PIC}'" style="width: 50px; height: 50px; object-fit: cover;">
            <div class="d-flex flex-column flex-grow-1" style="min-width: 0;">
                <span class="fw-semibold chat-row-name">${safeUsername}</span>
                <span class="chat-row-preview text-12 text-truncate">${previewText}</span>
            </div>
        `;

        container.appendChild(row);
    });
}

// Fills the floating capsule with up to 3 profile pictures of the people the
// user has actually been chatting with (most recent first). Reuses the contact
// list the messages popup already builds — no extra requests when called from
// renderMessagesList(). Clears to nothing when there are no conversations.
function renderCapsuleAvatars(contacts) {
    let holder = document.querySelector(".js-capsule-avatars");
    if (!holder) {
        return;
    }

    let recent = (Array.isArray(contacts) ? contacts : [])
        .filter(c => c && c.lastMessageAt && !c.unavailable)
        .slice(0, 3);

    holder.innerHTML = "";

    recent.forEach(contact => {
        let safePic = escapeHTML(contact.profilePic || DEFAULT_PROFILE_PIC);
        let safeName = escapeHTML(contact.username || "Unknown");

        let wrap = document.createElement("div");
        wrap.className = "message-profile";
        wrap.innerHTML = `
            <img src="${safePic}" class="message-alert-profile-pic rounded-circle" alt="${safeName}"
                onerror="this.onerror=null; this.src='${DEFAULT_PROFILE_PIC}'">
            <span class="text-bubble">${safeName}</span>
        `;
        holder.appendChild(wrap);
    });
}

// Standalone refresh (used once on load) — does its own fetch.
async function refreshCapsuleAvatars() {
    try {
        let contacts = await getSmartContactList();
        renderCapsuleAvatars(contacts);
    } catch (error) {
        console.error("Could not load capsule avatars:", error);
        renderCapsuleAvatars([]);   // fall back to the clean, image-free capsule
    }
}

// Populate the capsule shortly after load (deferred so it doesn't compete with
// the critical page bootstrap in initApp.js).
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(refreshCapsuleAvatars, 1000);
});

// One delegated listener handles clicks on every chat row (present and future).
// Rows for unavailable users don't get the "js-chat-row" class, so they're ignored.
document.addEventListener("click", function (event) {
    let row = event.target.closest(".js-chat-row");
    if (!row) {
        return;
    }
    openChatWindow(row.dataset.userId, row.dataset.username, row.dataset.profilePic);
});

// ===== Professional 3-dots message-action menu =====
// The dropdown is rendered with position:fixed and placed from the toggle's
// on-screen rect, so it can never be clipped by the scrolling history container.
function closeAllMsgMenus() {
    document.querySelectorAll(".chat-msg-actions.show").forEach(menu => menu.classList.remove("show"));
}

function toggleMsgMenu(button) {
    let menu = button.nextElementSibling; // the .chat-msg-actions element
    if (!menu) {
        return;
    }

    let wasOpen = menu.classList.contains("show");
    closeAllMsgMenus();
    if (wasOpen) {
        return;
    }

    // Show it first so we can measure it, then pin it under the toggle (right-aligned)
    menu.classList.add("show");
    let rect = button.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.right - menu.offsetWidth;

    // Flip above the toggle when there isn't enough room below
    if (top + menu.offsetHeight > window.innerHeight) {
        top = rect.top - 4 - menu.offsetHeight;
    }
    // Never let it slide off the left edge
    if (left < 8) {
        left = 8;
    }

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
}

// Any click that isn't on a menu (or its toggle) closes every open menu.
document.addEventListener("click", function (event) {
    if (!event.target.closest(".chat-msg-menu")) {
        closeAllMsgMenus();
    }
});
// A fixed-position menu would visually drift if the page scrolled — just close it.
document.addEventListener("scroll", closeAllMsgMenus, true);


// ===== Minimize / restore the whole chat UI =====

// One-shot entrance animation for a chat surface that was just un-hidden.
// The class is stripped on animationend so it can replay on the next open.
function playChatAnim(el, className) {
    if (!el) {
        return;
    }
    el.classList.remove("chat-anim-pop", "chat-anim-capsule");
    void el.offsetWidth;                     // force reflow so the same class restarts
    el.classList.add(className);
    el.addEventListener("animationend", function done() {
        el.classList.remove(className);
        el.removeEventListener("animationend", done);
    });
}

function minimizeChatUI() {
    closeChatSearch();
    let chatWindow = document.querySelector(".chat-window-container");
    let messagesPopup = document.querySelector(".messages-popup-container");
    let capsule = document.querySelector(".js-messages-capsule");

    // Capture context BEFORE hiding anything
    chatWasInConversation = !!(
        chatWindow &&
        !chatWindow.classList.contains("d-none") &&
        chatWindow.dataset.friendId
    );

    if (chatWindow) chatWindow.classList.add("d-none");
    if (messagesPopup) messagesPopup.classList.add("d-none");
    if (capsule) {
        capsule.classList.remove("d-none");
        playChatAnim(capsule, "chat-anim-capsule");
    }

    closeAllMsgMenus();
    stopChatPolling();
}

function restoreChatUI() {
    let chatWindow = document.querySelector(".chat-window-container");

    if (chatWasInConversation && chatWindow && chatWindow.dataset.friendId) {
        // Reopen the exact conversation the user left
        openChatWindow(
            chatWindow.dataset.friendId,
            chatWindow.dataset.friendUsername || null,
            chatWindow.dataset.friendProfilePic || null
        );
    } else {
        // The user was only on the list (or never opened a chat) — show the list
        openMessagesPopup();
    }
}

// Click anywhere outside the chat UI (and outside the capsule) -> minimize it.
document.addEventListener("mousedown", function (event) {
    let target = event.target;
    let chatWindow = document.querySelector(".chat-window-container");
    let messagesPopup = document.querySelector(".messages-popup-container");

    let chatOpen = chatWindow && !chatWindow.classList.contains("d-none");
    let listOpen = messagesPopup && !messagesPopup.classList.contains("d-none");
    if (!chatOpen && !listOpen) {
        return; // nothing is open, nothing to minimize
    }

    // Let modals, the Share popup and the comment popup manage their own dismissal
    if (document.querySelector(".modal.show") ||
        target.closest(".modal") ||
        target.closest(".share-popup-background") ||
        target.closest(".comment-popup-background")) {
        return;
    }

    // Ignore clicks that land inside the chat UI itself
    let capsule = document.querySelector(".js-messages-capsule");
    if ((chatWindow && chatWindow.contains(target)) ||
        (messagesPopup && messagesPopup.contains(target)) ||
        (capsule && capsule.contains(target))) {
        return;
    }

    minimizeChatUI();
});

async function openChatWindow(friendId, friendUsername = null, friendProfilePic = null){
    // Hide all the chat list of all the possible users to chat with
    document.querySelector(".messages-popup-container").classList.add("d-none");

    // Keep the floating capsule hidden whenever the chat UI is on screen
    // (openChatWindow can now be called straight from the capsule on restore)
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    if (messagesCapsule) {
        messagesCapsule.classList.add("d-none");
    }

    // Select the chat window and history container
    let chatWindow = document.querySelector(".chat-window-container");
    let chatHistoryContainer = document.querySelector(".js-chat-history-container");
    let chatWindowWasHidden = chatWindow.classList.contains("d-none");


    // Only clear the screen if the user clicked on a different friend
    if (chatWindow.dataset.friendId !== friendId) {
        closeChatSearch();                       // don't carry search into another chat
        if (chatHistoryContainer) {
            chatHistoryContainer.innerHTML = "";
        }
    }

    // Select and show the relevant chat (and attache the relevant friendId to this chat)
    chatWindow.dataset.friendId = friendId;
    chatWindow.classList.remove("d-none");
    if (chatWindowWasHidden) {
        playChatAnim(chatWindow, "chat-anim-pop");
    }

    // Only update the header if we passed in a username and picture
    // This is necessary because the function is called both when the chat needs to load for the first time and whenever a message in the chat changes
    if (friendUsername && friendProfilePic) {
        // Stash the identity so minimize -> capsule -> restore can rebuild this header
        chatWindow.dataset.friendUsername = friendUsername;
        chatWindow.dataset.friendProfilePic = friendProfilePic;

        let headerInfo = document.querySelector(".js-chat-header-info");
        headerInfo.innerHTML = `
            <img src="${escapeHTML(friendProfilePic)}" class="rounded-circle" onerror="this.onerror=null; this.src='${DEFAULT_PROFILE_PIC}'" style="width: 30px; height: 30px; object-fit: cover;">
            <span class="fw-bold">${escapeHTML(friendUsername)}</span>
        `;
    }

    // Make sure we know who the current user is before hitting the chat API.
    // (Prevents a null senderId on the first chat-open right after a page refresh.)
    let currentUserId = await ensureCurrentUser();
    if (!currentUserId) {
        if (chatHistoryContainer) {
            chatHistoryContainer.innerHTML = `<div class="text-center text-danger mt-5">Could not verify your session. Please refresh the page.</div>`;
        }
        return;
    }

    try {
        // Fetch the chat history from the DB using the router routes and the controller functions
        let response = await fetch('/api/chats/getAllMessages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderId: currentUserId,
                receiverId: friendId
            })
        });

        let result = await response.json();

        if (result.success) {
            // Record what we just rendered so the poll only rebuilds on a real change
            chatWindow.dataset.msgSignature = chatMessagesSignature(result.data || []);

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
        autoGrowTextarea(chatInput);   // shrink back to a single row
        setTimeout(() => chatInput.focus(), 100);
    }

    // Scroll to the bottom of the chat
    if (chatHistoryContainer) {
        // Use a tiny timeout to ensure the rendering process for the new bubbles is complete before scrolling
        setTimeout(() => {
            chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
        }, 10);
    }

    // Start watching this conversation for incoming messages
    startChatPolling();
}

// ===== Live conversation refresh (polling) =====

// Compact fingerprint of a message list — lets the poll skip needless DOM rebuilds.
function chatMessagesSignature(messagesArray) {
    return (messagesArray || [])
        .map(m => `${m._id}:${m.type}:${m.content || ""}:${m.updatedAt || ""}`)
        .join("|");
}

// Re-fetch the open conversation and re-render ONLY if something changed.
// Never touches the input box or steals focus (that's why it isn't openChatWindow).
async function refreshOpenChat(options = {}) {
    let chatWindow = document.querySelector(".chat-window-container");
    if (!chatWindow || chatWindow.classList.contains("d-none")) {
        return;
    }

    let friendId = chatWindow.dataset.friendId;
    if (!friendId) {
        return;
    }

    let currentUserId = await ensureCurrentUser();
    if (!currentUserId) {
        return;
    }

    let historyContainer = document.querySelector(".js-chat-history-container");
    if (!historyContainer) {
        return;
    }

    // Capture the user's scroll intent BEFORE we fetch / rebuild
    let distanceFromBottom = historyContainer.scrollHeight - historyContainer.scrollTop - historyContainer.clientHeight;
    let wasNearBottom = distanceFromBottom < 60;
    let prevScrollTop = historyContainer.scrollTop;

    let result;
    try {
        let response = await fetch('/api/chats/getAllMessages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: currentUserId, receiverId: friendId })
        });
        result = await response.json();
    } catch (error) {
        return; // stay quiet — the next tick will retry
    }

    if (!result || !result.success || !Array.isArray(result.data)) {
        return;
    }

    // Nothing changed -> leave the DOM (and any open hover menu) exactly as it is
    let signature = chatMessagesSignature(result.data);
    if (!options.force && signature === chatWindow.dataset.msgSignature) {
        return;
    }
    chatWindow.dataset.msgSignature = signature;

    if (result.data.length === 0) {
        historyContainer.innerHTML = `<div class="text-center text-muted mt-5">No messages yet. Say hi! 👋</div>`;
        return;
    }

    closeAllMsgMenus();
    renderChatHistory(result.data);

    // renderChatHistory rebuilds innerHTML (scrollTop resets to 0) — put the user back
    if (isChatSearchOpen) {
        // search re-applies its own highlight + scroll in renderChatHistory
    } else if (wasNearBottom || options.scrollToBottom) {
        historyContainer.scrollTop = historyContainer.scrollHeight;
    } else {
        historyContainer.scrollTop = prevScrollTop;
    }
}

function startChatPolling() {
    stopChatPolling();
    chatPollTimer = setInterval(function () {
        // Don't poll a hidden tab, and never rebuild while a message modal is open
        if (document.hidden) {
            return;
        }
        if (document.querySelector("#editMessageModal.show, #deleteMessageModal.show")) {
            return;
        }
        refreshOpenChat();
    }, CHAT_POLL_MS);
}

function stopChatPolling() {
    if (chatPollTimer) {
        clearInterval(chatPollTimer);
        chatPollTimer = null;
    }
}

// Coming back to the tab: refresh immediately instead of waiting for the next tick
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
        refreshOpenChat({ force: true });
    }
});

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
        let bubbleClass = isMe ? "chat-bubble--out" : "chat-bubble--in";
        let shareText = isMe ? "You shared a post" : "Shared a post";

        // Secure the text before putting it into bubbles
        let safeContent = escapeHTML(message.content);

        // Professional 3-dots action menu — only on my own messages.
        // The message text is NEVER interpolated into a handler; handleEditMessage
        // reads the current text straight from the bubble's .js-msg-text node.
        let actionMenuHTML = "";
        if (isMe) {
            let editItem = (message.type === "text")
                ? `<button type="button" class="js-msg-edit" onclick="handleEditMessage('${message._id}')">Edit</button>`
                : "";
            let deleteItem = `<button type="button" class="js-msg-delete" onclick="handleDeleteMessage('${message._id}')">Delete</button>`;
            actionMenuHTML = `
                <div class="chat-msg-menu">
                    <button type="button" class="chat-msg-menu-toggle" onclick="toggleMsgMenu(this)" aria-label="Message actions">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <div class="chat-msg-actions">${editItem}${deleteItem}</div>
                </div>`;
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
                    mediaTag = `<div class="d-flex justify-content-center align-items-center p-2 w-100 h-100" style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); overflow: hidden;"><span class="text-center fw-bold chat-textpost-label" style="font-size: 12px;">${captionText}</span></div>`;
                }

                let safePostId = escapeHTML(String(actualPostId));

                // The postId lives ONLY in data-shared-post-id; viewSharedPost reads
                // it back from the DOM — it's never interpolated into a JS handler.
                let bubbleHTML = `
                <div class="d-flex align-items-center ${alignmentClass} mb-3 chat-msg-row">
                    ${actionMenuHTML}
                    <div class="chat-shared-card js-shared-post-card rounded-4 p-2 shadow-sm" data-shared-post-id="${safePostId}" style="max-width: 75%;">
                        <div class="d-flex align-items-center gap-2 mb-2 px-1 cursor-pointer" onclick="viewSharedPost(this)">
                            <span class="fw-semibold text-12 text-muted">${shareText}</span>
                        </div>
                        <div class="rounded-3 overflow-hidden position-relative cursor-pointer" style="height: 200px; width: 150px; display: flex; align-items: center; justify-content: center; background-color: #000;" onclick="viewSharedPost(this)">
                            ${mediaTag}
                        </div>
                        <div class="mt-2 text-center fw-semibold text-12 py-1 cursor-pointer text-primary" onclick="viewSharedPost(this)">View Post</div>
                    </div>
                </div>
                `;
                chatHistoryContainer.innerHTML += bubbleHTML;
            } else {
                // Render a placeholder if the original post was deleted
                let bubbleHTML = `
                <div class="d-flex align-items-center ${alignmentClass} mb-3 chat-msg-row">
                    ${actionMenuHTML}
                    <div class="chat-shared-card rounded-4 p-3 shadow-sm text-muted fst-italic" style="font-size: 14px;">
                        This post has been deleted.
                    </div>
                </div>`;
                chatHistoryContainer.innerHTML += bubbleHTML;
            }
        }
        // Handle standard text messages
        else if (message.type === "text") {
            let bubbleHTML = `
            <div class="d-flex align-items-center ${alignmentClass} mb-3 chat-msg-row">
                ${actionMenuHTML}
                <div class="chat-bubble ${bubbleClass} shadow-sm">
                    <div class="js-msg-text text-break" data-message-id="${message._id}">${safeContent}</div>
                </div>
            </div>`;
            chatHistoryContainer.innerHTML += bubbleHTML;
        }
    });

    // Keep search highlights alive across live-poll re-renders
    if (isChatSearchOpen && chatSearchQuery) {
        reapplyChatSearch();
    }
}

// Shared auto-grow for chat-style textareas: grows to fit content up to the
// element's CSS max-height, then lets it scroll, keeping the caret in view
// while the user types at the end.
function autoGrowTextarea(el) {
    if (!el) {
        return;
    }
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    if (el.selectionStart === el.value.length) {
        el.scrollTop = el.scrollHeight;
    }
}

// ===== Generic chat notice modal (replaces native alert) =====
function injectChatNoticeModal() {
    if (document.getElementById('chatNoticeModal')) {
        return;
    }
    const modalHTML = `
    <div class="modal fade" id="chatNoticeModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4">
                <div class="modal-header border-bottom-0">
                    <h5 class="modal-title fw-bold" id="chatNoticeModalTitle">Notice</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-0">
                    <p class="mb-0 text-dark" id="chatNoticeModalBody"></p>
                </div>
                <div class="modal-footer border-top-0">
                    <button type="button" class="btn btn-primary px-4" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const el = document.getElementById('chatNoticeModal');
    el.addEventListener('hide.bs.modal', () => {
        if (document.activeElement && el.contains(document.activeElement)) {
            document.activeElement.blur();
        }
    });
}

function showChatMessageModal(title, message) {
    injectChatNoticeModal();
    document.getElementById('chatNoticeModalTitle').textContent = title || "Notice";
    document.getElementById('chatNoticeModalBody').textContent = message || "";
    let modal = new bootstrap.Modal(document.getElementById('chatNoticeModal'));
    modal.show();
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
                    <textarea id="editMessageInput" class="form-control rounded-3" rows="3"
                        style="max-height: 180px; overflow-y: auto;"
                        oninput="autoGrowTextarea(this)"></textarea>
                    <div id="editMessageError" class="text-danger mt-2 d-none" style="font-size: 14px;"></div>
                </div>
                <div class="modal-footer border-top-0">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary px-4" onclick="submitEditMessage(this)">Save Changes</button>
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

function handleEditMessage(messageId) {
    closeAllMsgMenus();

    // Build the popup window
    injectEditModal();

    // Read the current text straight from the DOM so message content is never
    // interpolated into an inline handler (safe against quotes / newlines / markup).
    let textNode = document.querySelector(`.js-msg-text[data-message-id="${messageId}"]`);
    let oldContent = textNode ? textNode.textContent : "";

    // Storing inportant values in hidden elements for future use- in submit function
    document.getElementById('hiddenEditMessageId').value = messageId;
    let editInput = document.getElementById('editMessageInput');
    editInput.value = oldContent;
    document.getElementById('editMessageError').classList.add('d-none');

    // Creating a Bootstrap modal instance and displaying it on the screen
    let editModalEl = document.getElementById('editMessageModal');

    // Once visible: size the textarea to the content and drop the caret at the
    // end so long messages open scrolled to where the user will type.
    editModalEl.addEventListener('shown.bs.modal', function onShown() {
        editModalEl.removeEventListener('shown.bs.modal', onShown);
        autoGrowTextarea(editInput);
        editInput.focus();
        editInput.selectionStart = editInput.selectionEnd = editInput.value.length;
        editInput.scrollTop = editInput.scrollHeight;
    });

    let editModal = new bootstrap.Modal(editModalEl);
    editModal.show();
}

async function submitEditMessage(button) {
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

    // Make sure the current user is known before sending
    let currentUserId = await ensureCurrentUser();
    if (!currentUserId) {
        errorBox.innerText = "Could not verify your session. Please refresh the page.";
        errorBox.classList.remove('d-none');
        return;
    }

    // Block a second click while this request is in flight
    if (button) {
        button.disabled = true;
    }

    try {
        // Trying to update the message using the controller and router with fetch
        let response = await fetch('/api/chats/updateMessage', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messageId: messageId,
                updatedContent: newContent,
                senderId: currentUserId,
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
    } finally {
        // Re-enable for a retry after errors (on success the modal is hidden)
        if (button) {
            button.disabled = false;
        }
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
                    <button type="button" class="btn btn-danger px-4" onclick="submitDeleteMessage(this)">Delete</button>
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
    closeAllMsgMenus();

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

async function submitDeleteMessage(button) {
    // Getting the new relevant values from the screen
    let messageId = document.getElementById('hiddenDeleteMessageId').value;
    let errorBox = document.getElementById('deleteMessageError');

    // Getting the current open friend chat from the chat element
    let chatWindow = document.querySelector(".chat-window-container");
    let friendId = chatWindow.dataset.friendId;

    // Make sure the current user is known before sending
    let currentUserId = await ensureCurrentUser();
    if (!currentUserId) {
        errorBox.innerText = "Could not verify your session. Please refresh the page.";
        errorBox.classList.remove('d-none');
        return;
    }

    // Block a second click while this request is in flight
    if (button) {
        button.disabled = true;
    }

    try {
        // Trying to update the message using the controller and router with fetch
        let response = await fetch('/api/chats/deleteSpecificMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messageId: messageId,
                senderId: currentUserId,
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
    } finally {
        // Re-enable for a retry after errors (on success the modal is hidden)
        if (button) {
            button.disabled = false;
        }
    }
}

// Click handler for a shared-post card / "View Post" button inside a chat bubble.
// Runs the exact required sequence:
//   1. read the postId straight from the card's data-attribute
//   2. minimize the chat UI (collapses to the capsule but remembers the
//      open conversation, so reopening lands back in the same chat)
//   3. hand off to the app's standard post-view logic
function viewSharedPost(element) {
    let card = element.closest(".js-shared-post-card");
    if (!card) {
        return;
    }

    let postId = card.dataset.sharedPostId;
    if (!postId) {
        return;
    }

    // Step 2 — minimizeChatUI sets chatWasInConversation, so restoreChatUI
    // (triggered from the capsule) reopens this exact conversation.
    minimizeChatUI();

    // Step 3 — standard "open / view / scroll to post" logic
    openSharedPostComments(postId);
}

function openSharedPostComments(postId) {
    let commentPopupBackground = document.querySelector(".comment-popup-background");
    if (!commentPopupBackground) {
        return;
    }

    let allPost = document.querySelector(`.js-all-post[data-post-id="${postId}"]`);

    // The shared post isn't on the current feed (filtered out, or not loaded).
    // Tell the user cleanly instead of silently doing nothing (the old bug).
    if (!allPost) {
        if (typeof showShareResultModal === "function") {
            showShareResultModal("View Post", "This post isn't available in your feed right now.", true);
        }
        return;
    }

    // Bring the post into view in the feed (visible once the popup is closed)
    allPost.scrollIntoView({ behavior: "smooth", block: "center" });

    commentPopupBackground.dataset.postId = postId;

    commentPopupBackground.classList.remove('d-none');
    commentPopupBackground.classList.add('d-flex');
    commentPopupBackground.querySelector(".comment-popup-container").classList.add('comment-popup-animation');
    document.body.classList.add('overflow-hidden');

    // Same population sequence as popupCommentMaker() in post-buttons.js
    addPostToPopupComment(commentPopupBackground, allPost);
    addHeaderToPopupComment(commentPopupBackground, allPost);
    addLikedByToPopupComment(commentPopupBackground, allPost);
    addCommentsToPopupComment(commentPopupBackground, allPost);
    addTypingLineToPopupComment(commentPopupBackground, allPost);
    updatePostButtonsUI(postId);
}

function backToMessages() {
    closeChatSearch();
    stopChatPolling();
    document.querySelector(".chat-window-container").classList.add("d-none");
    let messagesPopup = document.querySelector(".messages-popup-container");
    messagesPopup.classList.remove("d-none");
    playChatAnim(messagesPopup, "chat-anim-pop");
    renderMessagesList();
}

function closeChatWindow() {
    closeChatSearch();
    stopChatPolling();
    document.querySelector(".chat-window-container").classList.add("d-none");
    chatWasInConversation = false;   // explicit close = clean reset
    let messagesCapsule = document.querySelector(".js-messages-capsule");
    if (messagesCapsule) {
        messagesCapsule.classList.remove("d-none");
        playChatAnim(messagesCapsule, "chat-anim-capsule");
    }
}

// ============================================================
//  Chat search (WhatsApp-style)
//  Execution -> backend (POST /api/chats/searchForAMessage).
//  Highlighting/navigation -> frontend, within the loaded chat only.
// ============================================================

// Attached to the document ONLY while the search bar is open (see openChatSearch /
// closeChatSearch) so ESC never interferes with modals/popups elsewhere on the site.
function handleGlobalChatSearchEsc(event) {
    if (event.key === "Escape") {
        event.preventDefault();
        closeChatSearch();
    }
}

function toggleChatSearch() {
    if (isChatSearchOpen) {
        closeChatSearch();
    } else {
        openChatSearch();
    }
}

function openChatSearch() {
    let bar = document.querySelector(".js-chat-search-bar");
    if (!bar) {
        return;
    }
    bar.classList.remove("d-none");
    bar.classList.add("d-flex");
    isChatSearchOpen = true;

    document.addEventListener("keydown", handleGlobalChatSearchEsc);

    let toggle = document.querySelector(".js-chat-search-toggle");
    if (toggle) {
        toggle.classList.add("text-primary");
    }

    let input = document.querySelector(".js-chat-search-input");
    if (input) {
        input.focus();
        input.select();
    }
    updateChatSearchCount();
}

function closeChatSearch() {
    chatSearchSeq++;   // invalidate any in-flight search response

    document.removeEventListener("keydown", handleGlobalChatSearchEsc);

    let bar = document.querySelector(".js-chat-search-bar");
    if (bar) {
        bar.classList.add("d-none");
        bar.classList.remove("d-flex");
    }
    let input = document.querySelector(".js-chat-search-input");
    if (input) {
        input.value = "";
    }
    let toggle = document.querySelector(".js-chat-search-toggle");
    if (toggle) {
        toggle.classList.remove("text-primary");
    }

    clearChatSearchHighlights();
    isChatSearchOpen = false;
    chatSearchQuery = "";
    chatSearchResultIds = [];
    chatSearchMatches = [];
    chatSearchIndex = -1;
    updateChatSearchCount();
}

function handleChatSearchKey(event) {
    if (event.key !== "Enter") {
        return;
    }
    event.preventDefault();

    let query = event.target.value.trim();

    // Same query already searched -> just step through the existing hits
    if (query !== "" && query === chatSearchQuery && chatSearchMatches.length > 0) {
        gotoChatSearchMatch(event.shiftKey ? -1 : 1);
        return;
    }
    runChatSearch(query);
}

// Mirrors middleware/xssValidator.js so we can reject early with a clear message
const CHAT_SEARCH_FORBIDDEN = /[<>"'`${};|\\]/;

async function runChatSearch(rawQuery) {
    let query = (rawQuery || "").trim();

    // Reset highlight state before every new search
    clearChatSearchHighlights();
    chatSearchMatches = [];
    chatSearchIndex = -1;
    chatSearchResultIds = [];
    chatSearchQuery = "";

    if (query === "") {
        updateChatSearchCount();
        return;
    }

    if (CHAT_SEARCH_FORBIDDEN.test(query)) {
        showChatMessageModal("Invalid search",
            "Search text can't contain special characters like < > \" ' ` ; | \\ or { }.");
        updateChatSearchCount();
        return;
    }

    let chatWindow = document.querySelector(".chat-window-container");
    let friendId = chatWindow ? chatWindow.dataset.friendId : null;
    if (!friendId) {
        updateChatSearchCount();
        return;
    }

    let currentUserId = await ensureCurrentUser();
    if (!currentUserId) {
        showChatMessageModal("Session expired",
            "Could not verify your session. Please refresh the page and try again.");
        updateChatSearchCount();
        return;
    }

    let seq = ++chatSearchSeq;

    let countEl = document.querySelector(".js-chat-search-count");
    if (countEl) {
        countEl.textContent = "…";
    }

    let status;
    let result;
    try {
        let response = await fetch('/api/chats/searchForAMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messageSearch: query,
                senderId: currentUserId,
                receiverId: friendId
            })
        });
        status = response.status;
        result = await response.json();
    } catch (error) {
        if (seq === chatSearchSeq) {
            console.error("Chat search network error:", error);
            showChatMessageModal("Network error",
                "The search could not be completed. Please check your connection and try again.");
            updateChatSearchCount();
        }
        return;
    }

    // A newer search started, or search/chat was closed while we waited
    if (seq !== chatSearchSeq) {
        return;
    }

    // "Chat not found" => brand-new conversation, just treat as no results
    if (status === 404) {
        chatSearchQuery = query;
        chatSearchResultIds = [];
        paintChatSearchResults(false);
        return;
    }

    if (!result || !result.success) {
        let msg = (result && (result.error || result.message))
            ? (result.error || result.message)
            : "Could not search this conversation. Please try again.";
        showChatMessageModal("Search failed", msg);
        updateChatSearchCount();
        return;
    }

    let data = Array.isArray(result.data) ? result.data : [];
    chatSearchQuery = query;
    chatSearchResultIds = data
        .filter(m => m && m._id != null)
        .map(m => String(m._id));

    paintChatSearchResults(false);
}

// Highlight the cached result ids in the current DOM history.
// preserveIndex=true keeps the user on ~the same match after a poll rebuild.
function paintChatSearchResults(preserveIndex) {
    let prevIndex = chatSearchIndex;

    clearChatSearchHighlights();
    chatSearchMatches = [];

    let container = document.querySelector(".js-chat-history-container");
    if (container && chatSearchQuery && chatSearchResultIds.length > 0) {
        chatSearchResultIds.forEach(id => {
            let textEl = container.querySelector(`.js-msg-text[data-message-id="${id}"]`);
            if (textEl) {
                highlightTermInElement(textEl, chatSearchQuery);
            }
        });
        chatSearchMatches = Array.from(container.querySelectorAll("mark.chat-search-hit"));
    }

    if (chatSearchMatches.length === 0) {
        chatSearchIndex = -1;
    } else if (preserveIndex && prevIndex >= 0) {
        chatSearchIndex = Math.min(prevIndex, chatSearchMatches.length - 1);
        setActiveChatSearchMatch();
    } else {
        chatSearchIndex = chatSearchMatches.length - 1;   // newest match first
        setActiveChatSearchMatch();
    }
    updateChatSearchCount();
}

// Called by renderChatHistory after the poll rebuilds the history DOM
function reapplyChatSearch() {
    if (!isChatSearchOpen || !chatSearchQuery || chatSearchResultIds.length === 0) {
        return;
    }
    paintChatSearchResults(true);
}

function gotoChatSearchMatch(direction) {
    if (chatSearchMatches.length === 0) {
        return;
    }
    let count = chatSearchMatches.length;
    chatSearchIndex = (chatSearchIndex + direction + count) % count;
    setActiveChatSearchMatch();
    updateChatSearchCount();
}

function setActiveChatSearchMatch() {
    chatSearchMatches.forEach((mark, i) => {
        mark.classList.toggle("chat-search-hit--active", i === chatSearchIndex);
    });
    let active = chatSearchMatches[chatSearchIndex];
    if (active) {
        scrollChatMatchIntoView(active);
    }
}

// Scroll ONLY the history container (never the page) so the match sits centered.
function scrollChatMatchIntoView(mark) {
    let container = document.querySelector(".js-chat-history-container");
    if (!container || !mark) {
        return;
    }
    let cRect = container.getBoundingClientRect();
    let mRect = mark.getBoundingClientRect();
    let delta = (mRect.top - cRect.top) - (container.clientHeight / 2) + (mRect.height / 2);
    container.scrollTop += delta;
}

function updateChatSearchCount() {
    let countEl = document.querySelector(".js-chat-search-count");
    if (countEl) {
        if (chatSearchMatches.length > 0) {
            countEl.textContent = `${chatSearchIndex + 1}/${chatSearchMatches.length}`;
        } else {
            countEl.textContent = chatSearchQuery ? "0/0" : "";
        }
    }
    let hasMatches = chatSearchMatches.length > 0;
    document.querySelectorAll(".js-chat-search-nav").forEach(btn => {
        btn.disabled = !hasMatches;
    });
}

// Wrap every case-insensitive occurrence of `term` inside `el` with
// <mark class="chat-search-hit">. Text-node only + textContent => XSS-safe.
function highlightTermInElement(el, term) {
    let needle = (term || "").toLowerCase();
    if (!el || needle === "") {
        return;
    }

    let walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }

    textNodes.forEach(textNode => {
        let text = textNode.nodeValue;
        let lower = text.toLowerCase();
        let idx = lower.indexOf(needle);
        if (idx === -1) {
            return;
        }

        let frag = document.createDocumentFragment();
        let pos = 0;
        while (idx !== -1) {
            if (idx > pos) {
                frag.appendChild(document.createTextNode(text.slice(pos, idx)));
            }
            let mark = document.createElement("mark");
            mark.className = "chat-search-hit";
            mark.textContent = text.slice(idx, idx + needle.length);
            frag.appendChild(mark);
            pos = idx + needle.length;
            idx = lower.indexOf(needle, pos);
        }
        if (pos < text.length) {
            frag.appendChild(document.createTextNode(text.slice(pos)));
        }
        textNode.parentNode.replaceChild(frag, textNode);
    });
}

function clearChatSearchHighlights() {
    let container = document.querySelector(".js-chat-history-container");
    if (!container) {
        return;
    }
    container.querySelectorAll("mark.chat-search-hit").forEach(mark => {
        let parent = mark.parentNode;
        if (!parent) {
            return;
        }
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();   // merge the split text nodes back together
    });
}

// ===== Lightweight emoji quick-picker =====
function openEmojiPicker() {
    let picker = document.querySelector(".js-emoji-picker");
    if (!picker || !picker.classList.contains("d-none")) {
        return;
    }
    picker.classList.remove("d-none");
    // Listen for outside-clicks / ESC ONLY while the picker is actually open
    document.addEventListener("click", handleEmojiPickerOutsideClick);
    document.addEventListener("keydown", handleEmojiPickerEsc);
}

function closeEmojiPicker() {
    let picker = document.querySelector(".js-emoji-picker");
    if (!picker || picker.classList.contains("d-none")) {
        return;
    }
    picker.classList.add("d-none");
    document.removeEventListener("click", handleEmojiPickerOutsideClick);
    document.removeEventListener("keydown", handleEmojiPickerEsc);
}

function toggleEmojiPicker() {
    let picker = document.querySelector(".js-emoji-picker");
    if (!picker) {
        return;
    }
    if (picker.classList.contains("d-none")) {
        openEmojiPicker();
    } else {
        closeEmojiPicker();
    }
}

// Attached to the document ONLY while the picker is open (see openEmojiPicker).
function handleEmojiPickerOutsideClick(event) {
    if (!event.target.closest(".js-emoji-picker") &&
        !event.target.closest(".js-emoji-toggle")) {
        closeEmojiPicker();
    }
}

function handleEmojiPickerEsc(event) {
    if (event.key === "Escape") {
        closeEmojiPicker();
    }
}

// Insert the emoji at the caret position and keep the picker open for more picks.
function addEmojiToChatInput(emoji) {
    let input = document.querySelector(".js-chat-message-input");
    if (!input) {
        return;
    }
    let start = (typeof input.selectionStart === "number") ? input.selectionStart : input.value.length;
    let end = (typeof input.selectionEnd === "number") ? input.selectionEnd : input.value.length;

    input.value = input.value.slice(0, start) + emoji + input.value.slice(end);

    let caret = start + emoji.length;
    input.focus();
    input.setSelectionRange(caret, caret);
    autoGrowTextarea(input);
}

// Guard so a burst of Enter presses can't fire multiple sends.
let isSendingChatMessage = false;

// Shared send routine — called by both the Enter key and the Send button.
async function submitChatMessage() {
    // Already sending — ignore repeated triggers
    if (isSendingChatMessage) {
        return;
    }

    let chatWindow = document.querySelector(".chat-window-container");
    let chatInput = chatWindow ? chatWindow.querySelector(".js-chat-message-input") : null;
    if (!chatInput) {
        return;
    }

    // Get the message text — bail out if it's empty
    let content = chatInput.value.trim();
    if (content === "") {
        return;
    }

    // The friend whose chat is currently open
    let friendId = chatWindow.dataset.friendId;

    // Make sure the current user is known before sending
    let currentUserId = await ensureCurrentUser();
    if (!currentUserId) {
        showChatMessageModal("Session expired",
            "Could not verify your session. Please refresh the page and try again.");
        return;
    }

    // Lock the input + Send button for the duration of the request
    isSendingChatMessage = true;
    chatInput.disabled = true;
    setChatSendButtonSending(true);

    try {
        let response = await fetch('/api/chats/createMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: currentUserId,
                receiver: friendId,
                type: "text",
                content: content
            })
        });

        let result = await response.json();

        // Checks for potential validation errors (like xss) or other error from the server
        if (!response.ok && result.error) {
            showChatMessageModal("Message not sent", result.error);
            return;
        }

        if (result.success) {
            // Clear the typing input box and shrink it back to one row
            chatInput.value = "";
            autoGrowTextarea(chatInput);

            // Refresh the chat history (all the messages) to pull the new message from the DB
            await openChatWindow(friendId);
        } else {
            console.error("Failed to save message:", result.message);
            showChatMessageModal("Message not sent",
                "Something went wrong while sending your message. Please try again.");
        }

    } catch (error) {
        console.error("Network or server error:", error);
        showChatMessageModal("Network error",
            "Your message could not be sent. Please check your connection and try again.");
    } finally {
        // Re-enable only after the request settled and the box was handled
        isSendingChatMessage = false;
        chatInput.disabled = false;
        setChatSendButtonSending(false);
        chatInput.focus();
    }
}

// Flip the Send button between its normal blue state and a disabled "sending" state.
function setChatSendButtonSending(sending) {
    let btn = document.querySelector(".js-chat-send-btn");
    if (!btn) {
        return;
    }
    btn.disabled = sending;
    btn.classList.toggle("is-sending", sending);
}

async function handleChatInput(event) {
    // Only plain Enter sends. Shift+Enter falls through to insert a newline
    // (the textarea's oninput handler re-grows the box).
    if (event.key !== "Enter" || event.shiftKey) {
        return;
    }
    event.preventDefault();
    submitChatMessage();
}