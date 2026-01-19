import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

export default function WidgetGrid({ widgets, onReorder, editMode, children }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    onReorder(items);
  };

  if (!editMode) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="widgets">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {React.Children.map(children, (child, index) => (
              <Draggable key={widgets[index]} draggableId={widgets[index]} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`relative ${snapshot.isDragging ? 'z-50' : ''}`}
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full p-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                    {child}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}