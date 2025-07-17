import express from "express";
const router = express.Router();
import { registerStore, login, getAllStores, getLoggedInUser, updateStore, changeStorePassword } from "../controllers/storeController.js";
import { protect } from "../middleware/authMiddleware.js";

router.post("/register", protect("admin"), registerStore);
router.post("/login", login);
router.get("/", protect("admin"), getAllStores);
router.get("/profile", protect(), getLoggedInUser);
router.put("/change-password", protect(), changeStorePassword);
router.put("/:id", protect("admin"), updateStore);

export default router;
