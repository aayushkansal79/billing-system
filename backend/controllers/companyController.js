import Company from "../models/Company.js";

// Get company details
export const getCompany = async (req, res) => {
    try {
        const company = await Company.findOne();
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        res.status(200).json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create company
export const createCompany = async (req, res) => {
    try {
        const { name, shortName, city, contactPhone, gstNumber, address } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Company name is required." });
        }
        
        if (!shortName || shortName.trim() === "") {
            return res.status(400).json({ error: "Company shortName is required." });
        }

        // Check for duplicates by name, shortName, contactPhone, or gstNumber
        const existingCompany = await Company.findOne({
            $or: [
                { name: name.trim() },
                { shortName: shortName.trim() },
                { contactPhone: contactPhone?.trim() },
                { gstNumber: gstNumber?.trim() }
            ]
        });

        if (existingCompany) {
            return res.status(400).json({
                error: "Company already exists",
                existingCompany,
            });
        }

        const company = new Company({
            name: name.trim(),
            shortName: shortName.trim(),
            city: city?.trim(),
            contactPhone: contactPhone?.trim(),
            gstNumber: gstNumber?.trim(),
            address: address?.trim(),
        });

        const savedCompany = await company.save();
        res.status(201).json(savedCompany);

    } catch (err) {
        console.error("Error creating company:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};



// Update company
export const updateCompany = async (req, res) => {
    try {
        const company = await Company.findOne();
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        Object.assign(company, req.body);
        await company.save();
        res.status(200).json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const searchCompanyByName = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ message: "Name query is required" });
        }
        const companies = await Company.find({
            name: { $regex: name, $options: "i" }
        }).limit(10);
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fetch all companies
export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 }); // latest first, optional
        res.json(companies);
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ message: "Server error while fetching companies." });
    }
};

export const updateACompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        company.name = req.body.name || company.name;
        company.address = req.body.address || company.address;
        company.city = req.body.city || company.city;
        company.contactPhone = req.body.contactPhone || company.contactPhone;
        company.gstNumber = req.body.gstNumber || company.gstNumber;

        await company.save();
        res.json({ message: "Company updated successfully", company });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};