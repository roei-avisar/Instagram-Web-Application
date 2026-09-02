# About This Web Application

A full-stack social media / Instagram-like platform built with Node.js, Express.js, MongoDB (Mongoose ODM), vanilla HTML/CSS/JavaScript and Bootstrap 5. It implements user management and authentication, post sharing with image/video/text media, story sharing, interactive maps for location tagging, follower-based feeds, group communities, direct messaging with post sharing, a multi-parameter advanced search, and a D3.js analytics dashboard.
This project was developed as part of a Web Applications course.

**Authors:** Roei Avisar, Ron Hefetz, Guy Keller, Adi Moshcovitz

# Features

* **User Authentication & Sessions:** Register / login with email, phone or username, bcrypt-hashed passwords, and server-side sessions persisted in MongoDB (`connect-mongo`).
* **Password Reset by Code:** Request a 6-digit reset code (hashed in the DB, 15-minute expiry, printed to the server console as an email simulation) and set a new password with it.
* **Encrypted Usernames:** Usernames are stored AES-256-CBC encrypted at rest (random IV per record) and decrypted on read.
* **Posts with Media:** Create image, video or text posts with captions and an optional geo-tagged location; like, save, comment, reply-like on comments, and share counters.
* **Stories:** 72-hour ephemeral image/video stories, grouped by author, with automatic expiry and media cleanup.
* **Follow System:** Follow / unfollow users, view followers / following lists, and a personalized feed built from followed users' and your own posts plus your groups' posts.
* **Groups & Communities:** Create groups, join / leave, admin-only rename / delete / remove-member, group feeds, and post-to-group.
* **Direct Messaging:** One-to-one chats with text messages and shared posts, edit / delete your own messages, in-chat search, and a lightweight polling refresh (no WebSockets in the stack).
* **Advanced Search & Discovery:** Multi-parameter search for feed posts (text, media type, time window), users (name + follow-relationship filters) and groups (name, membership, creation time).
* **Interactive Maps:** Leaflet.js map picker for tagging a post's location (OpenStreetMap tiles + Nominatim geocoding) and a global "world map of posts" view.
* **Analytics Dashboard:** D3.js charts for community size, top creators, group engagement rate, media-type distribution and a daily-uploads timeline, fed by MongoDB aggregation pipelines.
* **Dark Mode:** Persistent light / dark theme toggle stored in `localStorage`.
* **Automated Social Updates:** New registrations and new groups trigger a tweet via the Twitter API v2.
* **Media Sync via Git:** Uploaded post / story / profile media is written to disk and pushed to the project's Git repository in a background task.
* **Weather Widget:** Live temperature for Rishon LeZion via the Open-Meteo API.
* **Security Middleware:** Global XSS character validation on request bodies/queries/params and a `requireLogin` guard protecting all app routes and static assets (IDOR mitigation).

# Technology Stack

* **Backend:** Node.js, Express.js 5
* **Database:** MongoDB with Mongoose ODM (session store via `connect-mongo`)
* **Frontend:** Vanilla HTML, CSS, JavaScript, Bootstrap 5.3, Bootstrap Icons
* **Maps & Visualizations:** Leaflet.js 1.9 (OpenStreetMap tiles, Nominatim geocoding), D3.js v7, HTML Canvas
* **External APIs / Integrations:** Twitter API v2 (`twitter-api-v2`) for automated posts, Open-Meteo weather API, automated Git pushes for media files (`child_process` + `git`)
* **Authentication & Security:** `bcrypt` (password & reset-code hashing), `express-session`, AES-256-CBC field encryption (Node `crypto`), custom `requireLogin` IDOR middleware, custom XSS validation middleware
* **File Processing:** Multer for profile-picture uploads (JPG only, 5MB limit), Base64 media handling for posts and stories

# Installation & Setup

### Prerequisites
* Node.js (v16 or higher)
* MongoDB database (local or cloud)
* Git installed and available on `PATH` (required by the background media-sync service)
* A Git access token with push rights to the media repository (optional — only needed for media persistence)
* Twitter API v2 credentials (optional — only needed for the automated tweets)

