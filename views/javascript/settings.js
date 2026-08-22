// Open the settings modal and load current user data
async function openSettings() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('active');

  // Hide messages from previous opens
  document.getElementById('settings-error-box').style.display = 'none';
  document.getElementById('settings-success-box').style.display = 'none';
  document.getElementById('settings-pic-error').textContent = '';

  // Clear password fields
  document.getElementById('settings-current-password').value = '';
  document.getElementById('settings-new-password').value = '';

  // Clear the file input so the same file can be re-selected if needed
  document.getElementById('settings-profile-pic-input').value = '';

  // Fetch current user data from server
  try {
    const res = await fetch('/api/user/me');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('settings-username').value = data.username || '';
      document.getElementById('settings-bio').value = data.bio || '';
      updateBioCharCount(); // update the character counter

      // Load the current profile picture into the settings preview
      document.getElementById('settings-profile-pic-preview').src = data.profilePic || '/images/profiles/Default_pfp.jpg';
    }
  } catch (err) {
    console.error('Error fetching user data for settings:', err);
  }
}

// Close the settings modal
function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
}

// Close modal when clicking on the dark overlay (outside the box)
document.getElementById('settingsModal').addEventListener('click', function (e) {
  if (e.target === this) {
    closeSettings();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && document.getElementById('settingsModal').classList.contains('active')) {
    closeSettings();
  }
});

// Update bio character count
function updateBioCharCount() {
  const bio = document.getElementById('settings-bio').value;
  const counter = document.getElementById('settings-bio-count');
  counter.textContent = `${bio.length}/150`;
  if (bio.length > 150) {
    counter.classList.add('over-limit');
  } else {
    counter.classList.remove('over-limit');
  }
}

// Save settings
async function handleSaveSettings() {
  const username = document.getElementById('settings-username').value.trim();
  const bio = document.getElementById('settings-bio').value;
  const currentPassword = document.getElementById('settings-current-password').value.trim();
  const newPassword = document.getElementById('settings-new-password').value.trim();
  const errorBox = document.getElementById('settings-error-box');
  const errorText = document.getElementById('settings-error-text');
  const successBox = document.getElementById('settings-success-box');
  const successText = document.getElementById('settings-success-text');
  const saveBtn = document.getElementById('settings-save-btn');

  // Hide previous messages
  errorBox.style.display = 'none';
  successBox.style.display = 'none';

  // Client-side validation
  if (!username) {
    errorText.textContent = 'Username cannot be empty.';
    errorBox.style.display = 'flex';
    return;
  }

  if (username.length > 30) {
    errorText.textContent = 'Username cannot exceed 30 characters.';
    errorBox.style.display = 'flex';
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(username)) {
    errorText.textContent = 'Username can only contain letters, numbers, underscores, and dots.';
    errorBox.style.display = 'flex';
    return;
  }

  if (bio.length > 150) {
    errorText.textContent = 'Bio cannot exceed 150 characters.';
    errorBox.style.display = 'flex';
    return;
  }

  if (newPassword && !currentPassword) {
    errorText.textContent = 'Please enter your current password to change it.';
    errorBox.style.display = 'flex';
    return;
  }

  if (newPassword && newPassword.length < 6) {
    errorText.textContent = 'New password must be at least 6 characters.';
    errorBox.style.display = 'flex';
    return;
  }

  // Build request body (only send fields that have values)
  const body = {
    username: username,
    bio: bio
  };

  if (currentPassword !== "") {
    body.currentPassword = currentPassword;
  }

  if (newPassword !== "") {
    body.newPassword = newPassword;
  }

  // Disable button while sending
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const res = await fetch('/api/user/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      successText.textContent = data.message || 'Profile updated successfully!';
      successBox.style.display = 'flex';
      errorBox.style.display = 'none';

      // Update username displays across the page
      document.querySelectorAll('.current-user-name').forEach(el => {
        el.textContent = data.username;
      });

      // Update bio displays across the page
      document.querySelectorAll('.current-user-bio').forEach(el => {
        if (data.bio) {
          el.textContent = data.bio;
        } else {
          el.textContent = ''; // Clear if bio is empty
        }
      });

      // Clear password fields after successful save
      document.getElementById('settings-current-password').value = '';
      document.getElementById('settings-new-password').value = '';
    } else {
      errorText.textContent = data.error || 'Something went wrong.';
      errorBox.style.display = 'flex';
    }
  } catch (err) {
    errorText.textContent = 'Connection error. Please try again.';
    errorBox.style.display = 'flex';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save changes';
  }
}

// Handle profile picture upload
async function handleProfilePicUpload(input) {
  const errorSpan = document.getElementById('settings-pic-error');
  errorSpan.textContent = ''; // Clear previous error

  // Check if a file was selected
  if (!input.files || !input.files[0]) {
    return;
  }

  const file = input.files[0];

  // Check if the file is a JPG (client-side check — server also validates (cyber :))
  if (file.type !== 'image/jpeg') {
    errorSpan.textContent = 'Only JPG files are allowed.';
    input.value = ''; // Clear the file input
    return;
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errorSpan.textContent = 'Image is too large. Please upload a file smaller than 5MB.';
    input.value = ''; // Clear the file input
    return;
  }

  // Build a FormData object to send the file to the server
  const formData = new FormData();
  formData.append('profilePic', file);

  try {
    const res = await fetch('/api/user/uploadProfilePic', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      // Update the settings preview image
      document.getElementById('settings-profile-pic-preview').src = data.profilePic;

      // Update all profile pictures across the page
      const profileImages = document.querySelectorAll('.current-user-pic');
      for (const img of profileImages) {
        img.src = data.profilePic;
      }
    } else {
      errorSpan.textContent = data.error || 'Upload failed.';
    }
  } catch (err) {
    errorSpan.textContent = 'Connection error. Please try again.';
  }

  // Clear the file input so the same file can be re-selected
  input.value = '';
}
