import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const WIDGET_INFO = {
  xp: { name: 'XP Progress', description: 'Your experience progress bar' },
  pet: { name: 'Equipped Pet', description: 'Your current companion and theme' },
  stats: { name: 'Quick Stats', description: 'XP, pets, and completed quests' },
  leaderboard: { name: 'Mini Leaderboard', description: 'Top 3 students' },
  assignments: { name: 'Recent Quests', description: 'Your latest assignments' },
  season: { name: 'Season Progress', description: 'Current season status' },
  nav: { name: 'Quick Navigation', description: 'Navigation cards' },
};

const ALL_WIDGET_IDS = Object.keys(WIDGET_INFO);

export default function WidgetCustomizer({ 
  activeWidgets, 
  onToggleWidget,
  onReorder,
  onClose,
  onSave 
}) {
  // Build the full ordered list: active widgets first (in their order), then inactive ones at the bottom
  const orderedIds = [
    ...activeWidgets,
    ...ALL_WIDGET_IDS.filter(id => !activeWidgets.includes(id))
  ];

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedIds);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    // Only pass back the active ones in their new order
    const newActiveOrder = items.filter(id => activeWidgets.includes(id));
    onReorder(newActiveOrder);
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Customize Widgets</h2>
              <p className="text-xs text-slate-400 mt-0.5">Drag to reorder • tap to show/hide</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="overflow-y-auto max-h-[60vh]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="widget-customizer">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="p-4 space-y-2"
                  >
                    {orderedIds.map((id, index) => {
                      const info = WIDGET_INFO[id];
                      const isActive = activeWidgets.includes(id);
                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                snapshot.isDragging ? 'shadow-lg scale-[1.02]' : ''
                              } ${
                                isActive
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 bg-white opacity-60'
                              }`}
                            >
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0" onClick={() => onToggleWidget(id)}>
                                <h3 className="font-semibold text-slate-800 text-sm">{info.name}</h3>
                                <p className="text-xs text-slate-500">{info.description}</p>
                              </div>

                              {/* Toggle */}
                              <button
                                onClick={() => onToggleWidget(id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}