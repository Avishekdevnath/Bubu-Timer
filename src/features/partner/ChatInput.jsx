import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { Reply, X, Mic, Square, Paperclip } from 'lucide-react'
import { useVoiceRecorder } from './useVoiceRecorder.js'
import { useFileUploader } from './useFileUploader.js'
import { AttachmentPreview } from './AttachmentPreview.jsx'
import * as api from './partnerApi.js'

const MIN_HEIGHT = 40   // ~1 line
const MAX_HEIGHT = 140  // ~5-6 lines, then scroll

export function ChatInput({ partnerName, onSend, replyingTo, cancelReply, onTyping, roomCode }) {
  const [val, setVal] = useState('')
  const [composing, setComposing] = useState(false)
  const [isUploadingVoice, setIsUploadingVoice] = useState(false)
  const taRef = useRef(null)
  const fileInputRef = useRef(null)
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useVoiceRecorder()
  const { selectedFiles, error, addFiles, uploadFile, removeFile, clearFiles } = useFileUploader()

  // Auto-grow on content change
  useLayoutEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = `${MIN_HEIGHT}px` // reset first to shrink when deleting
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, ta.scrollHeight))
    ta.style.height = `${next}px`
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [val])

  // Auto-upload pending files
  useEffect(() => {
    if (!roomCode) return
    
    selectedFiles.forEach(file => {
      if (file.uploadStatus === 'pending') {
        console.log('🚀 Auto-uploading pending file:', file.file.name)
        uploadFile(file.id, (onProgress) => api.uploadAttachment(roomCode, file.file, onProgress))
      }
    })
  }, [selectedFiles, roomCode, uploadFile])

  function submit(e) {
    if (e) e.preventDefault()
    
    console.log('📝 Submit called', { selectedFilesCount: selectedFiles.length, textLength: val.length, isRecording })
    
    // If there are attachments, use attachment handler instead
    if (selectedFiles.length > 0) {
      console.log('📎 Routing to handleSendWithAttachments (found', selectedFiles.length, 'files)')
      handleSendWithAttachments()
      return
    }
    
    // Otherwise, send text message
    if (!val.trim()) return
    console.log('💬 Sending text message')
    onSend(val)
    setVal('')
  }

  function onKeyDown(e) {
    // Ctrl/Cmd + Enter sends. Plain Enter inserts newline.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !composing) {
      e.preventDefault()
      submit()
    }
  }

  async function handleStartRecording() {
    await startRecording()
  }

  async function handleStopRecording() {
    const result = await stopRecording()
    if (!result || !roomCode) return

    const { blob, duration } = result
    setIsUploadingVoice(true)

    try {
      const { audioUrl, duration: recordedDuration } = await api.uploadVoice(roomCode, blob, duration)
      onSend({
        type: 'voice',
        audioUrl,
        duration: recordedDuration,
      })
    } catch (err) {
      console.error('Failed to send voice message:', err)
    } finally {
      setIsUploadingVoice(false)
    }
  }

  function handleFileInputChange(e) {
    const files = e.target.files
    console.log('📁 File input changed:', files?.length || 0, 'files selected')
    if (files) {
      console.log('Adding files:', Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type })))
      addFiles(files)
      // Files will be auto-uploaded by useEffect
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  function handleSendWithAttachments() {
    console.log('📎 handleSendWithAttachments called', { selectedFilesCount: selectedFiles.length })
    
    if (!selectedFiles.length) {
      console.warn('⚠️ No files selected')
      return
    }

    // Check if all files are uploaded
    const uploadedFiles = selectedFiles.filter(f => f.uploadStatus === 'uploaded')
    const failedFiles = selectedFiles.filter(f => f.uploadStatus === 'error')
    
    if (uploadedFiles.length === 0) {
      console.warn('⚠️ No files uploaded yet')
      return
    }

    if (failedFiles.length > 0) {
      console.warn('⚠️ Some files failed to upload:', failedFiles)
      alert(`${failedFiles.length} file(s) failed to upload. Sending ${uploadedFiles.length} successful uploads.`)
    }

    // Build attachments from uploaded files
    const attachments = uploadedFiles.map(f => ({
      imageUrl: f.imageUrl,
      fileName: f.fileName,
      size: f.size,
    }))

    console.log('📨 Sending message with', attachments.length, 'uploaded attachments:', attachments)
    onSend({
      text: val.trim() || '',
      attachments,
    })

    setVal('')
    clearFiles()
    console.log('✨ Message sent and files cleared')
  }

  // Check if any files are still uploading
  const isUploadingFiles = selectedFiles.some(f => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending')

  return (
    <div className="flex-shrink-0">
      {/* Recording overlay */}
      {isRecording && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex justify-between items-center shadow-sm mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-600">Recording...</span>
            <span className="text-xs text-red-500 font-mono ml-auto">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={cancelRecording}
              className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleStopRecording}
              disabled={isUploadingVoice}
              className="px-2 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors">
              {isUploadingVoice ? 'Uploading...' : 'Send'}
            </button>
          </div>
        </div>
      )}

    {replyingTo && (
      <div className="bg-stone-100/90 backdrop-blur-md border border-stone-200 rounded-xl p-2.5 flex justify-between items-center shadow-sm mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="flex flex-col overflow-hidden text-sm flex-1 mr-3">
          <span className="font-bold text-stone-700 flex items-center gap-1.5 mb-0.5 text-[11px] uppercase tracking-wider">
            <Reply size={11}/> Replying to {replyingTo.senderName || 'message'}
          </span>
          <span className="text-stone-500 truncate text-xs">
            {(replyingTo.text || '').slice(0, 100) || '(message)'}
          </span>
        </div>
        <button onClick={cancelReply} className="text-stone-400 hover:text-stone-700 bg-white rounded-full p-1 shadow-sm transition-colors flex-shrink-0">
          <X size={14}/>
        </button>
      </div>
    )}

    {/* File attachment preview */}
    {selectedFiles.length > 0 && (
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-stone-700">
            Uploading {selectedFiles.filter(f => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending').length} • 
            Uploaded {selectedFiles.filter(f => f.uploadStatus === 'uploaded').length} • 
            Failed {selectedFiles.filter(f => f.uploadStatus === 'error').length}
          </span>
          <button
            type="button"
            onClick={clearFiles}
            className="text-stone-400 hover:text-stone-600 text-xs">
            Clear
          </button>
        </div>
        
        {/* Thumbnail grid */}
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file) => (
            <AttachmentPreview
              key={file.id}
              attachment={file}
              isPreview={true}
              onDelete={() => removeFile(file.id)}
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    )}

    {/* Error message */}
    {error && selectedFiles.length === 0 && (
      <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-2 text-xs text-red-600">
        {error}
      </div>
    )}
    
    <form onSubmit={submit} className="flex gap-2 items-end bg-white border border-stone-200 shadow-sm p-2 rounded-2xl mt-1">
      {/* Mic button */}
      <button
        type="button"
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={isUploadingVoice}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
          isRecording
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        } disabled:opacity-50`}
        title={isRecording ? 'Stop recording' : 'Start voice message'}
      >
        {isRecording ? <Square size={16} /> : <Mic size={16} />}
      </button>

      <textarea
        ref={taRef}
        value={val}
        onChange={(e) => { setVal(e.target.value); if (e.target.value.trim() && onTyping) onTyping() }}
        onKeyDown={onKeyDown}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        placeholder={`Message ${partnerName || 'partner'}…`}
        rows={1}
        disabled={isRecording}
        className="flex-1 bg-transparent px-3 py-2 text-[14px] outline-none text-stone-800 placeholder:text-stone-400 resize-none leading-snug chat-scroll disabled:opacity-50"
        style={{ height: MIN_HEIGHT, overflowWrap: 'anywhere' }}
      />
      <button
        type="submit"
        disabled={(!val.trim() && !selectedFiles.some(f => f.uploadStatus === 'uploaded')) || isRecording || isUploadingVoice || isUploadingFiles}
        className="w-9 h-9 bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-stone-800 disabled:opacity-40 transition-colors flex-shrink-0"
      >
        {isUploadingFiles ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        )}
      </button>

      {/* File upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={selectedFiles.length >= 3 || isRecording}
        className="w-9 h-9 bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        title={selectedFiles.length >= 3 ? 'Max 3 files' : 'Add images'}
      >
        <Paperclip size={16} />
      </button>
    </form>
    <p className="text-[10px] text-stone-400 mt-1 px-2">
      <span className="font-semibold">**bold**</span> · <span className="italic">_italic_</span> · <span className="line-through">~~strike~~</span> · <code className="bg-stone-100 px-1 rounded">`code`</code> · Tap send · 🎤 Voice · 📷 Images
    </p>
    </div>
  )
}
