import Profile from "../models/Profile.js";

export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne();
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const existingProfile = await Profile.findOne();
    if (existingProfile) {
      const updated = await Profile.findByIdAndUpdate(existingProfile._id, req.body, { new: true });
      return res.status(200).json(updated);
    } else {
      const newProfile = new Profile(req.body);
      await newProfile.save();
      return res.status(201).json(newProfile);
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to save profile" });
  }
};