import React from "react";

interface SecondColumnProps {
  correctedImage: string;
  currentSlideIndex: number;
}

const SecondColumn: React.FC<SecondColumnProps> = ({
  correctedImage,
  currentSlideIndex,
}) => {
  return (
    <div className="flex-1 overflow-auto border p-2 rounded bg-gray-50">
      <h3 className="mb-2 font-semibold">
        Corrected Slide #{currentSlideIndex + 1}
      </h3>
      <img
        src={correctedImage}
        alt={`Corrected slide ${currentSlideIndex + 1}`}
        className="w-full h-auto rounded shadow"
      />
    </div>
  );
};

export default SecondColumn;
