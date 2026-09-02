const storiesContainer = document.querySelector('.stories-scroll');
const leftButton = document.getElementById('stories-left');
const rightButton = document.getElementById('stories-right');
const modal = document.getElementById('storyModal');
const modalImage = document.getElementById('storyImage');
const storyVideo = document.getElementById('storyVideo');
const closeStory = document.getElementById('closeStory');

const storyProfile = document.querySelector('.story-header-avatar');
const storyName = document.querySelector('.story-name');

// Previous / Next story user previews
const prevStoryImage = document.getElementById('prevStoryImage');
const nextStoryImage = document.getElementById('nextStoryImage');
const prev2StoryImage = document.getElementById('prev2StoryImage');
const next2StoryImage = document.getElementById('next2StoryImage');

const prevStoryVideo = document.getElementById('prevStoryVideo');
const nextStoryVideo = document.getElementById('nextStoryVideo');
const prev2StoryVideo = document.getElementById('prev2StoryVideo');
const next2StoryVideo = document.getElementById('next2StoryVideo');

const prevProfileImage = document.getElementById('prevProfileImage');
const prevProfileName = document.getElementById('prevProfileName');
const nextProfileImage = document.getElementById('nextProfileImage');
const nextProfileName = document.getElementById('nextProfileName');

const prev2ProfileImage = document.getElementById('prev2ProfileImage');
const prev2ProfileName = document.getElementById('prev2ProfileName');
const next2ProfileImage = document.getElementById('next2ProfileImage');
const next2ProfileName = document.getElementById('next2ProfileName');

const prevStoryBtn = document.getElementById('prevStoryBtn');
const nextStoryBtn = document.getElementById('nextStoryBtn');

const pauseBtn = document.getElementById('pauseStory');
const storyMuteBtn = document.getElementById('storyMuteBtn');
const deleteStoryBtn = document.getElementById('deleteStoryBtn');
const progressContainer = document.querySelector('.js-story-progress-container');



let isPaused = false;
let currentStoryDurationMs = 8000;
let isGlobalMuted = false;
let storyTimer;
let isDragging = false;
let startX;
let scrollLeft;
let likedStories = {};

let feedGroups = []; // The groups of stories from API
let currentGroupIndex = 0; // Which user's group we are currently viewing
let currentStoryIndexInGroup = 0; // Which story in the group we are viewing

// Fetch stories from API and render
async function loadStories() {
    try {
        const response = await fetch('/api/stories/getFeedStories');
        if (response.ok) {
            const data = await response.json();
            feedGroups = data.feed || [];
            renderStoriesBar();
        } else {
            console.error('Failed to fetch stories');
        }
    } catch (err) {
        console.error('Error fetching stories:', err);
    }
}

function renderStoriesBar() {
    if (!storiesContainer) return;
    storiesContainer.innerHTML = ''; // Clear container

    // Always render "Your Story" circle first
    const hasOwnStory = feedGroups.length > 0 && feedGroups[0].isCurrentUser;

    // Check if user has an active story
    let yourStoryHTML = '';
    const picSrc = typeof CURRENT_USER_PIC !== 'undefined' && CURRENT_USER_PIC ? CURRENT_USER_PIC : '/elements/media/profile-pictures/Default_pfp.jpg';
    const username = typeof CURRENT_USERNAME !== 'undefined' && CURRENT_USERNAME ? CURRENT_USERNAME : '';

    if (hasOwnStory) {
        yourStoryHTML = `
            <div class="story-item">
                <div class="profile-circle p-1 rounded-circle story-ring position-relative">
                    <img src="${picSrc}" onclick="openStoryViewer(0, 0)" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" class="story-avatar rounded-circle border border-white border-4 current-user-pic js-dynamic-pfp" data-username="${username}" style="cursor: pointer;" />
                    <div class="story-add-btn" onclick="openUploadStoryModal(); event.stopPropagation();" style="cursor: pointer; z-index: 5;"><i class="bi bi-plus"></i></div>
                </div>
                <p class="story-username">Your story</p>
            </div>
        `;
    } else {
        yourStoryHTML = `
            <div class="story-item your-story-item" onclick="openUploadStoryModal()">
                <div class="profile-circle p-1 rounded-circle position-relative">
                    <img src="${picSrc}" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" class="story-avatar rounded-circle border border-white border-1 current-user-pic js-dynamic-pfp" data-username="${username}" />
                    <div class="story-add-btn"><i class="bi bi-plus"></i></div>
                </div>
                <p class="story-username text-muted">Your story</p>
            </div>
        `;
    }
    storiesContainer.insertAdjacentHTML('beforeend', yourStoryHTML);

    // Render other users' stories
    feedGroups.forEach((group, index) => {
        // Skip current user because we handled it above
        if (group.isCurrentUser) return;

        const html = `
            <div class="story-item" onclick="openStoryViewer(${index}, 0)">
                <div class="profile-circle p-1 rounded-circle story-ring">
                    <img src="${group.author.profilePic}" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" class="story-avatar rounded-circle border border-white border-4 js-dynamic-pfp" data-username="${group.author.username}" />
                </div>
                <p class="story-username">${group.author.username}</p>
            </div>
        `;
        storiesContainer.insertAdjacentHTML('beforeend', html);
    });

    updateStoriesArrows();
}