### 1. Clone the Repository
```bash
git clone https://gitlab.com/internet-web-applications/Internet-web-apps.git
cd Internet-web-apps
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment template:
```bash
cp .env.example .env
```
Edit `.env` file with your credentials:
```env
# Session
SESSION_SECRET=your_session_secret

# Database — either provide a full URI...
MONGO_URI=mongodb://localhost:27017/instagram
# ...or the individual parts (used only when MONGO_URI is not set)
DB_USER=your_db_user
DB_PASS=your_db_password
DB_HOST=localhost
DB_PORT=27017
DB_NAME=instagram

# Field-level encryption (usernames)
ENCRYPTION_KEY=your_encryption_key

# Background media sync to Git (optional)
GIT_ACCESS_TOKEN=your_gitlab_access_token

# Twitter API v2 automated posts (optional)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
```

### 4. Start the Application
```bash
node server.js
```
The application will be available at http://localhost:3301

# Project Structure
```text
Internet-web-apps/
├── server.js                     # App entry point: Express setup, session store, static serving, page routes
├── package.json                  # Dependencies and project metadata
│
├── config/
│   └── db.js                     # MongoDB connection + Mongo URI builder (MONGO_URI or DB_* parts)
│
├── routes/                       # Express routers, all API endpoints mounted under /api
│   ├── index.js                  # Central router; mounts each resource router and applies requireLogin
│   ├── usersRouter.js            # /api/user   — auth, profile, follow, search, password reset
│   ├── postsRouter.js            # /api/posts  — CRUD, feed, likes/saves/comments/shares, advanced search
│   ├── groupsRouter.js           # /api/groups — group CRUD, membership, group posts, advanced search
│   ├── chatsRouter.js            # /api/chats  — messages CRUD, search, chat summaries
│   ├── storiesRouter.js          # /api/stories — feed stories, create, delete
│   └── statisticsRouter.js       # /api/statistics — dashboard aggregation endpoints
│
├── controllers/                  # Business logic for each resource
│   ├── usersController.js        # Register/login/logout, profile updates, avatar upload, follow, search, reset
│   ├── postsController.js        # Post creation/deletion/update, feed building, likes/saves/comments, search
│   ├── groupsController.js       # Group creation, join/leave, admin actions, group post management
│   ├── chatsController.js        # Create/update/delete/search messages, per-user chat summaries
│   ├── storiesController.js      # Story feed grouping, creation, expiry cleanup, deletion
│   └── statisticsController.js   # MongoDB aggregation pipelines for the analytics dashboard
│
├── models/                       # Mongoose schemas
│   ├── usersModel.js             # User: encrypted username, hashed password/reset code, followers/following
│   ├── postsModel.js             # Post + Comment schemas (stats, location, media, likes/saves)
│   ├── groupsModel.js            # Group: name, admin, users, posts
│   ├── chatsModel.js             # Chat (exactly 2 users) with embedded message subdocuments
│   └── storiesModel.js           # Story: author, media, createdAt
│
├── middleware/
│   ├── userMiddleware.js         # requireLogin — session guard, redirects to login (IDOR protection)
│   └── xssValidator.js           # Blocks requests containing dangerous characters (< > " ' ` ; | \ etc.)
│
├── utils/
│   ├── encryption.js             # AES-256-CBC encrypt/decrypt helpers for sensitive fields
│   ├── gitService.js             # Background: save/delete media files and push commits to Git
│   ├── twitterServices.js        # sendTweet() wrapper around twitter-api-v2
│   └── userHelper.js             # GetUsernameByUserID — decrypt username(s) by id / id list
│
└── views/                        # All client-side assets (served as static files)
    ├── instagram_login.html      # Login / register / forgot-password page (public)
    ├── main-page.html            # Single-page app shell (protected by requireLogin)
    ├── css/                      # Feature-scoped stylesheets (feed, messages, dark mode, statistics, ...)
    ├── javascript/               # Frontend logic
    │   ├── initApp.js            # Loads session user into globals, weather widget (loads first)
    │   ├── userViewUtils.js      # Shared UI helpers for rendering the current user
    │   ├── login-page.js         # Login/register/reset form validation and requests
    │   ├── posts.js              # Feed fetching/rendering, post creation, per-post Leaflet map
    │   ├── post-buttons.js       # Like / save / comment / share button behaviour
    │   ├── events.js             # Create-post flow, media preview, location picker, global map
    │   ├── stories.js            # Stories bar and full-screen story viewer
    │   ├── messages.js           # Chat UI, polling refresh, in-chat search, shared posts
    │   ├── groups.js             # Groups popup: create, join/leave, admin actions, search
    │   ├── follow.js             # Follow/unfollow, followers/following lists, all-users modal
    │   ├── sidebar.js            # Left sidebar menu, more-menu dropdown, logout
    │   ├── userSettings.js       # Edit profile, change password, upload avatar, delete account
    │   ├── advanced-Search.js    # Advanced search panels for feed / users / groups
    │   └── statistics.js         # D3.js dashboard chart rendering
    └── elements/                 # Static media/icons/images (not documented here)
