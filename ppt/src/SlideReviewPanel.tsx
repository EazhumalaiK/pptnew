// components/SlideReviewPanel.tsx
import React, { useState } from "react";

interface SlideReviewPanelProps {
  slideImages: string[];
  correctedImages: string[];
  setCorrectedImages: (imgs: string[]) => void;
  comments: string[];
  setComments: (coms: string[]) => void;
}

const SlideReviewPanel: React.FC<SlideReviewPanelProps> = ({
  slideImages,
  correctedImages,
  setCorrectedImages,
  comments,
  setComments,
}) => {
  const [current, setCurrent] = useState(0);

  const handleCommentChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newComment = e.target.value;
    const updated = [...comments];
    updated[current] = newComment;
    setComments(updated);

    try {
      const response = await fetch("/api/correct-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: slideImages[current],
          comment: newComment,
        }),
      });
      const data = await response.json();
      const updatedCorrected = [...correctedImages];
      updatedCorrected[current] = data.correctedImage;
      setCorrectedImages(updatedCorrected);
    } catch (err) {
      console.error("Correction failed");
    }
  };

  const handleDownload = async () => {
    const response = await fetch("/api/export-to-ppt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: correctedImages }),
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corrected_slides.pptx";
    a.click();
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
          disabled={current === 0}
        >
          ←
        </button>
        <div className="flex gap-1">
          {slideImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`px-2 py-1 rounded ${
                current === idx ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            setCurrent((c) => Math.min(c + 1, slideImages.length - 1))
          }
          disabled={current === slideImages.length - 1}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Original</h4>
          <img src={slideImages[current]} className="w-full border" />
        </div>
        <div>
          <h4 className="font-semibold mb-2">Corrected</h4>
          <img src={correctedImages[current]} className="w-full border" />
        </div>
        <div>
          <h4 className="font-semibold mb-2">Comment</h4>
          <textarea
            className="w-full border p-2 rounded"
            rows={6}
            value={comments[current] || ""}
            onChange={handleCommentChange}
          />
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Submit & Download
      </button>
    </div>
  );
};

export default SlideReviewPanel;