// Function to open the upload modal with "Story" focus
function openUploadStoryModal() {
    window.isUploadingStory = true;
    const createFormOverlay = document.querySelector('.create-form-overlay');
    if (createFormOverlay) {
        createFormOverlay.classList.remove('d-none');
        document.body.style.overflow = 'hidden';
    }
}

window.openUploadStoryModal = openUploadStoryModal;

function openStoryViewer(groupIndex, storyIndex) {
    if (!feedGroups[groupIndex] || !feedGroups[groupIndex].stories[storyIndex]) return;

    currentGroupIndex = groupIndex;
    currentStoryIndexInGroup = storyIndex;

    const group = feedGroups[currentGroupIndex];
    const story = group.stories[currentStoryIndexInGroup];

    // UI Resets
    isPaused = false;
    pauseBtn.classList.remove('bi-play-fill');
    pauseBtn.classList.add('bi-pause-fill');

    storyProfile.src = group.author.profilePic;
    storyName.textContent = group.author.username;

    if (group.isCurrentUser) {
        deleteStoryBtn.classList.remove('d-none');
    } else {
        deleteStoryBtn.classList.add('d-none');
    }

    // Handle Media
    if (story.mediaType === 'video') {
        modalImage.style.display = 'none';
        storyVideo.style.display = 'block';
        storyVideo.src = '/' + story.mediaSource;
        storyVideo.muted = isGlobalMuted;
        storyMuteBtn.style.display = 'inline-block';
        if (isGlobalMuted) {
            storyMuteBtn.classList.remove('bi-volume-up-fill');
            storyMuteBtn.classList.add('bi-volume-mute-fill');
        } else {
            storyMuteBtn.classList.remove('bi-volume-mute-fill');
            storyMuteBtn.classList.add('bi-volume-up-fill');
        }
        storyVideo.play();
    } else {
        storyVideo.style.display = 'none';
        storyVideo.pause();
        modalImage.style.display = 'block';
        modalImage.src = '/' + story.mediaSource;
        storyMuteBtn.style.display = 'none';
    }

    // Show modal before rendering progress so transitions work correctly
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Render Progress Segments
    renderProgressSegments();

    // Force the browser to render the initial 0% state before starting animation
    void modal.offsetWidth;

    startProgressAnimation();

    updatePreviewThumbnails();

    // Arrows visibility
    if (currentGroupIndex === 0 && currentStoryIndexInGroup === 0) {
        prevStoryBtn.style.display = 'none';
    } else {
        prevStoryBtn.style.display = 'flex';
    }

    if (currentGroupIndex === feedGroups.length - 1 && currentStoryIndexInGroup === group.stories.length - 1) {
        nextStoryBtn.style.display = 'none';
    } else {
        nextStoryBtn.style.display = 'flex';
    }
}
window.openStoryViewer = openStoryViewer;

// creats the white line that show how long each story is shown
// and how many stories are left to show
function renderProgressSegments() {
    progressContainer.innerHTML = '';
    const group = feedGroups[currentGroupIndex];
    group.stories.forEach((_, idx) => {
        const seg = document.createElement('div');
        seg.className = 'story-progress-segment';

        const fill = document.createElement('div');
        fill.className = 'story-progress-fill';
        fill.id = `segment-fill-${idx}`;

        if (idx < currentStoryIndexInGroup) {
            fill.style.width = '100%';
        }
        seg.appendChild(fill);
        progressContainer.appendChild(seg);
    });
}

