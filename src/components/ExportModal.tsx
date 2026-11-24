import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Film, 
  Sparkles,
  Music,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Slide, ProjectSettings, AudioTrack } from '../types';
import { exportSlideshowToMp4, ExportProgress } from '../utils/videoExporter';
import { ASPECT_RATIOS } from '../constants/defaults';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  settings: ProjectSettings;
  audioTrack: AudioTrack | null;
  audioVolume: number;
  autoFadeAudio: boolean;
  onOpenMusicModal: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  settings,
  audioTrack,
  audioVolume,
  autoFadeAudio,
  onOpenMusicModal,
}) => {
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'completed' | 'error'>('idle');
  const [progressInfo, setProgressInfo] = useState<ExportProgress>({
    phase: 'preparing',
    progress: 0,
    message: '',
  });
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const aspectInfo = ASPECT_RATIOS[settings.aspectRatio];
  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);

  const handleStartExport = async () => {
    setExportState('exporting');
    setErrorMessage(null);

    try {
      const blob = await exportSlideshowToMp4(
        slides,
        settings,
        audioTrack,
        audioVolume,
        autoFadeAudio,
        (progress) => setProgressInfo(progress)
      );

      const url = URL.createObjectURL(blob);
      setExportedBlob(blob);
      setExportedUrl(url);
      setExportState('completed');

      // Trigger celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `PhotoMotion-${settings.aspectRatio.replace(':', '-')}-${Date.now()}.mp4`;
      a.click();
    } catch (err: unknown) {
      console.error('Export error:', err);
      const msg = err instanceof Error ? err.message : 'Video export failed';
      setErrorMessage(msg);
      setExportState('error');
    }
  };

  const handleShareMobile = async () => {
    if (!exportedBlob) return;
    try {
      const file = new File(
        [exportedBlob],
        `photomotion-video-${Date.now()}.mp4`,
        { type: 'video/mp4' }
      );
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My PhotoMotion Video',
        });
      } else {
        alert('Direct sharing is supported on mobile devices. You can click "Download Video" below!');
      }
    } catch (e) {
      console.log('Share canceled or failed:', e);
    }
  };

  const handleClose = () => {
    if (exportState === 'exporting') {
      if (!confirm('Video is currently encoding. Are you sure you want to cancel?')) {
        return;
      }
    }
    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
    }
    setExportState('idle');
    setExportedBlob(null);
    setExportedUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Video to Device</h2>
              <p className="text-xs text-slate-400">High-Definition H.264 MP4 export</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on state */}
        <div className="py-5">
          {exportState === 'idle' && (
            <div className="space-y-4">
              {/* Specs Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Format & Codec</span>
                  <span className="font-semibold text-slate-200">MP4 (H.264 / AVC + AAC)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Resolution</span>
                  <span className="font-semibold text-indigo-400">
                    {aspectInfo.width} × {aspectInfo.height} ({aspectInfo.label})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Duration</span>
                  <span className="font-semibold text-slate-200">{totalDuration.toFixed(1)} seconds</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Slides Count</span>
                  <span className="font-semibold text-slate-200">{slides.length} photos</span>
                </div>
                <div className="flex justify-between text-xs items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-indigo-400" /> Soundtrack
                  </span>
                  <button
                    type="button"
                    onClick={onOpenMusicModal}
                    className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                  >
                    {audioTrack ? audioTrack.title : 'None (Click to choose)'}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Video is encoded directly inside your browser with hardware acceleration. No video files are uploaded to any server.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartExport}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Render & Export MP4 Video</span>
              </button>
            </div>
          )}

          {exportState === 'exporting' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center" />
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-indigo-400">
                  {progressInfo.progress}%
                </div>
              </div>

              <div className="space-y-1 w-full max-w-sm">
                <h3 className="text-sm font-bold text-white">Generating Your Video</h3>
                <p className="text-xs text-slate-400 truncate px-2">{progressInfo.message}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${progressInfo.progress}%` }}
                />
              </div>

              <span className="text-[11px] text-slate-500">
                Please keep this tab open while the hardware encoder finishes.
              </span>
            </div>
          )}

          {exportState === 'completed' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Video Ready!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your MP4 video has been compiled and download has started.
                </p>
              </div>

              {/* Video Preview */}
              {exportedUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-48 mx-auto flex items-center justify-center">
                  <video
                    src={exportedUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <a
                  href={exportedUrl || '#'}
                  download={`PhotoMotion-${settings.aspectRatio.replace(':', '-')}-${Date.now()}.mp4`}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Video (.MP4)</span>
                </a>

                <button
                  type="button"
                  onClick={handleShareMobile}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
                  title="Share or Save to Camera Roll on Phone"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share / Camera Roll</span>
                </button>
              </div>
            </div>
          )}

          {exportState === 'error' && (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Export Failed</h3>
              <p className="text-xs text-rose-300 max-w-sm mx-auto">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setExportState('idle')}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