```

# Main Features & Functionality

### User Management
* **Registration** (`POST /api/user/register`): validates email and phone format (Israeli + international), username charset (`a-z0-9_.`, max 30) and uniqueness (checked against decrypted usernames), and password rules (min 6 chars, no spaces). Password is bcrypt-hashed and username AES-encrypted by pre-save hooks; the user is auto-logged-in and a tweet is fired.
* **Login** (`POST /api/user/login`): accepts email, phone or username as the identifier, verifies the password with `bcrypt.compare`, and stores `userId` + decrypted `username` in the session.
* **Profile updates** (`PATCH /api/user/update`): change username (with uniqueness re-check), bio (max 150), and password (requires current password).
* **Avatar upload** (`POST /api/user/uploadProfilePic`): Multer single-file upload, JPG-only, 5MB max, saved as `<userId>.jpg` and pushed to Git; the URL is stored on the user document.
* **Password reset** (`POST /api/user/requestPasswordReset`, `POST /api/user/resetPasswordWithCode`): 6-digit code, hashed, 15-minute expiry, verified before setting the new password.
* **Follow / unfollow** (`PATCH /api/user/follow`, `PATCH /api/user/unfollow`): keeps both users' `followers` / `following` arrays in sync; `check_followers` / `check_following` return the populated lists.
* **Account deletion** (`DELETE /api/user/delete`): deletes the user's personal posts, removes them from all groups (and deletes groups they admin), strips them from every follower/following array, deletes their stories and avatar (with Git cleanup), then destroys the session.

### Content & Posts
* **Post types:** `image`, `video`, `text`. Base64 media is decoded, written to `views/elements/media/posts/main-posts/` and pushed to Git in the background; the DB stores the relative path.
* **Location tagging:** each post carries a `location` sub-document (`name`, `lat`, `lng`) chosen from a Leaflet map with Nominatim reverse-geocoding / search.
* **Feed** (`GET /api/posts/getFeedPosts`): aggregates the current user's personal posts, followed users' personal posts and the user's groups' posts (calling the user and group routes internally), de-duplicates, sorts newest-first, and decrypts all author/liker/saver/commenter usernames before responding.
* **Interactions:** like/unlike (`POST /api/posts/like/:id`), save/unsave (`POST /api/posts/save/:id`), add comment (`POST /api/posts/addComment/:id`), like a comment (`POST /api/posts/likeComment/:id`), increment shares (`POST /api/posts/share/:id`), delete comment (`DELETE /api/posts/deleteComment/:postId/:commentId`).
* **Authorization:** editing / deleting a post requires being an author or the owning group's admin (`canManagePost`); deleting a comment requires being the comment author, post author or group admin.
* **Bulk delete** (`DELETE /api/posts/deleteMultiplePosts`): used when a group is deleted, removing posts, their comments and their media.

### Groups & Communities
* **Creation** (`POST /api/groups/createGroup`): creator becomes `admin` and first member; a tweet is fired.
* **Membership:** join (`PATCH /joinExistingGroup/:groupId`), leave (`PATCH /leaveExistingGroup/:groupId`), admin remove member (`PATCH /removeUserFromGroup/:groupId`), view members (`GET /viewGroupMembers/:groupId`).
* **Admin management:** rename (`PATCH /renameGroup/:groupId`, admin-only, max 60 chars) and delete (`DELETE /deleteSpecificGroup/:groupId`, admin-only — also deletes all group posts).
* **Group feeds:** `GET /api/groups/myGroups` lists the user's groups; `GET /api/groups/getMyGroupsPosts` returns the de-duplicated post IDs from all of them (used by the main feed).
* **Group posts:** `POST /addPost` and `DELETE /removePost/:groupId/:postId` keep the group's `posts` array in sync with post creation / deletion.
* **Cascade cleanup:** `DELETE /removeUserFromAllGroups/:userId` deletes groups the user admins (and their posts) and pulls the user out of every other group.

### Messaging & Interactions
* **Chats** are 2-user documents with embedded, timestamped messages of type `text` or `shared_post`.
* **Send** (`POST /api/chats/createMessage`): creates the chat on first message; text messages require `content`, shared posts require `postId`.
* **Edit** (`PATCH /api/chats/updateMessage`): text-only, sender-only.
* **Delete** (`POST /api/chats/deleteSpecificMessage`): sender-only.
* **Search** (`POST /api/chats/searchForAMessage`): case-insensitive substring match over the chat's text messages; the frontend highlights matches in the loaded history.
* **History** (`POST /api/chats/getAllMessages`): validates both ObjectIds, forbids self-chats, enforces that a user can only read their own chats, and populates `shared_post` references (with a raw-message fallback).
* **Summaries** (`GET /api/chats/getMyChatsSummary`): last-message preview, timestamp and "did they message me" flag per conversation; the frontend merges this with the follow lists.
* **Live updates:** the open conversation is refreshed by a 4-second poll (`CHAT_POLL_MS`) — there are no WebSockets in the stack.

### Advanced Search & Discovery
* **Feed search** (`POST /api/posts/advancedFeedSearch`): restricted to the user's allowed post set, then filtered by free text (caption regex OR author whose decrypted username matches), selected media types, and a time window (`24h`, `week`, `all`).
* **User search** (`POST /api/user/advancedSearch`): free-text username match plus "users I follow" and "users following me" filters (`yes` / `no` / `all`), excluding the current user.
* **Group search** (`POST /api/groups/advancedSearch`): group-name regex, "my groups only" toggle, and creation-time window.

# Technical Features

* **Responsive Design:** Mobile-friendly interface using Bootstrap 5 grid and utilities, with feature-scoped stylesheets.
* **Security:**
  * `xssValidator` middleware recursively scans `req.body`, `req.query` and `req.params` and rejects any string containing `< > " ' \` $ { } ; | \` (Base64 media fields are whitelisted). Applied to the users, posts, groups and chats routers.
  * `requireLogin` middleware guards every `/api` resource router, the `/main` page, and the `/images` static mount; unauthenticated requests are redirected to `/`. Direct `.html` requests are blocked to prevent bypassing the guard via static file serving (IDOR mitigation).
  * Ownership checks on posts, comments, messages, stories and group admin actions.
  * Passwords and reset codes hashed with `bcrypt`; usernames encrypted with AES-256-CBC using a key derived (SHA-256) from `ENCRYPTION_KEY`.
