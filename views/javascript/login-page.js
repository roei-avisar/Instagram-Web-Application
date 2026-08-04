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

  window.location.href = './main-page.html';
}