function startProgressAnimation() {
    clearTimeout(storyTimer);
    const fill = document.getElementById(`segment-fill-${currentStoryIndexInGroup}`);
    if (!fill) return;

    fill.style.transition = 'none';
    fill.style.width = '0%';
    void fill.offsetWidth; // Force reflow

    const group = feedGroups[currentGroupIndex];
    const story = group.stories[currentStoryIndexInGroup];

    if (story.mediaType === 'video') {
        if (storyVideo.readyState >= 1) {
            setVideoTimer(storyVideo.duration, fill);

            // video not loaded yet
        } else {
            storyVideo.onloadedmetadata = function () {
                setVideoTimer(storyVideo.duration, fill);
            };
        }

        // image story
    } else {
        currentStoryDurationMs = 8000;
        fill.style.transition = `width ${currentStoryDurationMs}ms linear`;
        fill.style.width = '100%';
        storyTimer = setTimeout(() => {
            goToNextStory();
        }, currentStoryDurationMs);
    }
}

function setVideoTimer(durationSec, fill) {
    let dur = parseFloat(durationSec);
    if (isNaN(dur) || dur <= 0) dur = 8; // Fallback to 8 seconds if duration is unknown

    currentStoryDurationMs = dur * 1000;
    if (currentStoryDurationMs > 60000) {
        currentStoryDurationMs = 60000;
    }

    fill.style.transition = `width ${currentStoryDurationMs}ms linear`;
    void fill.offsetWidth; // Force reflow
    fill.style.width = '100%';

    storyTimer = setTimeout(() => {
        goToNextStory();
    }, currentStoryDurationMs);
}

function goToNextStory() {
    const group = feedGroups[currentGroupIndex];
    if (currentStoryIndexInGroup < group.stories.length - 1) {
        openStoryViewer(currentGroupIndex, currentStoryIndexInGroup + 1);
    } else if (currentGroupIndex < feedGroups.length - 1) {
        openStoryViewer(currentGroupIndex + 1, 0);
    } else {
        closeStoryViewer();
    }
}

function goToPrevStory() {
    if (currentStoryIndexInGroup > 0) {
        openStoryViewer(currentGroupIndex, currentStoryIndexInGroup - 1);
    } else if (currentGroupIndex > 0) {
        openStoryViewer(currentGroupIndex - 1, 0);
    }
}

nextStoryBtn.addEventListener('click', goToNextStory);
prevStoryBtn.addEventListener('click', goToPrevStory);

async function deleteCurrentStory(e) {
    if (e) e.stopPropagation();

    const group = feedGroups[currentGroupIndex];
    const story = group.stories[currentStoryIndexInGroup];

    try {
        const response = await fetch(`/api/stories/deleteStory/${story._id}`, { method: 'DELETE' });
        if (response.ok) {
            closeStoryViewer();
            loadStories(); // Reload to refresh feed
        } else {
            console.error('Failed to delete story');
        }
    } catch (err) {
        console.error('Error deleting story', err);
    }
}
window.deleteCurrentStory = deleteCurrentStory;

function closeStoryViewer() {
    clearTimeout(storyTimer);
    storyVideo.pause();
    modal.style.display = 'none';
    document.body.style.overflow = '';
}
closeStory.addEventListener('click', closeStoryViewer);

pauseBtn.addEventListener('click', () => {
    const fill = document.getElementById(`segment-fill-${currentStoryIndexInGroup}`);
    if (!fill) return;

    if (!isPaused) {
        clearTimeout(storyTimer);
        const currentWidth = fill.offsetWidth;
        fill.style.transition = 'none';
        fill.style.width = currentWidth + 'px';

        storyVideo.pause();
        pauseBtn.classList.remove('bi-pause-fill');
        pauseBtn.classList.add('bi-play-fill');
        isPaused = true;
    } else {
        const fullWidth = fill.parentElement.offsetWidth;
        const currentWidth = fill.offsetWidth;
        const remainingPercent = 1 - (currentWidth / fullWidth);
        const remainingTime = currentStoryDurationMs * remainingPercent;

        fill.style.transition = `width ${remainingTime}ms linear`;
        fill.style.width = '100%';

        storyVideo.play();
        pauseBtn.classList.remove('bi-play-fill');
        pauseBtn.classList.add('bi-pause-fill');
        isPaused = false;

        storyTimer = setTimeout(() => {
            goToNextStory();
        }, remainingTime);
    }
});

