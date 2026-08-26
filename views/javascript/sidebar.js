// Toggle the More dropdown menu
function toggleMoreMenu() {
  const dropdown = document.getElementById('more-dropdown');
  dropdown.classList.toggle('d-none');
}

// Close dropdown when mouse leaves the More button + dropdown area
document.getElementById('more-menu-container').addEventListener('mouseleave', () => {
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

