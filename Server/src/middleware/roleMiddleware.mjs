const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        console.log("=================================");
        console.log("ROLE MIDDLEWARE");
        console.log("User:", req.user);
        console.log("User ID:", req.user?._id);
        console.log("User Role:", req.user?.role);
        console.log("Allowed Roles:", allowedRoles);
        console.log("Request:", req.method, req.originalUrl);
        console.log("=================================");

        if (!req.user) {
            return res.status(401).json({
                message: "Not authenticated"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You are not authorized to perform this action"
            });
        }

        next();
    };
};

export default authorizeRoles;