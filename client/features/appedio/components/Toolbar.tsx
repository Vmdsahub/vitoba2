import React, { useRef } from "react";
import type { ImageData } from "../types";
import { Tool } from "../types";
import { UploadIcon, SelectionIcon, BrushIcon, LinkIcon, UpscaleIcon } from "./Icons";

interface ToolbarProps {
  onImageUpload: (imageData: ImageData) => void;
  activeTool: Tool | null;
  onToolChange: (tool: Tool | null) => void;
}

const COLORS = {
  upload: { border: "border-amber-700", ring: "ring-amber-600", rgb: "180,83,9" },
  upscale: { border: "border-violet-700", ring: "ring-violet-600", rgb: "109,40,217" },
  select: { border: "border-blue-700", ring: "ring-blue-600", rgb: "29,78,216" },
  brush: { border: "border-emerald-700", ring: "ring-emerald-600", rgb: "4,120,87" },
  link: { border: "border-teal-700", ring: "ring-teal-600", rgb: "15,118,110" },
} as const;

interface ToolButtonProps {
  label: string;
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  colorKey: keyof typeof COLORS;
}

const ToolButton: React.FC<ToolButtonProps> = ({ label, children, isActive, onClick, colorKey }) => {
  const color = COLORS[colorKey];
  const base = `flex items-center justify-center w-10 h-10 rounded-md border-2 ${color.border} bg-white transition-all duration-200 ease-out focus:outline-none`;
  const inactive = `opacity-70 hover:opacity-100 hover:bg-gray-50`;
  const active = `ring-2 ${color.ring} shadow-lg`;

  const style = isActive
    ? { boxShadow: `0 0 0 2px rgba(${color.rgb}, 0.5), 0 0 12px rgba(${color.rgb}, 0.45)` }
    : undefined;

  return (
    <button
      onClick={onClick}
      className={`${base} ${isActive ? active : inactive}`}
      aria-label={label}
      title={label}
      style={style}
    >
      {children}
    </button>
  );
};

export const Toolbar: React.FC<ToolbarProps> = ({ onImageUpload, activeTool, onToolChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        if (base64) {
          onImageUpload({ base64, mimeType: file.type });
        }
      };
      reader.readAsDataURL(file);
      event.target.value = ""; // Reset input to allow re-uploading the same file
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside className="fixed left-0 top-16 w-20 bg-white flex flex-col items-center pt-16 space-y-5 h-[calc(100vh-4rem)] z-40 border-r border-gray-200">
      <div className="flex flex-col space-y-6">
        <ToolButton label="Upload Image" colorKey="upload" isActive={false} onClick={handleUploadClick}>
          <UploadIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Upscale Tool" colorKey="upscale" isActive={activeTool === Tool.UPSCALE} onClick={() => onToolChange(activeTool === Tool.UPSCALE ? null : Tool.UPSCALE)}>
          <UpscaleIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Selection Tool" colorKey="select" isActive={activeTool === Tool.SELECT} onClick={() => onToolChange(activeTool === Tool.SELECT ? null : Tool.SELECT)}>
          <SelectionIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Mask Brush" colorKey="brush" isActive={activeTool === Tool.BRUSH} onClick={() => onToolChange(activeTool === Tool.BRUSH ? null : Tool.BRUSH)}>
          <BrushIcon className="w-5 h-5" />
        </ToolButton>
        <ToolButton label="Link Tool" colorKey="link" isActive={activeTool === Tool.LINK} onClick={() => onToolChange(activeTool === Tool.LINK ? null : Tool.LINK)}>
          <LinkIcon className="w-5 h-5" />
        </ToolButton>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
    </aside>
  );
};
