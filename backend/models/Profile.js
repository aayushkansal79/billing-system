import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
    websiteTitle: { type: String},
    websiteAddress: { type: String},
    CompanyName: { type: String},
    CompanyAddress: { type: String},
    CompanyState: { type: String},
    CompanyZip: { type: String},
    CompanyContact: { type: String},
    CompanyGST: { type: String},
    Extra: { type: String},
});

export default mongoose.model("Profile", ProfileSchema);