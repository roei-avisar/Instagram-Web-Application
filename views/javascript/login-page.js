function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorBox = document.getElementById('error-box');
  const errorText = errorBox.querySelector('span');

  errorBox.style.display = 'none';

  if (!username) {
    errorText.innerHTML =
      'Please enter your mobile number or email. <a href="#">Find your account and log in.</a>';
    errorBox.style.display = 'flex';
    return;
  }

  const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const isPhone = phoneRegex.test(username);
  const isEmail = emailRegex.test(username);

  if (!isPhone && !isEmail) {
    if (/[\u0590-\u05FF]/.test(username)) {
      errorText.innerHTML =
        'Please enter a valid email address or mobile number. <a href="#">Find your account and log in.</a>';
    } else if (username.includes('@')) {
      errorText.innerHTML =
        'Please enter a valid email address. <a href="#">Find your account and log in.</a>';
    } else if (/^\d+$/.test(username)) {
      errorText.innerHTML =
        'Please enter a valid mobile number.';
    } else {
      errorText.innerHTML =
        'Please enter a valid email address or mobile number. <a href="#">Find your account and log in.</a>';
    }

    errorBox.style.display = 'flex';
    return;
  }

  if (!password) {
    errorText.innerHTML =
      'Please enter your password. <a href="#">Find your account and log in.</a>';
    errorBox.style.display = 'flex';
    return;
  }

  if (password.length < 6) {
    errorText.innerHTML =
      'The password must be at least 6 characters. <a href="#">Find your account and log in.</a>';
    errorBox.style.display = 'flex';
    return;
  }

  // Send Login Request To Server
  const loginBtn = document.querySelector('.btn-login');
  loginBtn.disabled = true; // disable login button so user won't click it twice
  loginBtn.textContent = 'Logging in...'; // change login button text to loading

  fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: username, password: password })
  })
    .then(response => response.json().then(data => ({ status: response.status, data })))
    .then(({ status, data }) => {
      if (status === 200) {
        // Login successful — redirect to main page
        window.location.href = '/main';
      } else {
        // Show server error message
        errorText.innerHTML = data.error + ' <a href="#">Find your account and log in.</a>'; //will add forgot password later
        errorBox.style.display = 'flex';
      }
    })
    .catch(() => {
      errorText.innerHTML = 'Connection error. Please try again. <a href="#">Find your account and log in.</a>'; //will add forgot password later
      errorBox.style.display = 'flex';
    })
    .finally(() => {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log in';
    });
}

// ========== SIGNUP MODAL ==========

function openSignupModal() {
  document.getElementById('signupModal').classList.add('active');
  // Reset form when opening
  document.getElementById('signup-email').value = '';
  document.getElementById('signup-phone').value = '';
  document.getElementById('signup-username').value = '';
  document.getElementById('signup-password').value = '';
  document.getElementById('signup-error-box').style.display = 'none';
  document.getElementById('signup-success-box').style.display = 'none';
}

function closeSignupModal() {
  document.getElementById('signupModal').classList.remove('active');
}

// Close modal when clicking on the dark overlay (outside the box)
document.getElementById('signupModal').addEventListener('click', function (e) {
  if (e.target === this) {
    closeSignupModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeSignupModal();
  }
});

function handleSignup() {
  const email = document.getElementById('signup-email').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value.trim(); // need to check if i want to keep the trim() for password or not
  const errorBox = document.getElementById('signup-error-box'); // saves the error box to use it later
  const errorText = document.getElementById('signup-error-text'); // save the error text to use it later
  const successBox = document.getElementById('signup-success-box'); // save the success box to use it later
  const successText = document.getElementById('signup-success-text'); // save the success text to use it later
  const signupBtn = document.getElementById('signupBtn');

  // Hide previous messages
  errorBox.style.display = 'none';
  successBox.style.display = 'none';

  // Validation
  if (!email && !phone) {
    errorText.textContent = 'Please provide at least an email or phone number.';
    errorBox.style.display = 'flex';
    return;
  }

  if (email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      errorText.textContent = 'Please enter a valid email address.';
      errorBox.style.display = 'flex';
      return;
    }
  }

  if (phone) {
    if (!/^\d{10,15}$/.test(phone)) {
      errorText.textContent = 'Phone number must contain between 10 and 15 digits.';
      errorBox.style.display = 'flex';
      return;
    }
  }

  if (!username) {
    errorText.textContent = 'Username is required.';
    errorBox.style.display = 'flex';
    return;
  }

  if (username.length > 30) {
    errorText.textContent = 'Username cannot exceed 30 characters.';
    errorBox.style.display = 'flex';
    return;
  }

  if (!password || password.length < 6) {
    errorText.textContent = 'Password must be at least 6 characters.';
    errorBox.style.display = 'flex';
    return;
  }

  // Disable button while sending
  signupBtn.disabled = true;
  signupBtn.textContent = 'Signing up...';

  fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, username, password })
  })
    .then(response => response.json().then(data => ({ status: response.status, data })))
    .then(({ status, data }) => {
      if (status === 201) {
        // Registration successful — show success then redirect
        successText.textContent = `Welcome, ${data.username}! Redirecting...`;
        successBox.style.display = 'flex';
        errorBox.style.display = 'none';
        setTimeout(() => {
          window.location.href = '/main';
        }, 1500);
      } else {
        // Show server error
        errorText.textContent = data.error;
        errorBox.style.display = 'flex';
      }
    })
    .catch(() => {
      errorText.textContent = 'Connection error. Please try again.';
      errorBox.style.display = 'flex';
    })
    .finally(() => {
      signupBtn.disabled = false;
      signupBtn.textContent = 'Sign up';
    });
}