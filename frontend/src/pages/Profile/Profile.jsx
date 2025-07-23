import React, { useState } from "react";
import "./Profile.css";

const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
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

  return (
    <>
      <p className="bread">Profile</p>
      <div className="profile row g-3">
        <div className="mt-4 col-md-6">
          <label className="mb-3">Website Header Logo *</label>

          <div className="mb-3">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleChange}
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
              {/* <div className="card-body text-center">
            <button className="btn btn-danger me-2" onClick={handleRemove}>
            Remove
            </button>
            <button className="btn btn-success" onClick={() => alert("Upload logic here!")}>
            Upload
            </button>
          </div> */}
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
              onChange={handleChange}
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
              {/* <div className="card-body text-center">
            <button className="btn btn-danger me-2" onClick={handleRemove}>
              Remove
              </button>
            <button className="btn btn-success" onClick={() => alert("Upload logic here!")}>
            Upload
            </button>
          </div> */}
            </div>
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label">Website Title*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Website Title"
            required
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Website Address*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Website Address"
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company Name*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company Name"
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company Address*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company Address"
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company State*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company State"
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company Contact*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company Contact"
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Company GST*</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Company GST"
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Extra Field</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Extra Data"
            required
          />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
};

export default ImageUploader;
