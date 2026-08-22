const commentsDatabase = {
    1: [
        { 
            username: "ofra_fan99", 
            text: "רק טים עופרה!" ,
            likes: "20",
            time: "50m",
            isLiked: false
        },
        { 
            username: "yardena.arazi.fanpage", 
            text: "איכככככ מי יצביע לעופרה כולנו ירדנה בלב ❤️" ,
            likes: "5",
            time: "48m",
            isLiked: false
        },
        { 
            username: "real_dafna_dekel", 
            text: "חבר'ה פה בתגובות חייבים להרגע. זה רק ספורט!" ,
            likes: "100",
            time: "42m",
            isLiked: false
        },
        { 
            username: "ofra.haza.my.love", 
            text: "עופרה היא המלכה האמיתית! ירדנה סתם חקיינית" ,
            likes: "12",
            time: "31m",
            isLiked: false
        },
        { 
            username: "gali_atari10", 
            text: "סורי עופרה אני אוהבת את המסיבות על שמך אבל נראלי אני מצביעה לירדנה",
            likes: "33",
            time: "22m",
            isLiked: false
        },
        { 
            username: "yardena.thequeennnn", 
            text: "עופרה חזה מתה מבושה!!",
            likes: "12",
            time: "12m",
            isLiked: false
        },
        { 
            username: "gual.nefesh", 
            text: "גועל נפש",
            likes: "58",
            time: "4m",
            isLiked: false
        }
    ],
   2: [
        { 
            username: "donald.j.trump", 
            text: "You have to release a new song!! Thank you for your attention to this matter! PRESIDENT DONALD J. TRUMP" ,
            likes: "1541",
            time: "5h",
            isLiked: false
        },
        { 
            username: "elon.musk23", 
            text: "Can you sing one trillion dollar?" ,
            likes: "948",
            time: "3h",
            isLiked: false
        },
        { 
            username: "gual.nefesh", 
            text: "גועל נפש",
            likes: "912",
            time: "5m",
            isLiked: false
        }
    ],
    3: [
        { 
            username: "mustache.man", 
            text: "Thank you for the music!! The songs you're singing... Thanks for all the joy you're bringing!!" ,
            likes: "15",
            time: "1d",
            isLiked: false
        },
        { 
            username: "john_len99", 
            text: "I'm dreaming about moving to your band so bad" ,
            likes: "88",
            time: "1d",
            isLiked: false
        },
        { 
            username: "paulmc.cartney", 
            text: "@john_len99 WTH? LENON?!?! WE NEED TO TALK..." ,
            likes: "99",
            time: "23h",
            isLiked: false
        },
        { 
            username: "gual.nefesh", 
            text: "גועל נפש",
            likes: "144",
            time: "20h",
            isLiked: false
        }
    ],
    4: [
        { 
            username: "neil_arm_strong", 
            text: "BRO 🔥" ,
            likes: "4",
            time: "11h",
            isLiked: false
        },
        { 
            username: "lance_arm_strong", 
            text: "BRO 🔥" ,
            likes: "2",
            time: "9h",
            isLiked: false
        }
    ],
    5: [
        { 
            username: "lihi_griner67", 
            text: "רק נחתת מאיפה יש לך שיר חדש?!" ,
            likes: "985",
            time: "2d",
            isLiked: false
        },
        { 
            username: "rickroll", 
            text: "Never Gonna Give You Up, Never Gonna Let You Down" ,
            likes: "188",
            time: "1d",
            isLiked: false
        },
        { 
            username: "gual.nefesh", 
            text: "גועל נפש",
            likes: "214",
            time: "1d",
            isLiked: false
        }
    ],
    6: [
        { 
            username: "anna_russia", 
            text: "Big wheel keep on turnin'🛞" ,
            likes: "71",
            time: "1h",
            isLiked: false
        },
        { 
            username: "michael_jack2222", 
            text: "So beat it, just beat it" ,
            likes: "65",
            time: "1h",
            isLiked: false
        },
        { 
            username: "gurlll", 
            text: "I just wanna have fun" ,
            likes: "24",
            time: "1h",
            isLiked: false
        }
    ],
    7: [
        { 
            username: "abba.band", 
            text: "As we always said, The winner takes it all." ,
            likes: "555",
            time: "55m",
            isLiked: false
        },
        { 
            username: "hamsa.band", 
            text: "חמסה חמסה חמסה 🖐️🖐️🖐️" ,
            likes: "555",
            time: "55m",
            isLiked: false
        },
        { 
            username: "zehava.b", 
            text: "שאלוהים יתן לכם רק טיפת מזל" ,
            likes: "555",
            time: "55m",
            isLiked: false
        },
        { 
            username: "tina.terner111", 
            text: "You're simply the best! Better than all the rest...",
            likes: "55",
            time: "5m",
            isLiked: false
        },
        { 
            username: "gual.nefesh", 
            text: "זה לא גועל נפש" ,
            likes: "55",
            time: "5m",
            isLiked: false
        }
    ]
};

