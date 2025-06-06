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

const backendUrl = "http://127.0.0.1:8000";

interface UploadComponentProps {
  uploadedFile: File | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<File | null>>;
  selectedReport: string | null;
  setSelectedReport: React.Dispatch<React.SetStateAction<string | null>>;
  fileInfo: any;
  setFileInfo: React.Dispatch<React.SetStateAction<any>>;
  selectedOptions: string[];
  setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>;
  setSlideImages: React.Dispatch<React.SetStateAction<string[]>>;
  setCorrectedSlideImages: React.Dispatch<React.SetStateAction<string[]>>;
  setComments: React.Dispatch<
    React.SetStateAction<{ text: string; timestamp: string }[][]>
  >;
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}

const UploadComponent: React.FC<UploadComponentProps> = ({
  uploadedFile,
  setUploadedFile,
  selectedReport,
  setSelectedReport,
  fileInfo,
  setFileInfo,
  selectedOptions,
  setSelectedOptions,
  setSlideImages,
  setCorrectedSlideImages,
  setComments,
  setCurrentSlideIndex,
  error,
  setError,
  isProcessing,
  setIsProcessing,
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setCorrectedSlideImages([]);
    setSlideImages([]);
    setComments([]);
    setFileInfo(null);
    setError("");

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
    if (!selectedOptions.length) {
      setError("Please select at least one option.");
      return;
    }
    setError("");
    setIsProcessing(true);
    try {
      const formData = new FormData();
      if (!uploadedFile) {
        setError("Please upload a PowerPoint file.");
        setIsProcessing(false);
        return;
      }
      formData.append("file", uploadedFile);
      formData.append("report", selectedReport);
      formData.append("options", JSON.stringify(selectedOptions));

      const response = await fetch(`${backendUrl}/convert-ppt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();

      const originalImages = (result.imageUrls || []).map(
        (path: string) => backendUrl + path
      );
      const correctedImages = (result.correctedImageUrls || originalImages).map(
        (path: string) => backendUrl + path
      );

      setSlideImages(originalImages);
      setCorrectedSlideImages(correctedImages);
      setComments(new Array(originalImages.length).fill([]));
      setCurrentSlideIndex(0);
    } catch (err: any) {
      setError(err.message || "Error processing the file.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 border p-4 rounded bg-white shadow-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Report
        </label>
        <select
          className="w-full border px-3 py-2 rounded-md"
          value={selectedReport || ""}
          onChange={(e) => setSelectedReport(e.target.value)}
          disabled={isProcessing}
        >
          <option value="">Select Report</option>
          {reportOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

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
          value={multiOptions.filter((opt) =>
            selectedOptions.includes(opt.value)
          )}
        />
      </div>

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
  );
};

export default UploadComponent;
