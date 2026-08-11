// Middleware to protect routes — checks if user is logged in via session
function requireLogin(req, res, next) {
  // in the routes (userRouter.js) we set the userId to the session when the user logs in
  if (req.session && req.session.userId) {
    return next();
  }
  // Redirect to login page (protects against IDOR - Insecure Direct Object Reference)
  // Cyber is fun :)
  return res.redirect('/');
}

module.exports = { requireLogin };
