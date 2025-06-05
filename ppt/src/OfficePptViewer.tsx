import React from "react";

interface OfficePptViewerProps {
  pptxUrl: string;
}

const OfficePptViewer: React.FC<OfficePptViewerProps> = ({ pptxUrl }) => {
  const encodedUrl = encodeURIComponent(pptxUrl);
  const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

  return (
    <div style={{ width: "100%", height: "601px" }}>
      <iframe
        title="PowerPoint Viewer"
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder={0}
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default OfficePptViewer;
