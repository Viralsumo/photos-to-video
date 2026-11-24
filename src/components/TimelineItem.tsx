import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Sparkles, X } from 'lucide-react';
import { Slide } from '../types';

interface TimelineItemProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  slide,
  index,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative shrink-0 w-28 sm:w-32 h-24 sm:h-28 rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-200 border-2 ${
        isSelected
          ? 'border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/20'
          : 'border-slate-800 hover:border-slate-600 bg-slate-900/60'
      } ${isDragging ? 'opacity-50 scale-105' : ''}`}
    >
      {/* Background Image Thumbnail */}
      <img
        src={slide.imageUrl}
        alt={`Slide ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

      {/* Top Header: Drag Handle & Delete */}
      <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag to rearrange"
          className="p-1 rounded-md bg-black/60 backdrop-blur-md text-slate-400 hover:text-white cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3" />
        </button>

        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-slate-300">
          #{index + 1}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove photo"
          className="p-1 rounded-md bg-black/60 backdrop-blur-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom Info: Duration & Motion */}
      <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between text-[10px] font-medium text-slate-300 pointer-events-none">
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md font-mono">
          <Clock className="w-2.5 h-2.5 text-indigo-400" />
          {slide.duration.toFixed(1)}s
        </span>

        {slide.motion.type !== 'none' && (
          <span className="p-1 rounded-md bg-black/70 backdrop-blur-md text-indigo-400" title={slide.motion.type}>
            <Sparkles className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
    </div>
  );
};
