// Open the All Users modal and fetch users from the DB
async function openAllUsersPopup() {
  const modal = document.getElementById('allUsersModal');
  modal.classList.add('active');
  document.body.classList.add('overflow-hidden'); // make the scrolling behind the popup to unavailable 

  // add loading message to the empty modal while loading
  const listContainer = document.getElementById('allUsersList');
  listContainer.innerHTML = '<div class="text-center text-muted my-3">Loading users...</div>';

  const searchInput = document.getElementById('allUsersSearchInput');
  if (searchInput) searchInput.value = ''; // clear search input

  try {
    const res = await fetch('/api/user/allUsers'); // fetch all users from the DB
    const data = await res.json();

    if (res.ok) {
      // save all the users in a global variable so we can use it for the search
      window.allFetchedUsersList = data.users;
      renderAllUsers(data.users);
    } else {
      listContainer.innerHTML = `<div class="text-center text-danger my-3">${data.error || 'Failed to load users'}</div>`;
    }
  } catch (err) {
    console.error('Error fetching all users:', err);
    listContainer.innerHTML = '<div class="text-center text-danger my-3">Connection error.</div>';
  }
}

// Close the All Users modal
function closeAllUsersPopup() {
  document.getElementById('allUsersModal').classList.remove('active');
  document.body.classList.remove('overflow-hidden'); // make scrolling available again
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

// Handle search input filtering
const allUsersSearchInput = document.getElementById('allUsersSearchInput');
if (allUsersSearchInput) {
  allUsersSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (!window.allFetchedUsersList) return;

    const filteredUsers = window.allFetchedUsersList.filter(user =>
      user.username.toLowerCase().includes(searchTerm)
    );

    renderAllUsers(filteredUsers);
  });
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
