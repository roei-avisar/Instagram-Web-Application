const storiesContainer = document.querySelector('.stories-scroll');
const leftButton = document.getElementById('stories-left');
const rightButton = document.getElementById('stories-right');
const modal = document.getElementById('storyModal');
const modalImage = document.getElementById('storyImage');
const storyVideo = document.getElementById('storyVideo');
const closeStory = document.getElementById('closeStory');

const storyProfile =  document.querySelector('.story-header-avatar');

const storyName = document.querySelector('.story-name');

// Side story previews (previous and next stories)
const prevStoryImage = document.getElementById('prevStoryImage');
const nextStoryImage = document.getElementById('nextStoryImage');
const prev2StoryImage = document.getElementById('prev2StoryImage');
const next2StoryImage = document.getElementById('next2StoryImage');

const prevProfileImage = document.getElementById('prevProfileImage');
const prevProfileName = document.getElementById('prevProfileName');
const nextProfileImage = document.getElementById('nextProfileImage');
const nextProfileName = document.getElementById('nextProfileName');

const prev2ProfileImage = document.getElementById('prev2ProfileImage');
const prev2ProfileName = document.getElementById('prev2ProfileName');

const next2ProfileImage = document.getElementById('next2ProfileImage');
const next2ProfileName = document.getElementById('next2ProfileName');

// Navigation arrows
const prevStoryBtn = document.getElementById('prevStoryBtn');
const nextStoryBtn = document.getElementById('nextStoryBtn');

// Get all story items from the stories bar
const stories = Array.from(document.querySelectorAll('.story-item'));

// Pause and progress bar
const pauseBtn = document.getElementById('pauseStory');
const progressBar = document.querySelector('.story-progress');

// Story reply
const storyReplyInput = document.getElementById('storyReplyInput');
const storySendBtn = document.getElementById('storySendBtn');

// stroy like
const storyLikeBtn = document.querySelector('.story-view .bi-heart, .story-view .bi-heart-fill');


storyReplyInput.addEventListener('input', () => {

    if (storyReplyInput.value.trim() !== '') {
        storySendBtn.style.display = 'block';
    } else {
        storySendBtn.style.display = 'none';
    }

});

storySendBtn.addEventListener('click', () => {
    storyReplyInput.value = '';
    storySendBtn.style.display = 'none';

});

let isPaused = false;

// Current opened story index
let currentStoryIndex = 0;
let storyTimer;

let isDragging = false;
let startX;
let scrollLeft;
let likedStories = {};

rightButton.addEventListener('click', () => {
    storiesContainer.scrollBy({
        left: 300,
        behavior: 'smooth'
    });
});

leftButton.addEventListener('click', () => {
    storiesContainer.scrollBy({
        left: -300,
        behavior: 'smooth'
    });
});

function updateStoriesArrows() {
    // Hide left arrow at start
    if (storiesContainer.scrollLeft <= 10) {
        leftButton.classList.add('d-none');
    } else {
        leftButton.classList.remove('d-none');
    }

    // Hide right arrow at the end
    if (storiesContainer.scrollLeft + storiesContainer.clientWidth >= storiesContainer.scrollWidth - 1) {
        rightButton.classList.add('d-none');
    } else {
        rightButton.classList.remove('d-none');
    }
}
storiesContainer.addEventListener('scroll', updateStoriesArrows);
window.addEventListener('resize', updateStoriesArrows);
updateStoriesArrows(); // updating on first load


storiesContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - storiesContainer.offsetLeft;
    scrollLeft = storiesContainer.scrollLeft;
});

storiesContainer.addEventListener('mouseleave', () => {
    isDragging = false;
});

storiesContainer.addEventListener('mouseup', () => {
    isDragging = false;
});

storiesContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    e.preventDefault();

    const x = e.pageX - storiesContainer.offsetLeft;
    const walk = (x - startX) * 2;

    storiesContainer.scrollLeft = scrollLeft - walk;
});

