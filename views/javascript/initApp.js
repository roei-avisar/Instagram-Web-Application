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
        CURRENT_USER_PIC = data.profilePic || '/elements/media/profile-pictures/Default_pfp.jpg';

        // Push the loaded data into all DOM elements
        updateCurrentUserUI();
    })
    .catch(error => {
        window.location.href = '/login.html';
    });

function loadWeatherWidget() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=31.973&longitude=34.7925&current_weather=true'; // url to get the weather at Rishon Lezion

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('API Error');
            return response.json();
        })
        .then(data => {
            document.getElementById('weatherTemp').innerText = data.current_weather.temperature; // getting weather paramater from JSON
        })
        .catch(error => {
            document.getElementById('weatherTemp').innerText = "-";
        });
}

loadWeatherWidget();
    