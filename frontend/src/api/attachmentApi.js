import axiosClient from "./axiosClient";

export const attachmentApi = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient
      .post("/communication/attachments/file", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then(res => res.data); // Extract the attachment object
  }
};