stories.forEach((story, index) => {

    story.addEventListener('click', () => {
        // Save current story position
        currentStoryIndex = index;
        const storyLikeBtn = document.querySelector('.story-view .bi-heart, .story-view .bi-heart-fill');
        if (storyLikeBtn) {
            if (likedStories[currentStoryIndex]) {
                storyLikeBtn.classList.remove('bi-heart');
                storyLikeBtn.classList.add('bi-heart-fill', 'text-danger');
            } else {
                storyLikeBtn.classList.remove('bi-heart-fill', 'text-danger');
                storyLikeBtn.classList.add('bi-heart');
            }
        }
        // hide arrow for the first and last stories
        if (currentStoryIndex === 0) {
            prevStoryBtn.style.display = 'none';
        } else {
            prevStoryBtn.style.display = 'flex';
        }
        if (currentStoryIndex === stories.length - 1) {
            nextStoryBtn.style.display = 'none';
        } else {
            nextStoryBtn.style.display = 'flex';
        }
        pauseBtn.classList.remove('bi-play-fill');
        pauseBtn.classList.add('bi-pause-fill');
        isPaused = false;
        const progressBar = document.querySelector('.story-progress');

        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';

        setTimeout(() => {
            progressBar.style.transition = 'width 8s linear';
            progressBar.style.width = '95%';
        }, 50);
        modalImage.src = story.dataset.story;
        storyProfile.src = story.dataset.profile;
        storyName.textContent = story.dataset.name;

        storyReplyInput.placeholder =
            `Reply to ${story.dataset.name}...`;

        // Previous story preview
        if (stories[index - 1]) {

            prevStoryImage.src = stories[index - 1].dataset.story;
            prevProfileImage.src = stories[index - 1].dataset.profile;
            prevProfileName.textContent = stories[index - 1].dataset.name;

            prevStoryImage.parentElement.style.display = 'block';

        } else {

            prevStoryImage.src = '';
            prevProfileImage.src = '';
            prevProfileName.textContent = '';
            prevStoryImage.parentElement.style.display = 'none';

        }

        // Previous story 2 preview
        if (stories[index - 2]) {

            prev2StoryImage.src = stories[index - 2].dataset.story;
            prev2ProfileImage.src = stories[index - 2].dataset.profile;
            prev2ProfileName.textContent = stories[index - 2].dataset.name;

            prev2StoryImage.parentElement.style.display = 'block';

        } else {
            prev2StoryImage.src = '';
            prev2ProfileImage.src = '';
            prev2ProfileName.textContent = '';
            prev2StoryImage.parentElement.style.display = 'none';

        }
        // Next story preview
        if (stories[index + 1]) {

            nextStoryImage.src = stories[index + 1].dataset.story;
            nextProfileImage.src = stories[index + 1].dataset.profile;
            nextProfileName.textContent = stories[index + 1].dataset.name;

            nextStoryImage.parentElement.style.display = 'block';

        } else {

            nextStoryImage.src = '';
            nextProfileImage.src = '';
            nextProfileName.textContent = '';

            nextStoryImage.parentElement.style.display = 'none';

        }


        // Next story 2 preview
        if (stories[index + 2]) {

            next2StoryImage.src = stories[index + 2].dataset.story;
            next2ProfileImage.src = stories[index + 2].dataset.profile;
            next2ProfileName.textContent = stories[index + 2].dataset.name;

            next2StoryImage.parentElement.style.display = 'block';

        } else {

            next2StoryImage.src = '';
            next2ProfileImage.src = '';
            next2ProfileName.textContent = '';

            next2StoryImage.parentElement.style.display = 'none';
        }
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';

                // Move automatically to the next story after 3 seconds
                clearTimeout(storyTimer);

                storyTimer = setTimeout(() => {
                    if (currentStoryIndex < stories.length - 1) {
                        currentStoryIndex++;
                        stories[currentStoryIndex].click();
                    }
                }, 8000);    });

        });

closeStory.addEventListener('click', () => {
    clearTimeout(storyTimer);
    modal.style.display = 'none';
    document.body.style.overflow = '';

});

prevStoryBtn.addEventListener('click', () => {

    if (currentStoryIndex > 0) {

        currentStoryIndex--;

        stories[currentStoryIndex].click();

    }

});

nextStoryBtn.addEventListener('click', () => {

    if (currentStoryIndex < stories.length - 1) {

        currentStoryIndex++;

        stories[currentStoryIndex].click();

    }

});

pauseBtn.addEventListener('click', () => {

    if (!isPaused) {

        clearTimeout(storyTimer);

        const currentWidth = progressBar.offsetWidth;

        progressBar.style.transition = 'none';
        progressBar.style.width = currentWidth + 'px';

        pauseBtn.classList.remove('bi-pause-fill');
        pauseBtn.classList.add('bi-play-fill');

        isPaused = true;

    } else {

        const fullWidth = progressBar.parentElement.offsetWidth;
        const currentWidth = progressBar.offsetWidth;

        const remainingPercent =
            1 - (currentWidth / fullWidth);

        const remainingTime =
            8000 * remainingPercent;

        progressBar.style.transition =
            `width ${remainingTime}ms linear`;

        progressBar.style.width = fullWidth + 'px';

        storyTimer = setTimeout(() => {

            if (currentStoryIndex < stories.length - 1) {

                currentStoryIndex++;
                stories[currentStoryIndex].click();

            }

        }, remainingTime);

        pauseBtn.classList.remove('bi-play-fill');
        pauseBtn.classList.add('bi-pause-fill');

        isPaused = false;
    }

});

storyLikeBtn.addEventListener('click', function() {
    this.classList.toggle('bi-heart');
    this.classList.toggle('bi-heart-fill');
    this.classList.toggle('text-danger');
    likedStories[currentStoryIndex] = this.classList.contains('bi-heart-fill');
});