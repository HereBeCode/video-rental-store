module.exports = function (req, res, next) {
    // 401 unauthorized - access protected resource without a valid token
    // 403 forbidden - access protected resource without admin privileges
    if (!req.user.isAdmin) return res.status(403).send('Access denied')
    next();
}