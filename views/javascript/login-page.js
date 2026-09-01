if (localStorage.getItem('theme') === 'dark' || localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
    }

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

  const phoneRegex = /^(?:\+?972[- ]?(?:5[0-9]|[23489]|7[1-9])|0(?:5[0-9]|[23489]|7[1-9]))[- ]?\d{3}[- ]?\d{4}$|^\+?[1-9]\d{9,14}$/;
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
document.getElementById('signupModal').addEventListener('mousedown', function (e) {
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
  if (!email) {
    errorText.textContent = 'Email address is required.';
    errorBox.style.display = 'flex';
    return;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    errorText.textContent = 'Please enter a valid email address.';
    errorBox.style.display = 'flex';
    return;
  }

  if (!phone) {
    errorText.textContent = 'Phone number is required.';
    errorBox.style.display = 'flex';
    return;
  }

  const phoneRegex = /^(?:\+?972[- ]?(?:5[0-9]|[23489]|7[1-9])|0(?:5[0-9]|[23489]|7[1-9]))[- ]?\d{3}[- ]?\d{4}$|^\+?[1-9]\d{9,14}$/;
  if (!phoneRegex.test(phone)) {
    errorText.textContent = 'Please enter a valid phone number like(050-1234567 or +972-50-1234567).';
    errorBox.style.display = 'flex';
    return;
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
// Close modal when clicking on the dark overlay (outside the box)
document.getElementById('forgotModal').addEventListener('mousedown', function (e) {
  if (e.target === this) {
    closeForgotModal();
  }
});
// Open forgot password modal
function openForgotModal() {
  document.getElementById('forgotModal').classList.add('active');
  
  document.getElementById('forgot-step-1').style.display = 'block';
  document.getElementById('forgot-step-2').style.display = 'none';
  document.getElementById('forgot-msg-box').style.display = 'none';
  document.getElementById('forgot-success-box').style.display = 'none';
  
  const identifierInput = document.getElementById('forgot-identifier');
  identifierInput.value = '';
  identifierInput.disabled = false; // Re-enable in case they closed and reopened
  
  document.getElementById('forgot-code').value = '';
  document.getElementById('forgot-new-password').value = '';
}

// Close forgot password modal
function closeForgotModal() {
  document.getElementById('forgotModal').classList.remove('active');
}

// Step 1: Request Reset Code
async function requestResetCode() {
  const identifier = document.getElementById('forgot-identifier').value.trim();
  const msgBox = document.getElementById('forgot-msg-box');
  const msgText = document.getElementById('forgot-msg-text');
  const successBox = document.getElementById('forgot-success-box');
  const successText = document.getElementById('forgot-success-text');

  msgBox.style.display = 'none'; // Hide previous errors
  successBox.style.display = 'none';

  if (!identifier) {
    msgText.textContent = 'Please enter your email or phone.';
    msgBox.style.display = 'flex';
    return;
  }

  try {
    const res = await fetch('/api/user/requestPasswordReset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById('forgot-step-1').style.display = 'none';
      document.getElementById('forgot-step-2').style.display = 'block';
      document.getElementById('forgot-identifier').disabled = true;
      
      successText.textContent = 'Verification code simulated! Check your terminal.';
      successBox.style.display = 'flex';
    } else {
      msgText.textContent = data.error || 'Failed to send code.';
      msgBox.style.display = 'flex';
    }
  } catch (err) {
    msgText.textContent = 'Connection error. Please try again.';
    msgBox.style.display = 'flex';
  }
}

// Step 2: Submit Code and New Password
async function submitNewPassword() {
const identifier = document.getElementById('forgot-identifier').value.trim();
  const code = document.getElementById('forgot-code').value.trim();
  const newPassword = document.getElementById('forgot-new-password').value.trim();
  const msgBox = document.getElementById('forgot-msg-box');
  const msgText = document.getElementById('forgot-msg-text');
  const successBox = document.getElementById('forgot-success-box');
  const successText = document.getElementById('forgot-success-text');

  msgBox.style.display = 'none'; // Hide previous errors
  successBox.style.display = 'none';

  if (!code || !newPassword) {
    msgText.textContent = 'Please fill in all fields.';
    msgBox.style.display = 'flex';
    return;
  }

  try {
    const res = await fetch('/api/user/resetPasswordWithCode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code, newPassword })
    });
    const data = await res.json();

    if (res.ok) {
      // Hide inputs and show success message
      document.getElementById('forgot-step-2').style.display = 'none';
      successText.textContent = 'Password reset successfully! You can now log in.';
      successBox.style.display = 'flex';
      
      // Automatically close modal after 2.5 seconds
      setTimeout(() => {
        closeForgotModal();
      }, 2500);
    } else {
      msgText.textContent = data.error || 'Failed to reset password.';
      msgBox.style.display = 'flex';
    }
  } catch (err) {
    msgText.textContent = 'Connection error. Please try again.';
    msgBox.style.display = 'flex';
  }
}