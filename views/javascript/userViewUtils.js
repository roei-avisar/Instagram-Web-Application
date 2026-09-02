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

    // 4. Update dynamically rendered posts and comments belonging to the current user
    if (CURRENT_USERNAME && CURRENT_USER_PIC) {
        const dynamicPics = document.querySelectorAll(`img[data-username="${CURRENT_USERNAME}"]`);
        for (const pic of dynamicPics) {
            pic.src = CURRENT_USER_PIC;
        }

        // 5. Update global data state so that any future popups (like comments) render with the new image
        if (typeof allPostsData !== 'undefined') {
            allPostsData.forEach(post => {
                if (post.authors) {
                    post.authors.forEach(author => {
                        if (author.username === CURRENT_USERNAME) author.profilePic = CURRENT_USER_PIC;
                    });
                }
                if (post.likedByUsers) {
                    post.likedByUsers.forEach(user => {
                        if (user.username === CURRENT_USERNAME) user.profilePic = CURRENT_USER_PIC;
                    });
                }
                if (post.comments) {
                    post.comments.forEach(comment => {
                        if (comment.userId && comment.userId.username === CURRENT_USERNAME) {
                            comment.userId.profilePic = CURRENT_USER_PIC;
                        }
                    });
                }
            });
        }

        // 6. Update global stories data state
        if (typeof feedGroups !== 'undefined') {
            feedGroups.forEach(group => {
                if (group.author && group.author.username === CURRENT_USERNAME) {
                    group.author.profilePic = CURRENT_USER_PIC;
                }
            });
        }
    }
}