const timeDictionary = {
    's': 'seconds',
    'm': 'minutes',
    'h': 'hours',
    'd': 'days',
    'w': 'weeks'
};

const likedPosts = {};
const savedPosts = {};

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

const chatsDatabase = {};

function likePost(button) { // the function only update on database if the post were liked or unliked and then call to other function to draw it
  
    let idDiv = button.closest('[data-post-id]');  // find the id of the post
    if (!idDiv) return;
    
    let postId = idDiv.dataset.postId;
    let changeLike = 0;

  
    if (likedPosts[postId]) {
        delete likedPosts[postId];
        changeLike = -1;
    } else {
        likedPosts[postId] = true;
        changeLike = 1;
    }


    button.classList.add('button-pop-animation');
    setTimeout(() => button.classList.remove('button-pop-animation'), 300); // make the button jump


    syncLikePost(postId, changeLike);
}



function syncLikePost(postId, changeLike) {
    let isLiked = likedPosts[postId] === true;
    
    let postInData = allPostsData.find(post => post.id === parseInt(postId));

    if (postInData && changeLike !== 0) {
        postInData.stats.likes = (parseInt(postInData.stats.likes) + changeLike).toString();
    }

    let allMatchingPosts = document.querySelectorAll(`[data-post-id="${postId}"]`);  // the post in the feed the and the post in the popup section if its open

    allMatchingPosts.forEach(postElement => {
   
        let heartBtn = postElement.querySelector('.js-like-container .post-icons');
        if (heartBtn) {
            if (isLiked) {
                heartBtn.classList.remove('bi-heart');
                heartBtn.classList.add('bi-heart-fill', 'text-danger');
            } else {
                heartBtn.classList.add('bi-heart');
                heartBtn.classList.remove('bi-heart-fill', 'text-danger');
            }
        }

    
        if (changeLike !== 0) {
            let likeCounter = postElement.querySelector(".js-like-counter");
            if (likeCounter) {
                likeCounter.innerText = parseInt(likeCounter.innerText) + changeLike;
            }
            
            let likedByCounter = postElement.querySelector(".js-liked-by-counter");
            if (likedByCounter) {
                likedByCounter.innerText = parseInt(likedByCounter.innerText) + changeLike;
            }
        }
    });
}



function savePost(button) {  // the function only update on database if the post were saved or unsaved and then call to other function to draw it
    let idDiv = button.closest('[data-post-id]'); // find the id of the post
    if (!idDiv) return; 
    
    let postId = idDiv.dataset.postId;

    if (savedPosts[postId]) {
        delete savedPosts[postId]; 
    } else {
        savedPosts[postId] = true; 
    }

    button.classList.add('button-pop-animation'); // make the button jump
    setTimeout(() => button.classList.remove('button-pop-animation'), 300);

    syncSavePost(postId);
}

