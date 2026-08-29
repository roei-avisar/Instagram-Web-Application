// Utility functions for managing current user display across the page

// Updates all DOM elements that display the current user's info.
// Call this after any change to the global user variables.
function updateCurrentUserUI() {
    // 1. Update all Username text
    const allUsernameElements = document.querySelectorAll('.current-user-name');
    
    for (const nameElement of allUsernameElements) {
        if (CURRENT_USERNAME) {
            nameElement.textContent = CURRENT_USERNAME;
        } else {
            nameElement.textContent = 'Unkown User'; // If there is no username
        }
    }

    // 2. Update all Bio text
    const allBioElements = document.querySelectorAll('.current-user-bio');
    
    for (const bioElement of allBioElements) {
        if (CURRENT_USER_BIO) {
            bioElement.textContent = CURRENT_USER_BIO;
        } else {
            bioElement.textContent = ''; // Leave blank if there is no bio
        }
    }

    // 3. Update all Profile Pictures
    const allPictureElements = document.querySelectorAll('.current-user-pic');
    
    for (const pictureElement of allPictureElements) {
        if (CURRENT_USER_PIC) {
            pictureElement.src = CURRENT_USER_PIC;
        }
    }
}
