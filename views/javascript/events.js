const menusConfig = [
    {
        menuClass: '.post-options-dropdown',
        dontRemoveOn: '.options-btn, .post-options-dropdown'
    },
    {
        menuClass: '.js-search-container',
        dontRemoveOn: '.js-search-container, .js-filter-menu, button'
    },
    {
        menuClass: '.js-filter-menu',
        dontRemoveOn: '.js-filter-menu, .js-search-container, button'
    },
    {
        menuClass: '.create-form-overlay',
        dontRemoveOn: '.js-menu-create-btn, .create-form-overlay, .js-discard-overlay, #postUploadChoiceModal, #groupsSelectionModal'
    },
    {
        menuClass: '.js-notifications-panel',
        dontRemoveOn: '.js-notifications-btn, .js-notifications-panel'
    }
];

// Global variables
let currentMediaType = '';
let currentMediaSource = '';
let isMuted = false;

// Theme element
const themeToggle = document.getElementById('theme-toggle');

// filter and search posts elements
const searchMenuBtn = document.querySelector('.js-search-btn');
const searchContainerWrapper = document.querySelector('.js-search-container');
const searchInput = document.querySelector('.js-posts-search-input');
const filterBtn = document.querySelector('.js-filter-btn');
const filterMenu = document.querySelector('.js-filter-menu');
const filterAllCheckboxes = document.querySelector('.js-filter-all');
const filterSingleCheckbox = document.querySelectorAll('.js-filter-single');

// Create new post form elemments
const menuCreateBtn = document.querySelector('.js-menu-create-btn');
const createFormOverlay = document.querySelector('.create-form-overlay');
const uploadFileCreateFormBtn = document.querySelector('.upload-from-computer-btn');
const createTextPostBtn = document.querySelector('.create-text-post-btn');
const fileInput = document.querySelector('.js-file-input');
const uploadForm = document.querySelector('.js-upload-form');
const formDetails = document.querySelector('.js-form-details');
const createFormContainer = document.querySelector('.create-form-container');
const previewText = document.querySelector('.js-preview-text');
const previewImg = document.querySelector('.js-preview-img');
const previewVideo = document.querySelector('.js-preview-video');
const postShareBtn = document.querySelector('.js-upload-post-btn');
const postFormBackBtn = document.querySelector('.js-back-post-btn');

// Discard container elements
const discardOverlay = document.querySelector('.js-discard-overlay');
const discardBtn = document.querySelector('.js-discard-btn');
const cancelDiscardBtn = document.querySelector('.js-cancel-discard-btn');

// All suggested follower Follow/Following buttons
const followButtons = document.querySelectorAll('.js-suggested-follow');

const backToTop = document.getElementById('backToTop');

// Show back to top arrow on scroll
window.addEventListener('scroll', () => {

    if (window.scrollY > 80) {
        backToTop.style.display = 'block';
    } else {
        backToTop.style.display = 'none';
    }


});

// Toggle dark mode
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

function closePostCreationForm() {
    createFormOverlay.classList.add('d-none');
    uploadForm.classList.remove('d-none');
    createFormContainer.classList.remove('expanded');
    formDetails.classList.add('d-none');
    fileInput.value = '';
    postFormBackBtn.classList.add('d-none');
    postShareBtn.classList.add('d-none');
    document.querySelector('.js-caption-input').value = '';
    document.querySelector('.js-location-input').value = '';
    document.body.style.overflow = '';
    document.getElementById('postUploadChoiceModal')?.classList.replace('d-flex', 'd-none');
    document.getElementById('groupsSelectionModal')?.classList.replace('d-flex', 'd-none');
}

function switchCreatePostFormState() {
    uploadForm.classList.toggle('d-none');
    formDetails.classList.toggle('d-none');
    postFormBackBtn.classList.toggle('d-none');
    postShareBtn.classList.toggle('d-none');
    createFormContainer.classList.toggle('expanded');
    fileInput.value = '';
    document.querySelector('.js-caption-input').value = '';
    document.querySelector('.js-location-input').value = '';
    document.getElementById('postUploadChoiceModal')?.classList.replace('d-flex', 'd-none');
    document.getElementById('groupsSelectionModal')?.classList.replace('d-flex', 'd-none');
}

