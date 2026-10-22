import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ALL_WIDGET_IDS, getWidgetInfo } from '@/lib/widgetRegistry';

/**
 * Widget gallery / customizer.
 *
 * Driven by the widget registry, so every widget available on Home appears here
 * with a preview, a description and an add/remove control. Order can be changed
 * by dragging or by the up/down buttons (which also work from the keyboard).
 * Nothing is saved until Save, and the student's existing layout is preserved.
 */
export default function WidgetCustomizer({
  activeWidgets,
  onToggleWidget,
  onReorder,
  onClose,
  onSave,
}) {
  // Active widgets first in their order, then everything not currently added.
  const orderedIds = [
    ...activeWidgets,
    ...ALL_WIDGET_IDS.filter((id) => !activeWidgets.includes(id)),
  ];

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedIds);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    // Only the added widgets make up the layout.
    onReorder(items.filter((id) => activeWidgets.includes(id)));
  };

  const moveActive = (id, delta) => {
    const index = activeWidgets.indexOf(id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= activeWidgets.length) return;
    const next = [...activeWidgets];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onReorder(next);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Customize Home</h2>
              <p className="text-xs text-slate-400 mt-0.5">Add widgets, drag to reorder, or use the arrows</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="overflow-y-auto flex-1">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="widget-customizer">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="p-4 space-y-2"
                  >
                    {orderedIds.map((id, index) => {
                      const info = getWidgetInfo(id);
                      if (!info) return null;
                      const isActive = activeWidgets.includes(id);
                      const activeIndex = activeWidgets.indexOf(id);
                      const { Icon } = info;

                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                                snapshot.isDragging ? 'shadow-lg scale-[1.02]' : ''
                              } ${
                                isActive
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 bg-white opacity-70'
                              }`}
                            >
                              {/* Drag handle */}
                              <div
                                {...dragProvided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0"
                                aria-label={`Reorder ${info.name}`}
                              >
                                <GripVertical className="w-5 h-5" aria-hidden="true" />
                              </div>

                              {/* Small preview of the widget */}
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 border border-white flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                              </div>

                              {/* Name + description */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-semibold text-slate-800 text-sm truncate">{info.name}</h3>
                                  {info.isNew ? (
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-white bg-indigo-500 rounded-full px-1.5 py-0.5 shrink-0">
                                      New
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{info.description}</p>
                              </div>

                              {/* Order controls for added widgets */}
                              {isActive ? (
                                <div className="flex flex-col shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => moveActive(id, -1)}
                                    disabled={activeIndex === 0}
                                    aria-label={`Move ${info.name} earlier`}
                                    className="w-7 h-6 flex items-center justify-center rounded-t-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveActive(id, 1)}
                                    disabled={activeIndex === activeWidgets.length - 1}
                                    aria-label={`Move ${info.name} later`}
                                    className="w-7 h-6 flex items-center justify-center rounded-b-lg border border-t-0 border-slate-200 bg-white text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              ) : null}

                              {/* Add / remove */}
                              <button
                                type="button"
                                onClick={() => onToggleWidget(id)}
                                aria-label={isActive ? `Remove ${info.name}` : `Add ${info.name}`}
                                className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 h-8 text-xs font-semibold transition-colors ${
                                  isActive
                                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" aria-hidden="true" /> Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div className="p-4 border-t border-slate-200 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              <Check className="w-4 h-4 mr-2" aria-hidden="true" />
              Save
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}