storyMuteBtn.addEventListener('click', () => {
    isGlobalMuted = !isGlobalMuted;
    storyVideo.muted = isGlobalMuted;
    if (isGlobalMuted) {
        storyMuteBtn.classList.remove('bi-volume-up-fill');
        storyMuteBtn.classList.add('bi-volume-mute-fill');
    } else {
        storyMuteBtn.classList.remove('bi-volume-mute-fill');
        storyMuteBtn.classList.add('bi-volume-up-fill');
    }
});


function setSideStoryPreview(grp, imgEl, videoEl, profileImgEl, profileNameEl) {
    if (grp) {
        profileImgEl.src = grp.author.profilePic;
        profileNameEl.textContent = grp.author.username;
        imgEl.parentElement.style.visibility = 'visible';
        imgEl.parentElement.style.display = 'block';

        if (grp.stories[0].mediaType === 'video') {
            imgEl.style.display = 'none';
            videoEl.style.display = 'block';
            videoEl.src = '/' + grp.stories[0].mediaSource;
        } else {
            videoEl.style.display = 'none';
            imgEl.style.display = 'block';
            imgEl.src = '/' + grp.stories[0].mediaSource;
        }
    } else {
        imgEl.parentElement.style.visibility = 'hidden';
        imgEl.parentElement.style.display = 'block';
    }
}

function updatePreviewThumbnails() {
    // We use visibility instead of display so the DOM elements keep their exact width and the flex container stays perfectly centered.

    // Prev 2
    setSideStoryPreview(feedGroups[currentGroupIndex - 2], prev2StoryImage, prev2StoryVideo, prev2ProfileImage, prev2ProfileName);
    // Prev 1
    setSideStoryPreview(feedGroups[currentGroupIndex - 1], prevStoryImage, prevStoryVideo, prevProfileImage, prevProfileName);
    // Next 1
    setSideStoryPreview(feedGroups[currentGroupIndex + 1], nextStoryImage, nextStoryVideo, nextProfileImage, nextProfileName);
    // Next 2
    setSideStoryPreview(feedGroups[currentGroupIndex + 2], next2StoryImage, next2StoryVideo, next2ProfileImage, next2ProfileName);
}

// Basic scroll and drag functionality
rightButton.addEventListener('click', () => {
    storiesContainer.scrollBy({ left: 300, behavior: 'smooth' });
});

leftButton.addEventListener('click', () => {
    storiesContainer.scrollBy({ left: -300, behavior: 'smooth' });
});

function updateStoriesArrows() {
    if (!storiesContainer) return;

    // If the scrollbar is all the way to the left (or very close), hide the left arrow
    if (storiesContainer.scrollLeft <= 10) {
        leftButton.classList.add('d-none');
    } else {
        leftButton.classList.remove('d-none');
    }

    // scrollLeft: How far we've scrolled
    // clientWidth: The visible width of the container on the screen
    // scrollWidth: The total invisible width of all the circles combined
    // If what we've scrolled + what we can see >= the total width, we've hit the right edge!
    if (storiesContainer.scrollLeft + storiesContainer.clientWidth >= storiesContainer.scrollWidth - 1) {
        rightButton.classList.add('d-none');
    } else {
        rightButton.classList.remove('d-none');
    }
}
storiesContainer.addEventListener('scroll', updateStoriesArrows);
window.addEventListener('resize', updateStoriesArrows);

storiesContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - storiesContainer.offsetLeft;
    scrollLeft = storiesContainer.scrollLeft;
});

storiesContainer.addEventListener('mouseleave', () => { isDragging = false; });
storiesContainer.addEventListener('mouseup', () => { isDragging = false; });
storiesContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - storiesContainer.offsetLeft;
    const walk = (x - startX) * 2;
    storiesContainer.scrollLeft = scrollLeft - walk;
});



// Load stories initially
loadStories();
window.loadStories = loadStories;