import { useState } from "react";
import { uploadDocument } from "../../api/document.api";

const UploadBox = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadDocument(formData);
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Upload Document</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {message && (
        <p className="mt-4 text-sm text-green-400">{message}</p>
      )}
    </div>
  );
};

export default UploadBox;