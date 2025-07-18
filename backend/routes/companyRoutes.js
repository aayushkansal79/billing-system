import express from "express";
import { getCompany, createCompany, updateCompany, searchCompanyByName, getAllCompanies, updateACompany } from "../controllers/companyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect("admin"), getCompany);
router.post("/", protect("admin"), createCompany);
router.put("/", protect("admin"), updateCompany);
router.get("/search", protect("admin"), searchCompanyByName);
router.get("/all", protect("admin"), getAllCompanies);
router.patch("/:id", protect("admin"), updateACompany);

export default router;
