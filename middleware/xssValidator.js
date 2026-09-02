const dangerousCharsRegex = /[<>"'`${};|\\]/;

/**
 * Middleware to globally check for XSS characters in request bodies, queries, and params.
 * If any dangerous character is found, it blocks the request.
 */
const xssValidator = (req, res, next) => {
    // Helper function to recursively check objects for dangerous characters
    const hasXSS = (obj) => {
        if (!obj) return false;
        
        for (const key in obj) {
            // Skip fields that legitimately contain base64 data (which have semicolons)
            if (['mediaSource', 'audioSource', 'profilePic', 'coverPhoto'].includes(key)) {
                continue;
            }
            
            if (typeof obj[key] === 'string') {
                if (dangerousCharsRegex.test(obj[key])) {
                    return true;
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (hasXSS(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    };

    // Check all common input payloads
    if (hasXSS(req.body) || hasXSS(req.query) || hasXSS(req.params)) {
        return res.status(400).json({ 
            error: 'Input contains forbidden characters. Please remove special characters like < > " \' ; | \\ and try again.' 
        });
    }

    next();
};

module.exports = xssValidator;