* **System Analytics:** `/api/statistics/*` endpoints run MongoDB aggregation pipelines (`$project`, `$group`, `$unwind`, `$match`, `$sort`, `$limit`, date operators) for members-per-group, top creators, group engagement ratio, media-type distribution and daily uploads; the frontend renders them with D3.js (and a Canvas timeline chart).
* **Background Services:**
  * `gitService` writes uploaded/deleted media to disk and runs `git add/rm → commit → push` (with an OAuth2 token URL and `GIT_TERMINAL_PROMPT=0`) in a detached `child_process`, so media is shared across environments without blocking the request.
  * `twitterServices.sendTweet()` posts to Twitter/X via `twitter-api-v2` on new registrations and new groups, with graceful handling when the API tier can't post.

# API Endpoints

All `/api` routes except `POST /api/user/register`, `POST /api/user/login`, `POST /api/user/requestPasswordReset` and `POST /api/user/resetPasswordWithCode` require an authenticated session.

### Authentication & Users (`/api/user`)
* `POST /register` — create an account (validates email/phone/username/password) and auto-login.
* `POST /login` — log in with email, phone or username + password.
* `GET /logout` — destroy the session and clear the cookie.
* `PATCH /update` — update username, bio and/or password.
* `POST /uploadProfilePic` — upload a JPG profile picture (Multer, 5MB).
* `GET /getUserDetails` — current user's id, username, bio and avatar.
* `POST /username` — resolve a `userId` or `userIds[]` to decrypted username(s).
* `POST /getBasicInfo` — username + avatar for a given `userId`.
* `GET /allUsers` — all other users with an `isFollowing` flag.
* `PATCH /follow` / `PATCH /unfollow` — follow / unfollow a `targetUserId`.
* `GET /check_followers` / `GET /check_following` — followers / following list (self or `?userId=`).
* `DELETE /delete` — permanently delete the current account and all related data.
* `POST /addPersonalPost` / `DELETE /removePersonalPost/:postId` — maintain the user's personal-posts list.
* `GET /getFollowingAndPersonalPosts` — de-duplicated post IDs from self + followed users.
* `POST /advancedSearch` — user search with text + follow-relationship filters.
* `POST /requestPasswordReset` / `POST /resetPasswordWithCode` — code-based password reset.