function syncSavePost(postId) {
    let isSaved = savedPosts[postId] === true;
    let allMatchingPosts = document.querySelectorAll(`[data-post-id="${postId}"]`);
    
    allMatchingPosts.forEach(postElement => {
        let saveBtn = postElement.querySelector('.js-save-button');

        if (saveBtn) {
            if (isSaved) {
                saveBtn.classList.remove('bi-bookmark');
                saveBtn.classList.add('bi-bookmark-fill', 'text-dark');
            } else {
                saveBtn.classList.add('bi-bookmark');
                saveBtn.classList.remove('bi-bookmark-fill', 'text-dark');
            }
        }
    });
}

function popupCommentMaker(comment)
{
    let commentPopupBackground = document.querySelector(".comment-popup-background");
    commentPopupBackground.classList.remove('d-none');
    commentPopupBackground.classList.add('d-flex'); // display the pop up window (changing from d-none to d-flex) 
    commentPopupBackground.querySelector(".comment-popup-container").classList.add('comment-popup-animation'); // adding animation class to the pop up window 
    document.body.classList.add('overflow-hidden'); // make the scrolling behins the popup to unavailable 
    let allPost = comment.closest(".js-all-post");
    commentPopupBackground.dataset.postId = allPost.dataset.postId;
    let postId = allPost.dataset.postId;
    
    syncLikePost(postId, 0);
    syncSavePost(postId);
    addPostToPopupComment(commentPopupBackground, allPost);
    addHeaderToPopupComment(commentPopupBackground, allPost);
    addLikedByToPopupComment(commentPopupBackground, allPost);
    addCommentsToPopupComment(commentPopupBackground, allPost);
    addTypingLineToPopupComment(commentPopupBackground, allPost);
}