function discardPost() {
    const discardActionType = discardBtn.getAttribute('discard-action');
    if (discardActionType == 'back') {
        switchCreatePostFormState();
    } else if (discardActionType == 'close') {
        closePostCreationForm();
    }
}

// Global listener usef for closing all open menu's when clicking on elements not in their 'safe zone'
document.addEventListener('click', function(event) {

    menusConfig.forEach(config => {

        const clickedInsideSafeZone = event.target.closest(config.dontRemoveOn);

        if (!clickedInsideSafeZone) {
            const openElements = document.querySelectorAll(`${config.menuClass}:not(.d-none)`);
            openElements.forEach(element => {
                element.classList.add('d-none');
                if (element.classList.contains('js-search-container')) {
                    updateSearchFilter('');
                    searchInput.value = '';
                }
            });
        }
    });
});

// Generate event listener on all suggested Follow/Followign buttons that changes their state between Follow and Following
followButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        if (this.textContent.trim() === 'Follow') {
            this.textContent = 'Following';
            this.classList.remove('instagram-blue');
            this.classList.add('following-state-btn');

        } else {
            this.textContent = 'Follow';
            this.classList.remove('following-state-btn');
            this.classList.add('instagram-blue');
        }
    });
});

// Open the 'delete post' or 'edit post' menu when clicking on the post options button, and deleting the post when the delete button is clicked
document.addEventListener('click', function(event) {

    if (event.target.classList.contains('options-btn')) {
        const parentContainer = event.target.closest('.position-relative');
        const dropdownMenu = parentContainer.querySelector('.post-options-dropdown');
        dropdownMenu.classList.toggle('d-none');
    }

    const deleteBtn = event.target.closest('.delete-post-btn');
    if (deleteBtn) {
        const deleteId = deleteBtn.getAttribute('data-id');
        deletePostById(deleteId);
    }

    const editBtn = event.target.closest('.edit-post-btn');
    if (editBtn) {
        const editId = editBtn.getAttribute('data-id');
        openEditModal(editId);
    }
});

// Open the create post form
menuCreateBtn.addEventListener('click', function(event) {
    createFormOverlay.classList.toggle('d-none');
    if (createFormOverlay.classList.contains('d-none')) {
        document.body.style.overflow = '';
    } else {
        document.body.style.overflow = 'hidden';
    }
});
createTextPostBtn.addEventListener('click', function(event) {
    currentMediaType = 'text';
    isMuted = false;
    previewImg.classList.add('d-none');
    previewVideo.classList.add('d-none');
    previewText.classList.remove('d-none');
    previewText.value = '';

    switchCreatePostFormState();
});

// Get file input when clicking 'Select from computer'
uploadFileCreateFormBtn.addEventListener('click', function(event) {
    fileInput.click();
});

// Use the selected media as image/video source for the creation form details stage
fileInput.addEventListener('change', function(event) {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
        // Create virtual path for fast UI preview
        const tempVirtualPath = URL.createObjectURL(selectedFile);

        // Read the actual file to send to the server
        const reader = new FileReader();
        reader.onload = function(e) {
            currentMediaSource = e.target.result; // This holds the actual Base64 data
        };
        reader.readAsDataURL(selectedFile);

        previewText.classList.add('d-none');

        if (selectedFile.type.startsWith('image/')) {
            currentMediaType = 'image';
            isMuted = false;
            previewImg.src = tempVirtualPath;
            previewImg.classList.remove('d-none');
            previewVideo.classList.add('d-none');
        } else if (selectedFile.type.startsWith('video/')) {
            currentMediaType = 'video';
            isMuted = true;
            previewVideo.src = tempVirtualPath;
            previewVideo.classList.remove('d-none');
            previewImg.classList.add('d-none');
        }

        switchCreatePostFormState();
    }
});