### Posts & Interactions (`/api/posts`)
* `GET /getAllPosts` — every post, fully populated and username-decrypted.
* `GET /getFeedPosts` — personalized feed (followed users + own + groups).
* `POST /createPost/` — create a post (media pushed to Git; added to group or personal posts).
* `PATCH /updatePost/:id` — update caption / location (author or group admin only).
* `DELETE /deletePost/:id` — delete a post, its media and its comments (author or group admin only).
* `DELETE /deleteMultiplePosts` — bulk delete by `postIds[]`.
* `POST /like/:id` — toggle like.
* `POST /save/:id` — toggle save.
* `POST /addComment/:id` — add a comment.
* `POST /likeComment/:id` — toggle a comment like.
* `DELETE /deleteComment/:postId/:commentId` — delete a comment (comment/post author or group admin).
* `POST /share/:id` — increment the share counter (optional `amount`).
* `POST /advancedFeedSearch` — feed search by text, media types and time window.

### Groups (`/api/groups`)
* `POST /createGroup` — create a group (creator becomes admin).
* `GET /getGroups` — all groups.
* `GET /myGroups` — groups the current user belongs to.
* `DELETE /deleteSpecificGroup/:groupId` — delete a group and its posts (admin only).
* `PATCH /joinExistingGroup/:groupId` / `PATCH /leaveExistingGroup/:groupId` — join / leave.
* `PATCH /removeUserFromGroup/:groupId` — admin removes a member.
* `PATCH /renameGroup/:groupId` — rename (admin only).
* `GET /viewGroupMembers/:groupId` — member id list.
* `POST /addPost` / `DELETE /removePost/:groupId/:postId` — sync a post in/out of a group.
* `GET /getMyGroupsPosts` — de-duplicated post IDs across the user's groups.
* `DELETE /removeUserFromAllGroups/:userId` — cascade cleanup on account deletion.
* `POST /advancedSearch` — group search by name, membership and creation time.

### Chats & Messaging (`/api/chats`)
* `POST /createMessage` — send a text message or shared post (creates the chat if needed).
* `PATCH /updateMessage` — edit your own text message.
* `POST /deleteSpecificMessage` — delete your own message.
* `POST /searchForAMessage` — search text messages within a chat.
* `POST /getAllMessages` — full message history for a conversation (own chats only).
* `GET /getMyChatsSummary` — last-message previews for all of the current user's chats.

### Stories (`/api/stories`)
* `GET /getFeedStories` — active (<72h) stories from followed users + self, grouped by author; expired stories are cleaned up.
* `POST /createStory` — create an image / video story (media pushed to Git).
* `DELETE /deleteStory/:id` — delete your own story.

### Statistics (`/api/statistics`)
* `GET /community-size` — top 5 groups by member count.
* `GET /top-creators` — top 5 users by post count (usernames decrypted).
* `GET /engagement-rate` — top 5 groups by posts-per-member ratio.
* `GET /media-distribution` — post counts per media type.
* `GET /posts-timeline` — post counts grouped by day.
