import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";
import { toast } from "react-toastify";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Loader from "../../components/Loader/Loader";

const Profile = ({ url }) => {
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [favicon, setFavicon] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    websiteTitle: "",
    websiteAddress: "",
    CompanyName: "",
    CompanyAddress: "",
    CompanyState: "",
    CompanyZip: "",
    CompanyContact: "",
    CompanyGST: "",
    tagTitle: "",
    Thankyou: "",
    RefundNote: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${url}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) setForm(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if(form.tagTitle.length > 20){
        toast.error("Tag Title length is more than 20!")
        return
      }
      await axios.post(`${url}/api/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Profile Updated!");
    } catch (err) {
      toast.error("Failed to save profile");
    } finally{
      setLoading(false);
    }
  };

  const handleChangeImg = (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert("Please select a valid image file.");
    }
  };

  const handleRemove = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: form.RefundNote || "",
    onUpdate: ({ editor }) => {
      setForm((prev) => ({ ...prev, RefundNote: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (editor && form.RefundNote) {
      editor.commands.setContent(form.RefundNote);
    }
  }, [form.RefundNote, editor]);

  return (
    <>
      <p className="bread">Profile</p>
      <div className="profile row g-3">
        {/* <div className="mt-4 col-md-6">
          <label className="mb-3">Website Header Logo *</label>

          <div className="mb-3">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleChangeImg}
            />
          </div>

          {previewUrl && (
            <div className="card w-100">
              <img
                src={previewUrl}
                alt="Preview"
                className="card-img-top"
                style={{ objectFit: "contain", maxHeight: "200px" }}
              />
              <div className="card-body text-center">
            <button className="btn btn-danger me-2" onClick={handleRemove}>
            Remove
            </button>
            <button className="btn btn-success" onClick={() => alert("Upload logic here!")}>
            Upload
            </button>
          </div>
            </div>
          )}
        </div>

        <div className="mt-4 col-md-6">
          <label className="mb-3">Website Favicon *</label>

          <div className="mb-3">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleChangeImg}
            />
          </div>

          {previewUrl && (
            <div className="card w-100">
              <img
                src={previewUrl}
                alt="Preview"
                className="card-img-top"
                style={{ objectFit: "contain", maxHeight: "200px" }}
              />
              <div className="card-body text-center">
            <button className="btn btn-danger me-2" onClick={handleRemove}>
              Remove
              </button>
            <button className="btn btn-success" onClick={() => alert("Upload logic here!")}>
            Upload
            </button>
          </div>
            </div>
          )}
        </div> */}

        {/* <div className="col-md-3">
          <label className="form-label">Website Title*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Website Title"
            name="websiteTitle"
            value={form.websiteTitle}
            onChange={handleChange}
            required
          />
        </div> */}

        <div className="col-md-3">
          <label className="form-label">Website Address*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Website Address"
            name="websiteAddress"
            value={form.websiteAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company Name*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company Name"
            name="CompanyName"
            value={form.CompanyName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company Address*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company Address"
            name="CompanyAddress"
            value={form.CompanyAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company State*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company State"
            name="CompanyState"
            value={form.CompanyState}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company Zip Code*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company Zip Code"
            name="CompanyZip"
            value={form.CompanyZip}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company Contact*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company Contact"
            name="CompanyContact"
            value={form.CompanyContact}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company GST*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company GST"
            name="CompanyGST"
            value={form.CompanyGST}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Tag Title Name*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Tag Title Name"
            name="tagTitle"
            value={form.tagTitle}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Bill Thankyou Note*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Thankyou Note"
            name="Thankyou"
            value={form.Thankyou}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="form-label">Bill Refund Note*</label>
          <EditorContent
            editor={editor}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "white",
              padding: "10px",
              minHeight: "150px",
            }}
          />
        </div>

        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            Save Changes
          </button>
        </div>
      </div>
      
      {loading && <Loader />}
    </>
  );
};

export default Profile;
