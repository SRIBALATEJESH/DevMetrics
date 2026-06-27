// Role-Based Access Control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required for authorization check'
      });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const normalizedRoles = roles.map(role => role.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'fail',
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = { authorize };
