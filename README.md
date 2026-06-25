# Instagram Web Application

A web-based Instagram clone demonstrating core social media functionalities, featuring a interactive user interface built with HTML, CSS, Bootstrap and JavaScript.
Since we currently use only HTML, CSS, Bootstrap and Javascript, all of our users are fake and any changes made (deleting posts, sending messages) are ephemeral and will not be saved.

# Features

### Dynamic Posts
We create all posts using the `allPostsData` list of items in javascript/posts.js file. Each item in the list represents one post with all it's attributes (media type, user, media source...).

Using this architecture we implemented the upload/delete/search/filter functionalities.
* **Create new post:** Users can create new posts of the types text/image/video, using the 'Create' button in the left-side menu. A note, creating empty text posts is blocked. Creation of a new post causes an animation to rise for a few seconds.
In the process of creating a post, if a user chooses to "quit" after already choosing a image/video source or a text post a "discard" screen will arise.
* **Delete posts:** Users can delete every existing post using the three points button next to the post.
* **Filter posts:** Users can filter posts by their type - text/image/video/all, using the 'Filter' button in the left-side menu.
* **Search posts:** Users can use the search bar to search posts by their caption/username/post-text. Using the 'Search' button in the left-side menu.

### Post buttons
We implemented the following post interaction buttons:
* **Like button:** Users can "like" posts, both from the regular posts page and from the post comments area.
* **Comment button:** Users can add new comments to posts. Clicking the comment icon opens the post's comments area, where users can view comments or add new ones. Users can also like existing comments and reply to them. All existing post buttons and delete also work from the post comments area. While typing a comment, a suitable message is written in the comments area.
* **Share button:** Users can share existing posts with other users. Causing the post to be sent to the message area with the corresponding user. Clicking the shared post will open it's comments area. It's possible to search by username in the share post menu.
* **Save button**: Saving the post causes the save button to fill-up.

Pressing every button with a counter will cause this counter to rise.

### Stories
Users can view existing stories by pressing the corresponding user profile picture in the stories bar at the top of the page.
After opening the stories, users can move between different stories using the white arrows, or wait for the story time to pass. It is possible to stop a story's time.
Users can also like different stories.

### Messages
We implemented the messaging feature where users can send each other text messages and share posts with each other.

### Dark Mode
Using the dark-mode button users can switch between two different themes for the web page. Using the 'Dark-Mode' button in the left-side menu.

### Login Page
* **Username/mail validation:** We used regex to validate that the user's email/phone number is valid.
* **Password:** We validate that the user's password is indeed 8 characters long.
* **Link to main-page:** After entering the user's mail/phone number and password the user is passed to the main-page.html in a relative way.

### Other features
* **Audio:** Pressing the audio button on posts (with audio) will cause the posts audio to work. This feature also works on newly added videos. This button works in the main feed, and also in the posts comments area.
* **Notifications:** Creating a new post causes a notification to show on screen and also adds a new notification about the post to the notifications menu. Users can open the notification menu using the 'Notifications' button in the left-side menu.
* **Return to the top:** There are two buttons that cause the user to "return" to the top of the main page: The instagram logo at the left, and a white arrow appearing when the user scrolls down.
* **Follow/Following:** Pressing the 'Follow' button at the right causes it to turn to 'Following', mimicing Instagram's behvaiour.