import Store from "../models/Store.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (storeId, type, status) => {
    return jwt.sign(
        { id: storeId, type, status },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
};

export const registerStore = async (req, res) => {
    const { username, password, address, city, state, zipCode, contactNumber, type } = req.body;

    try {
        if (!username || !password || !address || !city || !state || !zipCode || !contactNumber) {
            return res.status(400).send({ message: "All required fields must be filled." });
        }

        if (contactNumber.length !== 10) {
            return res.status(400).json({ message: "Invalid contact number" });
        }

        const storeExists = await Store.findOne({ username });
        if (storeExists) {
            return res.status(400).json({ message: "Store already exists" });
        }

        const store = await Store.create({
            username,
            password,
            address,
            city,
            state,
            zipCode,
            contactNumber,
            type: type || "store",
        });

        res.status(201).json({
            _id: store._id,
            username: store.username,
            type: store.type,
            status: store.status,
            token: generateToken(store._id, store.type, store.status),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const store = await Store.findOne({ username });

        if (!store.status) {
            return res.status(403).send({ message: "Your account is disabled. Please contact admin." });
        }

        if (store && (await store.comparePassword(password))) {
            res.json({
                _id: store._id,
                username: store.username,
                type: store.type,
                status: store.status,
                token: generateToken(store._id, store.type, store.status),
            });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Fetch all stores
export const getAllStores = async (req, res) => {
  try {
    // Optional: allow only admin to fetch all stores
    // if (req.user.type !== "admin") {
    //   return res.status(403).json({ message: "Not authorized to view stores" });
    // }

    const stores = await Store.find({type : "store"}).select("-password"); // hide passwords
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching stores" });
  }
};

export const getLoggedInUser = async (req, res) => {
    try {
        // req.store is already populated by the protect middleware with password excluded
        res.json(req.store);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user details" });
    }
};

// Update store details: status, address, contact, etc.
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedStore = await Store.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedStore) {
      return res.status(404).json({ message: "Store not found." });
    }

    res.json(updatedStore);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update store." });
  }
};

// Change password
export const changeStorePassword = async (req, res) => {
    try {
        const storeId = req.store.id; // Populated by JWT middleware
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new passwords are required." });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters long." });
        }

        const store = await Store.findById(storeId).select("+password");
        if (!store) {
            return res.status(404).json({ message: "Store not found." });
        }

        const isMatch = await bcrypt.compare(currentPassword, store.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        store.password = newPassword; // allow pre("save") to hash it
        await store.save();

        res.json({ message: "Password changed successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while changing password." });
    }
};

export const adminChangeStorePassword = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long." });
    }

    const store = await Store.findById(storeId).select("+password");
    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }

    store.password = newPassword; // gets hashed via pre("save")
    await store.save();

    res.json({ message: "Store password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error changing store password." });
  }
};

// Admin-only: Log in as a store (without password)
export const loginAsStoreByAdmin = async (req, res) => {
  try {
    const { storeId } = req.params;

    if (req.store.type !== "admin") {
      return res.status(403).json({ message: "Only admin can use this feature." });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }

    if (!store.status) {
      return res.status(403).json({ message: "This store is disabled." });
    }

    const token = generateToken(store._id, store.type, store.status);

    res.json({
      _id: store._id,
      username: store.username,
      type: store.type,
      status: store.status,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error logging in as store." });
  }
};
