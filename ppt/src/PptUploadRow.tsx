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

const backendUrl = "http://127.0.0.1:8000"; // backend base URL

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
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [correctedSlideImages, setCorrectedSlideImages] = useState<string[]>(
    []
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [comments, setComments] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setCorrectedFileUrl(null);
    setAmendedSlidesCount(null);
    setSlideImages([]);
    setCorrectedSlideImages([]);
    setComments([]);
    setCurrentSlideIndex(0);

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
    setIsProcessing(true);

    try {
      const formData = new FormData();
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

      // Backend returns relative paths like "/slides/slide_1.png"
      // Prepend backendUrl to make them absolute URLs
      const originalImages = (result.imageUrls || []).map(
        (path: string) => backendUrl + path
      );
      const correctedImages = (result.correctedImageUrls || originalImages).map(
        (path: string) => backendUrl + path
      );

      setSlideImages(originalImages);
      setCorrectedSlideImages(correctedImages);
      setComments(new Array(originalImages.length).fill(""));
      setCurrentSlideIndex(0);
    } catch (err: any) {
      setError(err.message || "Error processing the file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommentChange = async (index: number, value: string) => {
    const updatedComments = [...comments];
    updatedComments[index] = value;
    setComments(updatedComments);

    try {
      const response = await fetch(`${backendUrl}/amend-slide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slideIndex: index,
          comment: value,
          report: selectedReport,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to amend slide: ${response.statusText}`);
      }

      const result = await response.json();

      const updatedCorrectedSlides = [...correctedSlideImages];
      // Again prepend backend URL if backend returns relative path
      updatedCorrectedSlides[index] = result.correctedImageUrl.startsWith(
        "http"
      )
        ? result.correctedImageUrl
        : backendUrl + result.correctedImageUrl;

      setCorrectedSlideImages(updatedCorrectedSlides);
    } catch (err) {
      console.error("Failed to amend slide.", err);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white w-full">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

      {error && (
        <div className="mt-4 text-red-600 text-sm font-medium">{error}</div>
      )}

      {slideImages.length > 0 && (
        <div className="mt-6">
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {slideImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`px-3 py-1 rounded-md border ${
                  currentSlideIndex === idx
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <img
                src={slideImages[currentSlideIndex]}
                alt={`Original Slide ${currentSlideIndex + 1}`}
                className="w-full border rounded"
              />
            </div>
            <div>
              <img
                src={correctedSlideImages[currentSlideIndex]}
                alt={`Corrected Slide ${currentSlideIndex + 1}`}
                className="w-full border rounded"
              />
            </div>
            <div>
              <textarea
                value={comments[currentSlideIndex] || ""}
                onChange={(e) =>
                  handleCommentChange(currentSlideIndex, e.target.value)
                }
                placeholder="Enter your comment..."
                className="w-full h-40 p-2 border rounded resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() =>
                setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))
              }
              disabled={currentSlideIndex === 0}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              ← Prev
            </button>
            <button
              onClick={() =>
                setCurrentSlideIndex((prev) =>
                  Math.min(prev + 1, slideImages.length - 1)
                )
              }
              disabled={currentSlideIndex === slideImages.length - 1}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Next →
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={async () => {
                try {
                  const response = await fetch(
                    `${backendUrl}/download-corrected-ppt`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        correctedSlides: correctedSlideImages,
                      }),
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Download failed: ${response.statusText}`);
                  }

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "corrected_presentation.pptx");
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (error) {
                  alert(`Download error: ${(error as Error).message}`);
                }
              }}
            >
              Submit & Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PptUploadRow;
