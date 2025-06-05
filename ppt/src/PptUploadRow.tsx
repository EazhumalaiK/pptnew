import React, { useState } from "react";
import Select from "react-select";
import JSZip from "jszip";

const reportOptions = [
  { value: "Report1", label: "Report1" },
  { value: "Report2", label: "Report2" },
  { value: "Report3", label: "Report3" },
  { value: "Report4", label: "Report4" },
];

const multiOptions = [
  { value: "format", label: "Format" },
  { value: "language", label: "Language" },
  { value: "narrative", label: "Narrative" },
];

interface FileInfo {
  name: string;
  type: string;
  size: string;
  slideCount: number | "Unknown" | null;
}

const PptUploadRow: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [correctedFileUrl, setCorrectedFileUrl] = useState<string | null>(null);
  const [amendedSlidesCount, setAmendedSlidesCount] = useState<number | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setCorrectedFileUrl(null);
    setAmendedSlidesCount(null);

    const isPptx = file.name.toLowerCase().endsWith(".pptx");
    const isPpt = file.name.toLowerCase().endsWith(".ppt");

    if (!isPpt && !isPptx) {
      setError("Only .ppt or .pptx files are allowed.");
      setFileInfo(null);
      return;
    }

    if (isPpt) {
      setFileInfo({
        name: file.name,
        type: "ppt",
        size: `${(file.size / 1024).toFixed(2)} KB`,
        slideCount: "Unknown",
      });
      setError("");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const slideFiles = Object.keys(zip.files).filter(
        (filename) =>
          filename.startsWith("ppt/slides/slide") && filename.endsWith(".xml")
      );

      setFileInfo({
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        slideCount: slideFiles.length,
      });
      setError("");
    } catch (err) {
      setError("Failed to read pptx file.");
      setFileInfo(null);
    }
  };

  const handleStart = async () => {
    if (!selectedReport) {
      setError("Please select a report.");
      return;
    }
    if (!fileInfo || !uploadedFile) {
      setError("Please upload a PowerPoint file.");
      return;
    }
    if (selectedOptions.length === 0) {
      setError("Please select at least one option.");
      return;
    }

    setError("");
    setCorrectedFileUrl(null);
    setAmendedSlidesCount(null);

    // If language option selected, call API to validate & correct slides
    if (selectedOptions.includes("language")) {
      setIsProcessing(true);

      try {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("report", selectedReport);
        formData.append("options", JSON.stringify(selectedOptions));

        // Replace "/api/process-ppt" with your actual API endpoint
        const response = await fetch("/api/process-ppt", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to process the PPT file.");
        }

        // We expect the API to respond with a JSON object and file blob separately
        // Usually, APIs send the file as blob or provide a download URL in JSON
        // For demo, assume API returns JSON with amendedSlidesCount and file as blob

        // To handle blob and JSON together, you'd typically do:
        // - API returns JSON { amendedSlidesCount, fileUrl }
        // or
        // - API returns a multipart response or sends file as blob with header info

        // Here we assume API sends JSON with { amendedSlidesCount, fileUrl }

        const result = await response.json();

        if (result.fileUrl) {
          // Use URL from server
          setCorrectedFileUrl(result.fileUrl);
        } else if (result.fileBlob) {
          // If fileBlob as base64 string or similar, decode and create URL (example)
          // Not shown here, depends on API implementation
        } else {
          // No file url? fallback:
          setCorrectedFileUrl(null);
        }

        setAmendedSlidesCount(result.amendedSlidesCount || 0);
        alert("Process completed successfully!");
      } catch (err: any) {
        setError(err.message || "Error processing the file.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert("Process started successfully!");
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white w-full">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Report Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report
          </label>
          <select
            className="w-full border px-3 py-2 rounded-md"
            value={selectedReport || ""}
            onChange={(e) => setSelectedReport(e.target.value)}
          >
            <option value="">Select Report</option>
            {reportOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload PPT
          </label>
          <input
            type="file"
            accept=".ppt,.pptx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
            disabled={isProcessing}
          />
        </div>

        {/* File Info */}
        <div className="text-sm text-gray-600 space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Info
          </label>
          {fileInfo ? (
            <div className="space-y-1">
              <div>
                <strong>Name:</strong> {fileInfo.name}
              </div>
              <div>
                <strong>Type:</strong> {fileInfo.type}
              </div>
              <div>
                <strong>Size:</strong> {fileInfo.size}
              </div>
              <div>
                <strong>Slides:</strong> {fileInfo.slideCount}
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No file uploaded</div>
          )}
        </div>

        {/* Multi-Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Options
          </label>
          <Select
            isMulti
            options={multiOptions}
            onChange={(opts) => setSelectedOptions(opts.map((o) => o.value))}
            placeholder="Select options"
            className="text-sm"
            isDisabled={isProcessing}
          />
        </div>

        {/* Start Button */}
        <div className="pt-7">
          <button
            onClick={handleStart}
            disabled={isProcessing}
            className={`bg-blue-600 text-white px-4 py-2 w-full rounded-md hover:bg-blue-700 transition ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isProcessing ? "Processing..." : "Start"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 text-red-600 text-sm font-medium">{error}</div>
      )}

      {/* Download corrected file */}
      {correctedFileUrl && (
        <div className="mt-4">
          <a
            href={correctedFileUrl}
            download={`corrected_${fileInfo?.name}`}
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Corrected PPT
          </a>
        </div>
      )}

      {/* Amended slides count */}
      {amendedSlidesCount !== null && (
        <div className="mt-2 text-green-600 font-medium">
          Slides Amended: {amendedSlidesCount}
        </div>
      )}
    </div>
  );
};

export default PptUploadRow;
