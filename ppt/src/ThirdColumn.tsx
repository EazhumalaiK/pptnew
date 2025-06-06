import React from "react";

export interface Comment {
  text: string;
  timestamp: string;
}

interface ThirdColumnProps {
  comments: Comment[];
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  onCommentSubmit: () => void;
}

const ThirdColumn: React.FC<ThirdColumnProps> = ({
  comments,
  newComment,
  setNewComment,
  onCommentSubmit,
}) => {
  return (
    <div className="flex-1 flex flex-col border p-2 rounded bg-gray-50">
      <h3 className="mb-2 font-semibold">Comments</h3>

      <div className="flex-1 overflow-auto mb-4">
        {comments.length === 0 && (
          <div className="text-gray-400 italic">No comments yet</div>
        )}
        {comments.map((comment, idx) => (
          <div
            key={idx}
            className="mb-2 border-b border-gray-200 pb-1 last:border-0"
          >
            <p className="text-sm">{comment.text}</p>
            <p className="text-xs text-gray-500">
              {new Date(comment.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <textarea
        className="w-full border rounded p-2 mb-2 resize-none"
        rows={3}
        placeholder="Add your comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <button
        onClick={onCommentSubmit}
        disabled={!newComment.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Comment
      </button>
    </div>
  );
};

export default ThirdColumn;
