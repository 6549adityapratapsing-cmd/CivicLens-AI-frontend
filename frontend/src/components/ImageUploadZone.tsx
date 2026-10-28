import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Sparkles, AlertCircle } from 'lucide-react';
import { LanguageCode } from '../types';
import { UI_TEXT } from '../utils/translations';
import { SAMPLE_PRESETS, SamplePreset, samplePresetToFile } from '../utils/sampleImages';

interface ImageUploadZoneProps {
  language: LanguageCode;
  selectedFile: File | null;
  imagePreviewUrl: string | null;
  onFileSelect: (file: File | null, previewUrl: string | null) => void;
  onPresetSelect?: (preset: SamplePreset) => void;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  language,
  selectedFile,
  imagePreviewUrl,
  onFileSelect,
  onPresetSelect,
}) => {
  const t = UI_TEXT[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(
        language === 'hi'
          ? 'फाइल का आकार 10MB से अधिक है। कृपया छोटी फाइल चुनें।'
          : 'File size exceeds 10MB. Please choose a smaller image.'
      );
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(
        language === 'hi'
          ? 'केवल JPEG, PNG या WEBP छवियां समर्थित हैं।'
          : 'Only JPEG, PNG, or WEBP images are supported.'
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onFileSelect(file, previewUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetClick = async (preset: SamplePreset) => {
    try {
      const file = await samplePresetToFile(preset);
      onFileSelect(file, preset.svgDataUri);
      if (onPresetSelect) {
        onPresetSelect(preset);
      }
    } catch (e) {
      console.error('Failed to load sample preset:', e);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileSelect(null, null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          <span>{t.uploadTitle}</span>
        </label>
        {selectedFile && (
          <span className="text-xs text-slate-400">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type.replace('image/', '').toUpperCase()}
          </span>
        )}
      </div>

      {/* Main Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[220px] ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
            : selectedFile
            ? 'border-slate-700 bg-slate-900/60'
            : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {imagePreviewUrl ? (
          <div className="relative w-full max-w-md mx-auto group">
            <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-xl bg-slate-950 aspect-video flex items-center justify-center">
              <img
                src={imagePreviewUrl}
                alt="Civic issue evidence preview"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-rose-600 transition-all shadow-md"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400 text-center">
              {language === 'hi' ? 'फोटो बदलने के लिए क्लिक करें' : 'Click to change photo'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <UploadCloud className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{t.uploadSubtitle}</p>
              <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP</p>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preset Samples Picker - Prominently labeled as Sample Data */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t.quickPresetTitle}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/60">
            {language === 'hi' ? 'डेमो नमूना डेटा' : 'SAMPLE DEMO DATA'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">
          {language === 'hi'
            ? 'त्वरित परीक्षण के लिए पूर्व-निर्मित नमूना साक्ष्य (केवल प्रदर्शन हेतु):'
            : 'Pre-configured test evidence for quick evaluation (for demonstration only):'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="p-2.5 rounded-xl text-left border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/50 transition-all group relative"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                {language === 'hi' ? preset.nameHi : preset.nameEn}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {preset.category.split('/')[0]}
              </div>
              <span className="text-[9px] text-amber-400/80 uppercase font-mono block mt-1">
                Sample
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
