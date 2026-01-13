import React from 'react';
import { X } from 'lucide-react';

export default function DescriptionModal({
  open,
  onClose,
  title,
  description,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-lg transition-all duration-300 ${
        open
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className="relative bg-black/30 backdrop-blur-lg rounded-xl w-[85vw] h-[75vh] max-w-3xl p-6 sm:p-8 overflow-y-auto text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-secondary/70 rounded transition"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Title */}
        <h3 className="text-2xl sm:text-3xl text-secondary font-semibold mb-4">
          {title}
        </h3>

        {/* Body */}
        <p className="text-gray-400 leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
    </div>
  );
}
