      

const newPostNotification = document.querySelector('.js-new-post-notification');
const notificationsBtn = document.querySelector('.js-notifications-btn');
const notificationsPanel = document.querySelector('.js-notifications-panel');
const notificationsList = document.querySelector('.js-notifications-list');

let allNotificationsData = [
    {
        id: 1,
        username: "livnat_tell",
        text: "started following you.",
        time: "2m",
        messageMedia: null,
        messageMediaType: null
    },
    {
        id: 2,
        username: "gual.nefesh",
        text: "commented on your post",
        time: "5m",
        messageMedia: "אחרי הרבה עבודה קשה שמחים להגיש את המטלה בפיתוח אפליקציות אינטרנטיות. מקווים לקבל לא פחות מ100!",
        messageMediaType: "text"
    },
    {
        id: 3,
        username: "tina.terner111",
        text: "commented on your post",
        time: "5m",
        messageMedia: "אחרי הרבה עבודה קשה שמחים להגיש את המטלה בפיתוח אפליקציות אינטרנטיות. מקווים לקבל לא פחות מ100!",
        messageMediaType: "text"
    },
    {
        id: 4,
        username: "zehava.b",
        text: "commented on your post",
        time: "55m",
        messageMedia: "אחרי הרבה עבודה קשה שמחים להגיש את המטלה בפיתוח אפליקציות אינטרנטיות. מקווים לקבל לא פחות מ100!",
        messageMediaType: "text"
    },
    {
        id: 5,
        username: "hamsa.band",
        text: "commented on your post",
        time: "55m",
        messageMedia: "אחרי הרבה עבודה קשה שמחים להגיש את המטלה בפיתוח אפליקציות אינטרנטיות. מקווים לקבל לא פחות מ100!",
        messageMediaType: "text"
  
    },
     {
        id: 6,
        username: "abba.band",
        text: "commented on your post",
        time: "55m",
        messageMedia: "אחרי הרבה עבודה קשה שמחים להגיש את המטלה בפיתוח אפליקציות אינטרנטיות. מקווים לקבל לא פחות מ100!",
        messageMediaType: "text"
 
    },
    {
        id: 7,
        username: "besteam_ever",
        text: "You created a new post",
        time: "55m",
        messageMedia: "אחרי הרבה עבודה קשה שמחים להגיש את המטלה בפיתוח אפליקציות אינטרנטיות. מקווים לקבל לא פחות מ100!",
        messageMediaType: "text"
    }
];

let lastNotificationId = 7;

function uploadNewPostNotification(postMedia, postMediaType) {
    newPostNotification.classList.add('show');
    setTimeout(() => {
        newPostNotification.classList.remove('show');
    }, 5000);
    lastNotificationId = lastNotificationId + 1;
    const postNotification = {
        "id": lastNotificationId,
        "username": "besteam_ever",
        "text": "You created a new post",
        "time": "1s",
        "messageMedia": postMedia,
        "messageMediaType": postMediaType
    };
    allNotificationsData.unshift(postNotification);
    renderNotifications(allNotificationsData);
}

function renderNotifications(notificationsData) {
    notificationsList.innerHTML = '';
    
    notificationsData.forEach(notif => {
        let messageMediaHTML = ''
        if (notif.messageMedia) {
            if (notif.messageMediaType=="image"){
                messageMediaHTML =`<img src="${notif.messageMedia}" class="notif-message-media ms-3">` 
            }
            else if(notif.messageMediaType=="video"){
                messageMediaHTML = `<video src="${notif.messageMedia}" class="notif-message-media ms-3" loop autoplay muted playsinline></video>`;
            }
            else {
                messageMediaHTML = `
                <div class="notif-message-media ms-3 text-post-container d-flex justify-content-center align-items-center rounded-2" style="min-height: unset; overflow: hidden; padding: 4px;">
                    <span class="text-center fw-bold text-dark" style="font-size: 8px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;">
                        ${notif.messageMedia}
                    </span>
                </div>`
            }
        }
        

        const notifHTML = `
            <div class="notification-item">
                <img src="./elements/media/profile-pictures/${notif.username}.jpg" class="notif-profile-pic rounded-circle me-3">
                <div class="notif-content flex-grow-1">
                    <span class="fw-bold text-dark">${notif.username}</span>
                    <span class="text-dark">${notif.text}</span>
                    <span class="text-muted ms-1">${notif.time}</span>
                </div>
                ${messageMediaHTML}
            </div>
        `;
        notificationsList.innerHTML += notifHTML;
    });
}

notificationsBtn.addEventListener('click', () => {
    notificationsPanel.classList.toggle('d-none');
    renderNotifications(allNotificationsData);
});