function addPostToPopupComment(commentPopupBackground, allPost){
    let commentPopupPost = commentPopupBackground.querySelector(".comment-popup-post");
    commentPopupPost.innerHTML = allPost.querySelector(".js-post-media").outerHTML; // main post copy to popup 

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
function addCommentsToPopupComment(commentPopupBackground, allPost){
    let postComments = commentsDatabase[allPost.dataset.postId];
    let commentPopupList = commentPopupBackground.querySelector(".js-popup-comments-slot");
    commentPopupList.innerHTML = "";
    let authorProfilePic = allPost.querySelector(".js-post-header img").src; // if there are 2 authors take the first one
    let captionHTML = allPost.querySelector(".js-post-caption");
    let commentPopupHeader = commentPopupBackground.querySelector(".js-popup-header-slot");
    let postTime = commentPopupHeader.querySelector(".js-post-time");
    let time = postTime ? postTime.innerText.replace('•', '').trim() : "";

    if (captionHTML && captionHTML.innerText.trim() != "")
    {
        let caption = captionHTML.innerHTML;
        commentPopupList.innerHTML =
         `
        <div class="d-flex m-3">
            <div class="flex-shrink-0">
                <img src="${authorProfilePic}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
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

   if (postComments) {
        postComments.forEach((comment, index) => {
            let heartClass = comment.isLiked ? "bi-heart-fill text-danger" : "bi-heart text-muted";

            let commentHTML = `
                <div class="d-flex m-3 align-items-start js-comment-row">
                    <div class="flex-shrink-0">
                        <img src="elements/media/profile-pictures/${comment.username}.jpg" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
                    </div>
                    <div class="w-100 ms-2 text-break" style="min-width: 0;">
                        <a href="#!" class="username fw-semibold text-decoration-none text-dark">${comment.username}</a>
                        <span class="ms-1">${comment.text}</span>

                        <div class="d-flex align-items-center mt-1 text-muted text-12" style="gap: 12px;">
                            <span>${comment.time}</span>
                            <span class="fw-semibold js-comment-likes-count" style="cursor: pointer;">${comment.likes} likes</span>
                            <button class="bg-transparent border-0 p-0 text-muted fw-semibold" onclick="prepareReply('${comment.username}')">Reply</button>
                            <button class="bg-transparent border-0 p-0 text-muted fw-semibold">See translation</button>
                        </div>
                    </div>
                    <div class="ms-3 mt-1">
                        <button class="bi ${heartClass} fs-6 bg-transparent border-0 p-0 post-icons" onclick="toggleCommentLike('${allPost.dataset.postId}', ${index}, this)"></button>
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

    let typingElement = document.createElement("div"); // make the "besteam_ever is typing..."
    typingElement.className = "someone-is-typing my-3 mx-4 d-none";
    typingElement.innerHTML = `besteam_ever is typing<span class="typing-dots ms-1"><span>.</span><span>.</span><span>.</span></span>`;
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

function publishNewComment() { //function that add the new comment to the database and to the div started by onclick post or enter 

    let commentInput = document.querySelector(".js-comment-input");
    let postButton = document.querySelector(".js-post-button");
    
    let commentPopupList = document.querySelector(".js-popup-comments-slot");
    let typingElement = document.querySelector(".someone-is-typing");

    let newCommentText = commentInput.value.trim();
    
    if (newCommentText !== "") 
    {
        
        let currentPostId = postButton.dataset.postId;
        
        if (!commentsDatabase[currentPostId]) { // creating comment database if it does not exist
            commentsDatabase[currentPostId] = [];
        }

        commentsDatabase[currentPostId].push({
            username: "besteam_ever",
            text: newCommentText,
            likes: "0",
            time: "1s",
            isLiked: false
        });

        let commentPopupBackground = document.querySelector(".comment-popup-background");
        let allPost = document.querySelector(`[data-post-id="${currentPostId}"]`);
        
        addCommentsToPopupComment(commentPopupBackground, allPost); // render all the comments from start
        addTypingLineToPopupComment(commentPopupBackground, allPost);
        
        let commentPopupList = document.querySelector(".js-popup-comments-slot");
        commentPopupList.scrollTop = commentPopupList.scrollHeight; // scrolling down by posting

        let feedPost = document.querySelector(`.js-all-post[data-post-id="${currentPostId}"]`);
        
        if (feedPost) { // adding 1 to the comment number on html
            let chatIcon = feedPost.querySelector('.bi-chat');
            if (chatIcon) {
                let counterSpan = chatIcon.nextElementSibling;
                if (counterSpan) {
                    let currentCount = parseInt(counterSpan.innerText) || 0;
                    counterSpan.innerText = currentCount + 1;
                }
            }
        }

        let realPostId = parseInt(currentPostId);
        let postInData = allPostsData.find(post => post.id === realPostId);
        
        if (postInData) {
            let currentCommentsCount = parseInt(postInData.stats.comments) || 0; // adding 1 to share count on posts database
            postInData.stats.comments = (currentCommentsCount + 1).toString();
        }
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

    let realPostId = parseInt(postId);
    let postInData = allPostsData.find(post => post.id === realPostId);
        
        if (postInData) {
            let currentSharesCount = parseInt(postInData.stats.shares) || 0; // adding number of shares to share count on posts database
            postInData.stats.shares = (currentSharesCount + selectedIds.length).toString();
        }
}

function toggleCommentLike(postId, commentIndex, buttonElement) {
    let comment = commentsDatabase[postId][commentIndex];

    if (comment.isLiked) {
        comment.isLiked = false;
        comment.likes = (parseInt(comment.likes) - 1).toString();
        buttonElement.classList.remove("bi-heart-fill", "text-danger");
        buttonElement.classList.add("bi-heart", "text-muted");
    } else {
        comment.isLiked = true;
        comment.likes = (parseInt(comment.likes) + 1).toString();
        buttonElement.classList.remove("bi-heart", "text-muted");
        buttonElement.classList.add("bi-heart-fill", "text-danger");
    }

    buttonElement.classList.add('button-pop-animation');
    setTimeout(() => buttonElement.classList.remove('button-pop-animation'), 300);

    let commentRow = buttonElement.closest('.js-comment-row');
    let likesCountSpan = commentRow.querySelector('.js-comment-likes-count');
    likesCountSpan.innerText = comment.likes + " likes";
}

function prepareReply(username) {
    let commentInput = document.querySelector(".js-comment-input");
    if (commentInput) {
        commentInput.value = "@" + username + " ";
        commentInput.focus();
        commentInput.dispatchEvent(new Event('input')); // making an event like someone is typing
    }
}