// Toggle the More dropdown menu
function toggleMoreMenu() {
  const dropdown = document.getElementById('more-dropdown');
  dropdown.classList.toggle('d-none');
}

// Close dropdown when mouse leaves it
document.getElementById('more-dropdown').addEventListener('mouseleave', () => {
  document.getElementById('more-dropdown').classList.add('d-none');
});


// Logout - calls the server to destroy the session and redirects to login page
async function handleLogout() {
  try {
    const res = await fetch('/api/user/logout');
    const data = await res.json();
    if (res.ok) {
      window.location.href = '/'; // redirect to login page
    } else {
      alert(data.error || 'Logout failed.');
    }
  } catch (err) {
    console.error('Logout error:', err);
    alert('Could not log out. Please try again.');
  }
}

// Fetch current user on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/user/me');
    if (res.ok) {
      const data = await res.json();
      const username = data.username;

      // Update username displays (for every instance)
      document.querySelectorAll('.current-user-name').forEach(el => {
        el.textContent = username;
      });

      // Update bio displays (for every instance)
      document.querySelectorAll('.current-user-bio').forEach(el => {
        if (data.bio) {
          el.textContent = data.bio;
        } else {
          el.textContent = ''; // Clear the static placeholder if bio is empty
        }
      });

      // Update profile picture displays (for every instance)
      if (data.profilePic) {
        document.querySelectorAll('.current-user-pic').forEach(img => {
          img.src = data.profilePic;
        });
      }
    }
  } catch (err) {
    console.error('Error fetching current user:', err);
  }
});
