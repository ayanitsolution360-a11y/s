import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, CameraOff, X, RefreshCw, AlertCircle, Scan } from 'lucide-react';

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  isOpen,
  onScan,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    // Enumerate video devices
    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        setVideoInputDevices(devices);
        if (devices.length > 0) {
          // Prefer back camera on mobile devices if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          );
          const deviceId = backCam ? backCam.deviceId : devices[0].deviceId;
          setSelectedDeviceId(deviceId);
          startScanning(codeReader, deviceId);
        } else {
          setErrorMessage('No camera devices detected on this system.');
        }
      })
      .catch((err) => {
        setHasPermission(false);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Camera permission denied or camera not accessible.'
        );
      });

    return () => {
      codeReader.reset();
      codeReaderRef.current = null;
    };
  }, [isOpen]);

  const startScanning = (codeReader: BrowserMultiFormatReader, deviceId: string) => {
    if (!videoRef.current) return;
    setErrorMessage(null);

    codeReader.decodeFromVideoDevice(
      deviceId || null,
      videoRef.current,
      (result, error) => {
        if (result) {
          const text = result.getText();
          if (text) {
            onScan(text);
          }
        }
      }
    );
    setHasPermission(true);
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      startScanning(codeReaderRef.current, deviceId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Live Camera Barcode Scanner
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanner Aim Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {/* Laser scan line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
            </div>
          </div>

          {/* Error notice if permission or device problem */}
          {errorMessage && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <CameraOff className="w-10 h-10 text-rose-400" />
              <p className="text-xs font-semibold text-rose-300">{errorMessage}</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                You can still use any handheld USB/Bluetooth hardware scanner or enter barcodes manually.
              </p>
            </div>
          )}
        </div>

        {/* Controls & Device Selection */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 space-y-3">
          {videoInputDevices.length > 1 && (
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Select Camera:
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
              >
                {videoInputDevices.map((dev) => (
                  <option key={dev.deviceId} value={dev.deviceId}>
                    {dev.label || `Camera ${dev.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hold barcode steady inside the frame
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
