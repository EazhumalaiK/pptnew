import React from "react";

interface FirstColumnProps {
  slideImage: string;
  currentSlideIndex: number;
}

const FirstColumn: React.FC<FirstColumnProps> = ({
  slideImage,
  currentSlideIndex,
}) => {
  return (
    <div className="flex-1 overflow-auto border p-2 rounded bg-gray-50">
      <h3 className="mb-2 font-semibold">
        Original Slide #{currentSlideIndex + 1}
      </h3>
      <img
        src={slideImage}
        alt={`Original slide ${currentSlideIndex + 1}`}
        className="w-full h-auto rounded shadow"
      />
    </div>
  );
};

export default FirstColumn;
