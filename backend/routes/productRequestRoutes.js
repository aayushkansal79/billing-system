import express from "express";
import { createProductRequest, getProductRequests, getProductRequestsSent, getProductRequestsRecieved, acceptProductRequest, rejectProductRequest, recieveProductRequest, cancelProductRequest } from "../controllers/productRequestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect("store"), createProductRequest);
router.get("/all", protect(), getProductRequests);
router.get("/sent", protect("store"), getProductRequestsSent);
router.get("/recieved", protect("store"), getProductRequestsRecieved);
router.post("/accept", protect("store"), acceptProductRequest);
router.post("/recieve", protect("store"), recieveProductRequest);
router.post("/cancel", protect("store"), cancelProductRequest);
router.post("/reject", protect("store"), rejectProductRequest);


export default router;
