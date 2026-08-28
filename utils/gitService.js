const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class GitService {

    // Background method to save media and push to Git using a full relative path
    saveMediaAndPushToGit(base64Data, relativePath) {
        try {
            // Combine the current directory with the provided relative path
            const targetPath = path.join(__dirname, relativePath);

            // Remove the Base64 prefix before saving to file
            const base64Image = base64Data.split(';base64,').pop();

            fs.writeFile(targetPath, base64Image, { encoding: 'base64' }, (err) => {
                if (err) {
                    console.error("Error saving media file:", err);
                    return;
                }

                // Get the token from .env
                const token = process.env.GIT_ACCESS_TOKEN;
                const repoURL = "gitlab.com/internet-web-applications/Internet-web-apps.git";

                // Create the authenticated URL
                const remoteUrlWithToken = `https://oauth2:${token}@${repoURL}`;

                // Extract just the filename for the commit message
                const filename = path.basename(relativePath);

                // Pass targetPath explicitly to the commit command to isolate the commit
                const gitCommand = `git add "${targetPath}" && git -c user.name="Media Uploader" -c user.email="media@uploader.com" commit "${targetPath}" -m "Add new post media: ${filename}" && git push ${remoteUrlWithToken} HEAD`;

                // Run the command with GIT_TERMINAL_PROMPT=0 to ensure it never hangs waiting for a password prompt
                exec(gitCommand, { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (execErr, stdout, stderr) => {
                    if (execErr) {
                        console.error("Git push failed:", execErr);
                        return;
                    }
                    console.log("Successfully pushed to git:", stdout);
                });
            });
        } catch (error) {
            console.error("Background task error:", error);
        }
    }

    // Background method to delete media and push deletion to Git
    deleteMediaAndPushToGit(mediaRelativePath) {
        try {
            // mediaRelativePath is the full relative path from the controller
            const targetPath = path.join(__dirname, mediaRelativePath);

            // Check if file exists on disk before trying to delete
            if (fs.existsSync(targetPath)) {
                fs.unlink(targetPath, (err) => {
                    if (err) {
                        console.error("Error deleting media file locally:", err);
                        return;
                    }

                    const token = process.env.GIT_ACCESS_TOKEN;
                    const repoURL = "gitlab.com/internet-web-applications/Internet-web-apps.git";
                    const remoteUrlWithToken = `https://oauth2:${token}@${repoURL}`;

                    // Pass targetPath explicitly to the commit command to isolate the commit
                    const gitCommand = `git rm "${targetPath}" && git -c user.name="Media Deleter" -c user.email="media@deleter.com" commit "${targetPath}" -m "Delete post media: ${mediaRelativePath}" && git push ${remoteUrlWithToken} HEAD`;

                    exec(gitCommand, { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (execErr, stdout, stderr) => {
                        if (execErr) {
                            console.error("Git push failed during deletion:", execErr);
                            return;
                        }
                        console.log("Successfully pushed deletion to git:", stdout);
                    });
                });
            } else {
                console.log("Media file not found on disk, skipping Git deletion.");
            }
        } catch (error) {
            console.error("Background delete task error:", error);
        }
    }
}

// Export a single instance of the class
module.exports = new GitService();