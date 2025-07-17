import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const storeSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        contactNumber: { type: String },
        type: { type: String, enum: ["admin", "store"], default: "store" },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

storeSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

storeSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Store = mongoose.model("Store", storeSchema);
export default Store;
