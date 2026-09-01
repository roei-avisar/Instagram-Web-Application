// Open the All Users modal
function openAllUsersPopup() {
  const modal = document.getElementById('allUsersModal');
  modal.classList.add('active');
  document.body.classList.add('overflow-hidden'); 

  // Trigger search to load default un-filtered list
  executeUserAdvancedSearch();
}

// Close the All Users modal
function closeAllUsersPopup() {
  document.getElementById('allUsersModal').classList.remove('active');
  document.body.classList.remove('overflow-hidden'); // make scrolling available again
  // Reset fields on close
  const searchInput = document.getElementById('allUsersSearchInput');
  if (searchInput) searchInput.value = '';
  clearUserSearchError();

  const filterIAmFollowing = document.getElementById('filterIAmFollowing');
  if (filterIAmFollowing) filterIAmFollowing.value = 'all';

  const filterIsFollowingMe = document.getElementById('filterIsFollowingMe');
  if (filterIsFollowingMe) filterIsFollowingMe.value = 'all';

  const listContainer = document.getElementById('allUsersList');
  if (listContainer) listContainer.innerHTML = '';
}

// Close modal when clicking on the dark overlay (outside the box)
document.getElementById('allUsersModal').addEventListener('mousedown', function (e) {
  if (e.target === this) {
    closeAllUsersPopup();
  }
});

// Render the list of users into the modal
function renderAllUsers(users) {
  const listContainer = document.getElementById('allUsersList');

  if (!users || users.length === 0) {
    listContainer.innerHTML = '<div class="text-center text-muted my-3">No other users found.</div>';
    return;
  }

  listContainer.innerHTML = ''; // Clear loading message

  users.forEach(user => {
    // Create the row element - the row is the main element that holds all the user's information
    const row = document.createElement('div');
    row.className = 'all-users-row';

    // Create user info container (profile picture + name + bio)
    const info = document.createElement('div');
    info.className = 'all-users-info';

    // add the user's profile picture
    const avatar = document.createElement('img');
    avatar.src = user.profilePic;
    avatar.onerror = function() {this.onerror = null; this.src = '/elements/media/profile-pictures/Default_pfp.jpg';};
    avatar.className = 'all-users-avatar';

    // add the user's name and bio containers
    const textDiv = document.createElement('div');
    textDiv.className = 'all-users-text';

    // create the user's name element
    const username = document.createElement('span');
    username.className = 'all-users-username';
    username.textContent = user.username;

    // append the user's name to the text container
    textDiv.appendChild(username);

    // add the user's bio if it exists
    if (user.bio) {
      const bio = document.createElement('span');
      bio.className = 'all-users-bio';
      bio.textContent = user.bio;
      textDiv.appendChild(bio);
    }

    // append the avatar image to the info container
    info.appendChild(avatar);

    // append the text container to the info container
    info.appendChild(textDiv);

    // append the info container to the row
    row.appendChild(info);

    // Create follow/following button
    const btn = document.createElement('button');
    if (user.isFollowing) {
      btn.className = 'following-btn';
      btn.textContent = 'Following';
    } else {
      btn.className = 'follow-btn';
      btn.textContent = 'Follow';
    }

    // Handle click
    btn.onclick = () => handleFollowToggle(user.userId, btn);

    row.appendChild(btn);
    listContainer.appendChild(row);
  });
}

// Handle following/unfollowing a user
async function handleFollowToggle(targetUserId, btnElement) {
  // Disable button while processing
  btnElement.disabled = true;

  const isCurrentlyFollowing = btnElement.textContent.trim() === 'Following';
  const endpoint = isCurrentlyFollowing ? '/api/user/unfollow' : '/api/user/follow';

  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: targetUserId })
    });

    if (res.ok) {
      // Toggle button appearance dynamically based on the button's current classes
      if (isCurrentlyFollowing) {
        btnElement.textContent = 'Follow';
        if (btnElement.classList.contains('following-btn')) {
          btnElement.classList.replace('following-btn', 'follow-btn');
        } else if (btnElement.classList.contains('text-dark')) {
          btnElement.classList.replace('text-dark', 'instagram-blue');
        }
      } else {
        btnElement.textContent = 'Following';
        if (btnElement.classList.contains('follow-btn')) {
          btnElement.classList.replace('follow-btn', 'following-btn');
        } else if (btnElement.classList.contains('instagram-blue')) {
          btnElement.classList.replace('instagram-blue', 'text-dark');
        }
      }
      // Refresh the feed posts to reflect changes in following status
      fetchPostsFromServer();
    } else {
      const data = await res.json();
      alert(data.error || 'Action failed.');
    }
  } catch (err) {
    console.error('Error toggling follow:', err);
    alert('Connection error.');
  } finally {
    btnElement.disabled = false;
  }
}

