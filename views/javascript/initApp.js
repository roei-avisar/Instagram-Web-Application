let CURRENT_USER_ID = null;

fetch('/api/user/getUserID') // load userID unto gloable variable CURRENT_USER_ID and then make the main page shown
    .then(response => {
        if (!response.ok) throw new Error('Not logged in');
        return response.json();
    })
    .then(data => {
        CURRENT_USER_ID = data.userId;
        
        document.getElementById('loadingScreen').classList.remove('d-flex');
        document.getElementById('loadingScreen').classList.add('d-none');
        document.getElementById('mainApp').classList.remove('d-none');
    })
    .catch(error => {
        window.location.href = '/login.html';
    });