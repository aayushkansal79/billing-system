import jwt from "jsonwebtoken";
import Store from "../models/Store.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = (roles = []) => {
    if (typeof roles === "string") {
        roles = [roles];
    }

    return async (req, res, next) => {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            try {
                token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token, JWT_SECRET);

                if (!decoded.status) {
                    return res.status(403).json({ message: "Access denied: Your account is disabled." });
                }

                const store = await Store.findById(decoded.id).select("-password");
                if (!store) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Role-based access check if roles are provided
                if (roles.length > 0 && !roles.includes(store.type)) {
                    return res.status(403).json({ message: "Access denied: insufficient permissions" });
                }

                req.store = store;
                next();
            } catch (err) {
                console.error(err);
                return res.status(401).json({ message: "Not authorized, token failed" });
            }
        } else {
            return res.status(401).json({ message: "Not authorized, no token" });
        }
    };
};