// Unique event listener to close the create post form correctly
createFormOverlay.addEventListener('click', function(event) {
    const clickFormConainer = event.target.closest('.create-form-container');

    if (!clickFormConainer) {
        if (createFormContainer.classList.contains('expanded')) {
            discardBtn.setAttribute('discard-action', 'close');
            discardOverlay.classList.remove('d-none');
        } else {
            closePostCreationForm();
        }
    }
});

// Remove discard message when cancelled
cancelDiscardBtn.addEventListener('click', function(event) {
    discardOverlay.classList.add('d-none');
    event.stopPropagation();
});

// Activate the discard function when discard is chosen
discardBtn.addEventListener('click', function(event) {
    discardOverlay.classList.add('d-none');
    discardPost();
});

// Activate discard screen and mark it as 'back'
postFormBackBtn.addEventListener('click', function(event) {
    discardBtn.setAttribute('discard-action', 'back');
    discardOverlay.classList.remove('d-none');
});

// --- Post Upload Logic and Modals ---

postShareBtn.addEventListener('click', function(event) {
    let captionText = document.querySelector('.js-caption-input').value;
    if (currentMediaType === 'text') {
        currentMediaSource = previewText.value.trim();
    }
    if (!currentMediaSource || currentMediaSource === "") {
        alert("Cannot upload an empty post!");
        return;
    }
    
    document.getElementById('postUploadChoiceModal').classList.replace('d-none', 'd-flex');
});

document.querySelector('.js-postUpload-followers-btn').addEventListener('click', function() {
    // Submit the post data to the server
    submitPostDataToServer(null); 
});

document.querySelector('.js-postUpload-groups-btn').addEventListener('click', async function() {
    document.getElementById('postUploadChoiceModal').classList.replace('d-flex', 'd-none');
    
    try {
        const response = await fetch('/api/groups/myGroups');
        const result = await response.json();
        
        if (result.success) {
            const userGroups = result.data;
            const container = document.getElementById('groupsListContainer');
            container.innerHTML = '';
            
            if(userGroups.length === 0) {
                container.innerHTML = '<div class="text-center text-muted mt-3">You are not in any groups yet.</div>';
            } else {
                userGroups.forEach(group => {
                    container.innerHTML += `
                        <label class="d-flex align-items-center justify-content-between p-2 rounded hover-light bg-light" style="cursor: pointer;">
                            <span class="fw-semibold">${group.name}</span>
                            <input type="radio" name="groupSelection" class="form-check-input js-group-upload-radio" value="${group._id}" data-admin-id="${group.admin || ''}">
                        </label>
                    `;
                });
            }
            
            document.getElementById('groupsSelectionModal').classList.replace('d-none', 'd-flex');
        }
    } catch (error) {
        console.error("Error fetching groups", error);
    }
});

// go back to the post upload choice modal from the groups selection modal
document.querySelector('.js-back-to-choice-btn').addEventListener('click', function() {
    document.getElementById('groupsSelectionModal').classList.replace('d-flex', 'd-none');
    document.getElementById('postUploadChoiceModal').classList.replace('d-none', 'd-flex');
});

document.querySelector('.js-final-postUpload-groups-btn').addEventListener('click', function() {
    const selectedRadio = document.querySelector('.js-group-upload-radio:checked');
    if (!selectedRadio) {
        alert("Please select a group");
        return;
    }

    const selectedGroupAdminId = selectedRadio.dataset.adminId || null;

    // Submit the post data to the server
    submitPostDataToServer(selectedRadio.value, selectedGroupAdminId);
});

