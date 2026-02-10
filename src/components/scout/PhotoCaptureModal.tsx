import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RotateCcw, Check, ImageIcon } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface PhotoCaptureModalProps {
  onClose: () => void;
  onPhotoCaptured: (imageBase64: string) => void;
}

export function PhotoCaptureModal({ onClose, onPhotoCaptured }: PhotoCaptureModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { onClose });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer rear camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Camera access error:', error);
        setCameraError('Unable to access camera. Please use the photo library option.');
        setIsLoading(false);
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageBase64);
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const usePhoto = useCallback(() => {
    if (capturedImage) {
      onPhotoCaptured(capturedImage);
    }
  }, [capturedImage, onPhotoCaptured]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div ref={modalRef} className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      <div className="flex flex-col w-full h-full max-w-2xl relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <h2 className="text-white font-medium">
          {capturedImage ? 'Preview' : 'Take Photo'}
        </h2>

        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Camera preview / Captured image */}
      <div className="flex-1 relative bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {cameraError && !capturedImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <ImageIcon className="w-16 h-16 text-white/40 mb-4" />
            <p className="text-white/70 text-center mb-6">{cameraError}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-medium"
            >
              Choose from Library
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Bottom controls */}
      <div className="bg-gradient-to-t from-black/90 to-transparent px-6 pb-8 pt-6">
        {capturedImage ? (
          // Preview mode controls
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={retakePhoto}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/70 text-sm">Retake</span>
            </button>

            <button
              onClick={usePhoto}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                <Check className="w-8 h-8 text-white" />
              </div>
              <span className="text-white text-sm font-medium">Use Photo</span>
            </button>
          </div>
        ) : (
          // Capture mode controls
          <div className="flex items-center justify-center gap-8">
            {/* Library button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/70 text-sm">Library</span>
            </button>

            {/* Capture button */}
            <button
              onClick={capturePhoto}
              disabled={!!cameraError || isLoading}
              className="flex flex-col items-center gap-2"
            >
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center
                ${cameraError || isLoading
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)]'
                }
                transition-all
              `}>
                <Camera className={`w-10 h-10 ${cameraError || isLoading ? 'text-white/40' : 'text-white'}`} />
              </div>
            </button>

            {/* Spacer to balance */}
            <div className="w-14" />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
