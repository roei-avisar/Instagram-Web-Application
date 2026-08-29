// Open the settings modal and load current user data
function openSettings() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('active');
  document.body.classList.add('overflow-hidden'); // make the scrolling behind the popup to unavailable 

  // Hide messages from previous opens
  document.getElementById('settings-error-box').style.display = 'none';
  document.getElementById('settings-success-box').style.display = 'none';
  document.getElementById('settings-pic-error').textContent = '';

  // Clear password fields
  document.getElementById('settings-current-password').value = '';
  document.getElementById('settings-new-password').value = '';

  // Clear the file input so the same file can be re-selected if needed
  document.getElementById('settings-profile-pic-input').value = '';

  // Populate form from global variables (loaded by initApp.js)
  document.getElementById('settings-username').value = CURRENT_USERNAME || '';
  document.getElementById('settings-bio').value = CURRENT_USER_BIO || '';
  updateBioCharCount(); // update the character counter

  // Load the current profile picture into the settings preview
  document.getElementById('settings-profile-pic-preview').src = CURRENT_USER_PIC || '/elements/media/profile-pictures/Default_pfp.jpg';
}

// Close the settings modal
function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');

  // Discard any unsaved profile picture selection
  pendingProfilePicFile = null;
  document.getElementById('settings-profile-pic-input').value = '';
  // Reset preview back to the current saved picture
  document.getElementById('settings-profile-pic-preview').src = CURRENT_USER_PIC || '/elements/media/profile-pictures/Default_pfp.jpg';
  document.body.classList.remove('overflow-hidden'); // make scrolling available again
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      successText.textContent = data.message || 'Profile updated successfully!';
      successBox.style.display = 'flex';
      errorBox.style.display = 'none';

      // Update global variables so they always hold the latest data
      CURRENT_USERNAME = data.username;
      CURRENT_USER_BIO = data.bio || '';
      if (data.profilePic) {
        CURRENT_USER_PIC = data.profilePic;
      }

      // Push updated data to all DOM elements across the page
      updateCurrentUserUI();

      // Upload pending profile picture if one was selected
      if (pendingProfilePicFile) {
        const formData = new FormData();
        formData.append('profilePic', pendingProfilePicFile);

        try {
          const picRes = await fetch('/api/user/uploadProfilePic', {
            method: 'POST',
            body: formData
          });

          const picData = await picRes.json();

          if (picRes.ok) {
            CURRENT_USER_PIC = picData.profilePic;
            updateCurrentUserUI();
            document.getElementById('settings-profile-pic-preview').src = picData.profilePic;
          } else {
            errorText.textContent = picData.error || 'Profile picture upload failed.';
            errorBox.style.display = 'flex';
          }
        } catch (picErr) {
          errorText.textContent = 'Profile picture upload failed. Please try again.';
          errorBox.style.display = 'flex';
        }

        pendingProfilePicFile = null;
        document.getElementById('settings-profile-pic-input').value = '';
      }

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

// Variable to hold a pending (not yet uploaded) profile picture file
let pendingProfilePicFile = null;

// Handle profile picture selection — only show a local preview, don't upload yet
function handleProfilePicUpload(input) {
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

  // Store the file for later upload (when user clicks Save)
  pendingProfilePicFile = file;

  // Show a local preview using FileReader (no server request yet)
  const reader = new FileReader();
  reader.onload = function (e) {
    // update the profile picture preview in html
    document.getElementById('settings-profile-pic-preview').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// DELETE ACCOUNT

function openDeleteAccountConfirm() {
  const deleteModal = document.getElementById('deleteAccountModal');
  if (deleteModal) {
    document.getElementById('delete-account-error').style.display = 'none';
    deleteModal.classList.add('active');
  }
}

function closeDeleteAccountConfirm() {
  const deleteModal = document.getElementById('deleteAccountModal');
  if (deleteModal) {
    deleteModal.classList.remove('active');
  }
}

// Close delete modal when clicking outside
document.getElementById('deleteAccountModal')?.addEventListener('click', function (e) {
  if (e.target === this) {
    closeDeleteAccountConfirm();
  }
});

// Close delete modal with Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && document.getElementById('deleteAccountModal')?.classList.contains('active')) {
    closeDeleteAccountConfirm();
  }
});

async function handleConfirmDeleteAccount() {
  const confirmBtn = document.getElementById('delete-account-confirm-btn');
  const errorBox = document.getElementById('delete-account-error');
  const errorText = document.getElementById('delete-account-error-text');

  errorBox.style.display = 'none';
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Deleting...';

  try {
    const res = await fetch('/api/user/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (res.ok) {
      // Account deleted — redirect to login page
      window.location.href = '/';
    } else {
      errorText.textContent = data.error || 'Failed to delete account.';
      errorBox.style.display = 'flex';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Yes, Delete My Account';
    }
  } catch (err) {
    errorText.textContent = 'Connection error. Please try again.';
    errorBox.style.display = 'flex';
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Yes, Delete My Account';
  }
}
