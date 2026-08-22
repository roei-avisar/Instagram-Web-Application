const User = require('../models/usersModel');

/**
 * GetUsernameByUserID - Returns the username for a given user ID or a list of user IDs.
 * 
 * Usage (single ID):
 *   const { GetUsernameByUserID } = require('../utils/userHelper');
 *   const username = await GetUsernameByUserID('6789abc123def456');
 *   // Returns: "john_doe" or null
 * 
 * Usage (multiple IDs):
 *   const { GetUsernameByUserID } = require('../utils/userHelper');
 *   const users = await GetUsernameByUserID(['id1', 'id2', 'id3']);
 *   // Returns: [{ userId: 'id1', username: 'Guy' }, { userId: 'id2', username: 'Leah' }, ...]
 * 
 * @param {string|string[]} userId - A single MongoDB _id or an array of MongoDB _ids.
 * @returns {Promise<string|null|Array<{userId: string, username: string|null}>>}
 *   - If a single ID is given: the decrypted username, or null if user not found.
 *   - If an array of IDs is given: an array of objects with userId and username (null if not found).
 * 
 * i have to say that i like this kind of documentattion and we need to use it more
 */
async function GetUsernameByUserID(userId) {
  try {
    // If an array of IDs is given, look up each one and return an array of results
    if (Array.isArray(userId)) {
      const results = [];

      // Go through each ID one by one
      for (let i = 0; i < userId.length; i++) {
        const id = userId[i];
        const user = await User.findById(id);

        if (user) {
          results.push({ userId: id, username: user.decryptUsername() });
        } else {
          results.push({ userId: id, username: null });
        }
      }

      return results;
    }

    // Single ID - return just the username string
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }
    return user.decryptUsername();
  } catch (err) {
    console.error('GetUsernameByUserID error:', err);
    return Array.isArray(userId) ? [] : null;
  }
}

module.exports = { GetUsernameByUserID };