async function submitPostDataToServer(groupId, groupAdminId = null) {
    let captionText = document.querySelector('.js-caption-input').value;
    let locationText = document.querySelector('.js-location-input').value;
    
    const newPost = {
        "authors": [CURRENT_USER_ID],
        "isVerified": false,
        "subHeader": locationText,
        "mediaType": currentMediaType,
        "mediaSource": currentMediaSource,
        "hasMuteButton": isMuted,
        "stats": { "likes": 0, "comments": 0, "shares": 0 },
        "likedByUsers": [],
        "caption": captionText,
        "isSuggested": false
    };

    if (groupId) {
        newPost.groupId = groupId;
        if (groupAdminId) {
            newPost.groupAdminId = groupAdminId;
        }
    }

    // Create the post
    await addNewPost(newPost);

    // Close the post creation form and reset its state
    closePostCreationForm();
    uploadNewPostNotification(currentMediaSource, currentMediaType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Open the search container when clicking on the search logo
searchMenuBtn.addEventListener('click', function(event) {
    updateSearchFilter('');
    searchInput.value = '';
    searchContainerWrapper.classList.toggle('d-none');
    searchInput.focus();
});

// Use the search input to filter posts
searchInput.addEventListener('input', function(event) {

    const searchString = event.target.value;
    updateSearchFilter(searchString);
});

// Open the posts filter menu when clicking on the logo
filterBtn.addEventListener('click', function() {
    filterMenu.classList.toggle('d-none');
});

// Used for updating the mediaType filter with the current checkboxes values
function triggerFilterUpdate() {
    const checkedTypes = Array.from(filterSingleCheckbox)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    updateMediaFilter(checkedTypes);
}

// Mark or un-mark every checkbox in accordance to the 'all' checkbox mark
filterAllCheckboxes.addEventListener('change', function(event) {
    const isChecked = event.target.checked;

    filterSingleCheckbox.forEach(cb => {
        cb.checked = isChecked;
    });

    triggerFilterUpdate();
});

// Upon 'change' event in the regular checkboxes (all checkboxes other then 'all'), change the 'all' checkbox accordingly, and trigger the mediaFilterUpdate
filterSingleCheckbox.forEach(checkbox => {
    checkbox.addEventListener('change', function() {

        const areAllChecked = Array.from(filterSingleCheckbox).every(cb => cb.checked);

        filterAllCheckboxes.checked = areAllChecked;

        triggerFilterUpdate();
    });
});

function togglePostAudio(button, postId) {
    let postContainer = button.closest('.js-post-media');
    let audioElement = postContainer.querySelector('audio');
    let videoElement = postContainer.querySelector('video');

    let mediaToToggle = audioElement ? audioElement : videoElement; // if there are any audio use it if not then use the video audio

    if (!mediaToToggle) return;

    if (mediaToToggle.muted) {
        document.querySelectorAll('audio, video').forEach(media => { // turn off all the sounds that turn on right now
            media.muted = true;
        });

        document.querySelectorAll('.bi-volume-up-fill').forEach(btn => {
            btn.classList.remove('bi-volume-up-fill');
            btn.classList.add('bi-volume-mute-fill');
        });

        mediaToToggle.muted = false; // turn on our sound
        mediaToToggle.play();

        if (videoElement && audioElement) {
            audioElement.muted = false;
            audioElement.currentTime = videoElement.currentTime;
            audioElement.play();
        }

        button.classList.remove('bi-volume-mute-fill');
        button.classList.add('bi-volume-up-fill');
    } else {
        mediaToToggle.muted = true;
        if (videoElement && audioElement) {
            audioElement.muted = true;
        }
        button.classList.remove('bi-volume-up-fill');
        button.classList.add('bi-volume-mute-fill');
    }
}

function restartMedia(videoElement) { // function that restart the video and the sound and sync it if the video were ended
    let postContainer = videoElement.closest('.js-post-media');
    let audioElement = postContainer.querySelector('audio');

    videoElement.currentTime = 0;
    videoElement.play();

    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play();
    }
}

function openEditModal(postId) {
    const post = allPostsData.find(p => p._id === postId);
    if (!post) return;

    document.getElementById('editPostId').value = postId;
    document.getElementById('editSubHeaderInput').value = post.subHeader || '';
    document.getElementById('editCaptionInput').value = post.caption || '';

    const modal = document.getElementById('editPostModal');
    modal.classList.replace('d-none', 'd-flex');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    const modal = document.getElementById('editPostModal');
    modal.classList.replace('d-flex', 'd-none');
    document.body.style.overflow = '';
}

function saveEditedPost() {
    const postId = document.getElementById('editPostId').value;
    const newSubHeader = document.getElementById('editSubHeaderInput').value;
    const newCaption = document.getElementById('editCaptionInput').value;
    
    // Call the function to update the post data on the server
    editPostData(postId, newCaption, newSubHeader);
}