// Dynamically load suggested users for the right sidebar
async function loadSidebarSuggestedUsers() {
  const listContainer = document.getElementById('suggestedUsersSidebarList');
  if (!listContainer) return;

  try {
    const res = await fetch('/api/user/allUsers');
    const data = await res.json();

    if (res.ok) {
      // Filter out users we are already following
      const unfollowedUsers = data.users.filter(u => !u.isFollowing);

      // Shuffle and take 5
      const shuffled = unfollowedUsers.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5);

      listContainer.innerHTML = '';

      if (selected.length === 0) {
        listContainer.innerHTML = '<div class="text-muted fs-8 text-center mt-3">No suggestions available</div>';
        return;
      }

      selected.forEach(user => {
        const row = document.createElement('div');
        row.className = 'user-row d-flex justify-content-between align-items-center';

        // Truncate username for display if necessary
        const displayUsername = user.username.length > 12 ? user.username.substring(0, 10) + '...' : user.username;

        row.innerHTML = `
          <div class="user-info d-flex align-items-center gap-2">
            <img src="${user.profilePic || '/elements/media/profile-pictures/Default_pfp.jpg'}" onerror="this.onerror=null; this.src='/elements/media/profile-pictures/Default_pfp.jpg'" class="right-sidebar-avatar rounded-circle" />
            <div class="lh-1">
              <span class="username">${displayUsername}</span>
              <div class="d-flex mt-1">
                <span class="text-muted fs-8 ms-1">Suggested for you</span>
              </div>
            </div>
          </div>
        `;

        const btn = document.createElement('button');
        btn.className = 'small-transparent-btn instagram-blue fw-semibold hover-darken js-suggested-follow';
        btn.textContent = 'Follow';
        btn.onclick = () => handleFollowToggle(user.userId, btn);

        row.appendChild(btn);
        listContainer.appendChild(row);
      });
    }
  } catch (err) {
    console.error('Error loading suggested users:', err);
  }
}

// Call it when the page loads
document.addEventListener('DOMContentLoaded', loadSidebarSuggestedUsers);

function showUserSearchError(msg) {
    const input = document.getElementById('allUsersSearchInput');
    let errorDiv = input.parentElement.querySelector('.user-search-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'user-search-error text-danger small mt-2 fw-bold w-100';
        input.parentElement.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i>${msg}`;
}

function clearUserSearchError() {
    const input = document.getElementById('allUsersSearchInput');
    if (input) {
        let errorDiv = input.parentElement.querySelector('.user-search-error');
        if (errorDiv) errorDiv.remove();
    }
}

function clearUserSearch() {
    document.getElementById('allUsersSearchInput').value = '';
    document.getElementById('filterIAmFollowing').value = 'all';
    document.getElementById('filterIsFollowingMe').value = 'all';
    
    clearUserSearchError();
    executeUserAdvancedSearch();
}

async function executeUserAdvancedSearch() {
  const listContainer = document.getElementById('allUsersList');
  listContainer.innerHTML = '<div class="text-center text-muted my-3">Loading users...</div>';

  const searchTerm = document.getElementById('allUsersSearchInput').value.trim();
  const iAmFollowing = document.getElementById('filterIAmFollowing').value;
  const isFollowingMe = document.getElementById('filterIsFollowingMe').value;

  clearUserSearchError();

  try {
    const res = await fetch('/api/user/advancedSearch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchTerm, iAmFollowing, isFollowingMe })
    });
    
    const data = await res.json();

    if (res.ok) {
      renderAllUsers(data.users);
    } else {
      listContainer.innerHTML = '';
      showUserSearchError(data.error || 'Failed to load users');
    }
  } catch (err) {
    console.error('Error executing user search:', err);
    listContainer.innerHTML = '';
    showUserSearchError('Connection error.');
  }
}