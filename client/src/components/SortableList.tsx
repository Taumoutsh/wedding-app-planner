import { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '../i18n/useTranslation';

// The handle props a card spreads onto its drag-handle element.
export type DragHandleProps = Pick<
  ReturnType<typeof useSortable>,
  'setActivatorNodeRef' | 'attributes' | 'listeners'
>;

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => number;
  onReorder: (orderedIds: number[]) => void;
  strategy?: 'vertical' | 'grid';
  className?: string;
  renderItem: (item: T, dragHandle: DragHandleProps) => ReactNode;
}

interface SortableItemProps<T> {
  id: number;
  item: T;
  renderItem: (item: T, dragHandle: DragHandleProps) => ReactNode;
}

function SortableItem<T>({ id, item, renderItem }: SortableItemProps<T>) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    // Use Translate (not Transform) so variable-height items are not scaled to
    // match their neighbour while dragging, which looks like a zoom/stretch glitch.
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, { setActivatorNodeRef, attributes, listeners })}
    </div>
  );
}

export function SortableList<T>({
  items,
  getId,
  onReorder,
  strategy = 'vertical',
  className,
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    // A small drag threshold so taps/clicks on cards still work as before.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = items.map(getId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={ids}
        strategy={strategy === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item) => (
            <SortableItem key={getId(item)} id={getId(item)} item={item} renderItem={renderItem} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandle({ handle, className }: { handle?: DragHandleProps; className?: string }) {
  const { t } = useTranslation();
  if (!handle) return null;
  return (
    <button
      type="button"
      ref={handle.setActivatorNodeRef}
      {...handle.attributes}
      {...handle.listeners}
      className={`cursor-grab active:cursor-grabbing touch-none flex-shrink-0 ${className ?? ''}`}
      title={t('common.dragToReorder')}
      aria-label={t('common.dragToReorder')}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <circle cx="7" cy="4" r="1.5" />
        <circle cx="13" cy="4" r="1.5" />
        <circle cx="7" cy="10" r="1.5" />
        <circle cx="13" cy="10" r="1.5" />
        <circle cx="7" cy="16" r="1.5" />
        <circle cx="13" cy="16" r="1.5" />
      </svg>
    </button>
  );
}
