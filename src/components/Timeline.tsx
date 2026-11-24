import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, ArrowRight, Wand2 } from 'lucide-react';
import { Slide, TransitionType } from '../types';
import { TimelineItem } from './TimelineItem';
import { TRANSITION_OPTIONS } from '../constants/defaults';

interface TimelineProps {
  slides: Slide[];
  selectedSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onReorderSlides: (oldIndex: number, newIndex: number) => void;
  onDeleteSlide: (id: string) => void;
  onOpenUpload: () => void;
  onUpdateTransition: (slideId: string, transitionType: TransitionType) => void;
  onRandomizeMotions: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  slides,
  selectedSlideId,
  onSelectSlide,
  onReorderSlides,
  onDeleteSlide,
  onOpenUpload,
  onUpdateTransition,
  onRandomizeMotions,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Avoid accidental drags when clicking to select
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((item) => item.id === active.id);
      const newIndex = slides.findIndex((item) => item.id === over.id);
      onReorderSlides(oldIndex, newIndex);
    }
  };

  return (
    <div className="h-36 sm:h-40 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex flex-col justify-center">
      {/* Timeline Controls Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Storyboard Timeline</span>
          <span className="text-[11px] text-slate-500">
            Drag to rearrange • Click to edit crop & motion
          </span>
        </div>

        {slides.length > 1 && (
          <button
            type="button"
            onClick={onRandomizeMotions}
            title="Auto-assign dynamic Ken Burns motions & transitions to all photos"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Magic Cinematic Auto-Motion</span>
            <span className="sm:hidden">Magic Motion</span>
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Timeline Reel */}
      <div className="overflow-x-auto overflow-y-hidden pb-1 pt-1 flex items-center gap-2 sm:gap-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            {slides.map((slide, index) => (
              <React.Fragment key={slide.id}>
                {/* Slide Item */}
                <TimelineItem
                  slide={slide}
                  index={index}
                  isSelected={slide.id === selectedSlideId}
                  onSelect={() => onSelectSlide(slide.id)}
                  onDelete={() => onDeleteSlide(slide.id)}
                />

                {/* Transition Link Badge between slides */}
                {index < slides.length - 1 && (
                  <div className="shrink-0 flex flex-col items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        // Cycle to next transition
                        const currentIndex = TRANSITION_OPTIONS.findIndex(
                          (t) => t.id === slide.transition.type
                        );
                        const nextIndex = (currentIndex + 1) % TRANSITION_OPTIONS.length;
                        onUpdateTransition(slide.id, TRANSITION_OPTIONS[nextIndex].id);
                      }}
                      title={`Transition: ${slide.transition.type}. Click to change.`}
                      className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600 border border-slate-700/80 hover:border-indigo-400 text-slate-400 hover:text-white transition-all text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                      <span className="capitalize">{slide.transition.type.replace('-', ' ')}</span>
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Photo Card */}
        <button
          type="button"
          onClick={onOpenUpload}
          className="shrink-0 w-28 sm:w-32 h-24 sm:h-28 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400 flex flex-col items-center justify-center gap-1.5 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">Add Photo</span>
        </button>
      </div>
    </div>
  );
};
