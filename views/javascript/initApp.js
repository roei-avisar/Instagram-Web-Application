let CURRENT_USER_ID = null;
let CURRENT_USERNAME = null;
let CURRENT_USER_BIO = null;
let CURRENT_USER_PIC = null;


fetch('/api/user/getUserDetails') // load user details into global variables and then make the main page visible
    .then(response => {
        if (!response.ok) throw new Error('Not logged in');
        return response.json();
    })
    .then(data => {
        CURRENT_USER_ID = data.userId;
        CURRENT_USERNAME = data.username;
        CURRENT_USER_BIO = data.bio || '';
        CURRENT_USER_PIC = data.profilePic || '/images/profiles/Default_pfp.jpg';

        // Push the loaded data into all DOM elements
        updateCurrentUserUI();

        document.getElementById('loadingScreen').classList.remove('d-flex');
        document.getElementById('loadingScreen').classList.add('d-none');
        document.getElementById('mainApp').classList.remove('d-none');
    })
    .catch(error => {
        window.location.href = '/login.html';
    });