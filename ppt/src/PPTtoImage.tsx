import React, { useState } from "react";
import UploadComponent from "./UploadComponent";
import FirstColumn from "./FirstColumn";
import SecondColumn from "./SecondColumn";
import ThirdColumn from "./ThirdColumn";
import type { Comment } from "./ThirdColumn";

const backendUrl = "http://127.0.0.1:8000";

const PPTtoImage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [correctedSlideImages, setCorrectedSlideImages] = useState<string[]>(
    []
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // comments is an array of arrays of Comment objects, one array per slide
  const [comments, setComments] = useState<Comment[][]>([]);
  const [newComment, setNewComment] = useState<string>("");

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    const commentObj: Comment = {
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    };

    // Update comments state immutably for current slide
    const updatedSlideComments = [
      ...(comments[currentSlideIndex] || []),
      commentObj,
    ];
    const allComments = [...comments];
    allComments[currentSlideIndex] = updatedSlideComments;
    setComments(allComments);
    setNewComment("");

    try {
      const response = await fetch(`${backendUrl}/amend-slide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slideIndex: currentSlideIndex,
          comment: commentObj.text,
          report: selectedReport,
        }),
      });

      const result = await response.json();

      const updatedCorrectedSlides = [...correctedSlideImages];
      updatedCorrectedSlides[currentSlideIndex] =
        result.correctedImageUrl.startsWith("http")
          ? result.correctedImageUrl
          : backendUrl + result.correctedImageUrl;

      setCorrectedSlideImages(updatedCorrectedSlides);
    } catch (err) {
      console.error("Comment update failed:", err);
    }
  };

  return (
    <div className="p-6 bg-white w-full h-screen flex flex-col space-y-6">
      <UploadComponent
        selectedReport={selectedReport}
        setSelectedReport={setSelectedReport}
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        fileInfo={fileInfo}
        setFileInfo={setFileInfo}
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        setSlideImages={setSlideImages}
        setCorrectedSlideImages={setCorrectedSlideImages}
        setComments={setComments}
        setCurrentSlideIndex={setCurrentSlideIndex}
        error={error}
        setError={setError}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />

      {slideImages.length > 0 && (
        <div className="flex flex-1 space-x-4 overflow-hidden">
          <FirstColumn
            slideImage={slideImages[currentSlideIndex]}
            currentSlideIndex={currentSlideIndex}
          />
          <SecondColumn
            correctedImage={correctedSlideImages[currentSlideIndex]}
            currentSlideIndex={currentSlideIndex}
          />
          <ThirdColumn
            comments={comments[currentSlideIndex] || []}
            newComment={newComment}
            setNewComment={setNewComment}
            onCommentSubmit={handleCommentSubmit}
          />
        </div>
      )}

      {slideImages.length > 0 && (
        <div className="mt-4 flex justify-between">
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
      )}
    </div>
  );
};

export default PPTtoImage;
