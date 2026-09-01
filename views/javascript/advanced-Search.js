document.addEventListener('DOMContentLoaded', () => {
    const feedSearchPanel = document.querySelector('.js-feed-advanced-search-panel');
    const feedFilterBtn = document.querySelector('.js-filter-btn');
    const feedCloseBtn = document.querySelector('.js-close-feed-adv-search');

    if (feedFilterBtn && feedSearchPanel) {
        feedFilterBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // make click availablr only on viewd pannel and not in sidebar in he back
            feedSearchPanel.classList.remove('hidden-panel');
        });
    }

    if (feedCloseBtn && feedSearchPanel) {
        feedCloseBtn.addEventListener('click', () => {
            feedSearchPanel.classList.add('hidden-panel');
        });
    }

    document.addEventListener('mousedown', (event) => { // close pannel on click outside
        if (feedSearchPanel && !feedSearchPanel.classList.contains('hidden-panel')) {
            const isClickInsidePanel = feedSearchPanel.contains(event.target);
            const isClickOnFilterBtn = feedFilterBtn.contains(event.target);

            if (!isClickInsidePanel && !isClickOnFilterBtn) {
                feedSearchPanel.classList.add('hidden-panel');
            }
        }
    });
});

async function executeFeedAdvancedSearch() { // ona apply
    const searchText = document.getElementById('feedAdvSearchText').value;
    const mediaCheckboxes = document.querySelectorAll('.js-feed-adv-filter-media:checked');
    const mediaTypes = Array.from(mediaCheckboxes).map(cb => cb.value);
    const timeFilter = document.getElementById('feedAdvSearchTime').value;
    const feedSearchPanel = document.querySelector('.js-feed-advanced-search-panel');

    try {
        const response = await fetch('/api/posts/advancedSearch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ searchText, mediaTypes, timeFilter })
        });

        if (response.ok) {
            const searchResults = await response.json();
            
            if (feedSearchPanel) {
                feedSearchPanel.classList.add('hidden-panel');
            }
            
            renderPosts(searchResults); 
            console.log("Feed Search Results:", searchResults);

        } else {
            console.error('Feed advanced search request failed');
        }
    } catch (error) {
        console.error('Error executing feed advanced search:', error);
    }
}

function clearFeedAdvancedSearch() {
    // Clear text input
    const textInput = document.getElementById('feedAdvSearchText');
    if (textInput) textInput.value = '';

    // Check all media type checkboxes (default state)
    const mediaCheckboxes = document.querySelectorAll('.js-feed-adv-filter-media');
    mediaCheckboxes.forEach(cb => {
        cb.checked = true;
    });

    // Reset time filter to 'all'
    const timeFilter = document.getElementById('feedAdvSearchTime');
    if (timeFilter) timeFilter.value = 'all';
}