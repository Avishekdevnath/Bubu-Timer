import { useState, useCallback } from 'react'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 3

export function useFileUploader() {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [error, setError] = useState(null)

  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, WebP, and GIF images are allowed'
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1)
      return `File too large (${sizeInMB}MB). Max 10MB per file`
    }
    return null
  }, [])

  const addFiles = useCallback((files) => {
    setError(null)
    const fileArray = Array.from(files)
    const newFiles = []
    const errors = []

    for (const file of fileArray) {
      if (newFiles.length + selectedFiles.length >= MAX_FILES) {
        errors.push(`Max ${MAX_FILES} files per message`)
        break
      }

      const validationError = validateFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
        continue
      }

      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        uploadStatus: 'pending', // pending, uploading, uploaded, error
        progress: 0,
        imageUrl: null,
        errorMsg: null,
      })
    }

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }, [selectedFiles, validateFile])

  const uploadFile = useCallback((fileId, uploadFn) => {
    setSelectedFiles((prev) => {
      const updated = [...prev]
      const fileIndex = updated.findIndex((f) => f.id === fileId)
      if (fileIndex === -1) return prev

      const file = updated[fileIndex]
      file.uploadStatus = 'uploading'
      file.progress = 0

      // Start upload in background
      uploadFn(file.file, (progress) => {
        setSelectedFiles((current) => {
          const idx = current.findIndex((f) => f.id === fileId)
          if (idx !== -1) {
            current[idx].progress = progress
          }
          return [...current]
        })
      })
        .then((result) => {
          setSelectedFiles((current) => {
            const idx = current.findIndex((f) => f.id === fileId)
            if (idx !== -1) {
              current[idx].uploadStatus = 'uploaded'
              current[idx].imageUrl = result.imageUrl
              current[idx].fileName = result.fileName
              current[idx].size = result.size
              current[idx].progress = 100
            }
            return [...current]
          })
        })
        .catch((err) => {
          setSelectedFiles((current) => {
            const idx = current.findIndex((f) => f.id === fileId)
            if (idx !== -1) {
              current[idx].uploadStatus = 'error'
              current[idx].errorMsg = err.message || 'Upload failed'
            }
            return [...current]
          })
        })

      return updated
    })
  }, [])

  const removeFile = useCallback((id) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const clearFiles = useCallback(() => {
    setSelectedFiles((prev) => {
      prev.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      return []
    })
    setError(null)
  }, [])

  return {
    selectedFiles,
    error,
    addFiles,
    uploadFile,
    removeFile,
    clearFiles,
  }
}
