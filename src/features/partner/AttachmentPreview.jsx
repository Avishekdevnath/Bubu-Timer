import { useState } from 'react'
import { X, Download, Maximize2, Check, AlertCircle } from 'lucide-react'

export function AttachmentPreview({ attachment, onDelete, isPreview }) {
  const [showModal, setShowModal] = useState(false)

  // Preview mode: show thumbnail with upload status
  if (isPreview) {
    return (
      <div className="relative group overflow-hidden rounded-lg w-20 h-20 flex-shrink-0">
        <img
          src={attachment.preview}
          alt={attachment.file?.name || 'attachment'}
          className="w-full h-full object-cover"
        />

        {/* Upload status overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          {attachment.uploadStatus === 'uploading' && (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {attachment.uploadStatus === 'uploaded' && (
            <div className="text-white">
              <Check size={16} />
            </div>
          )}
          {attachment.uploadStatus === 'error' && (
            <div className="text-red-400">
              <AlertCircle size={16} />
            </div>
          )}
        </div>

        {/* Remove button (always visible on hover) */}
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove">
          <X size={14} className="text-white" />
        </button>

        {/* Error message on hover */}
        {attachment.errorMsg && (
          <div className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
            <span className="text-white text-xs text-center truncate">
              {attachment.errorMsg}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Chat message mode: show full-size image
  return (
    <>
      <div className="relative group overflow-hidden rounded-lg max-w-xs">
        <img
          src={attachment.imageUrl}
          alt={attachment.fileName}
          className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setShowModal(true)}
        />

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => setShowModal(true)}
            className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
            title="Expand">
            <Maximize2 size={16} className="text-stone-700" />
          </button>

          <a
            href={attachment.imageUrl}
            download={attachment.fileName}
            className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
            title="Download">
            <Download size={16} className="text-stone-700" />
          </a>
        </div>

        {/* File name tooltip on hover */}
        {attachment.fileName && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
            {attachment.fileName}
          </div>
        )}
      </div>

      {/* Full-screen modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col cursor-auto">
            <img
              src={attachment.imageUrl}
              alt={attachment.fileName}
              className="w-full h-auto max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <a
                href={attachment.imageUrl}
                download={attachment.fileName}
                className="p-2 bg-white hover:bg-stone-100 rounded-lg transition-colors"
                title="Download">
                <Download size={20} className="text-stone-700" />
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 bg-white hover:bg-stone-100 rounded-lg transition-colors"
                title="Close">
                <X size={20} className="text-stone-700" />
              </button>
            </div>
            {attachment.fileName && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-2 rounded-lg max-w-64 truncate">
                {attachment.fileName}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
