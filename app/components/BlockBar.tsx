"use client";

export const BLOCK_MIME = "application/x-block-start";

export function BlockBar({
  weekStart,
  editable,
  onDragStart,
  onDragEnd,
  onRemove,
}: {
  weekStart: string;
  editable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRemove: () => void;
}) {
  if (!editable) return <div className="h-4 bg-zinc-200 my-1" />;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(BLOCK_MIME, weekStart);
    e.dataTransfer.effectAllowed = "move";
    onDragStart();
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      title="Drag to move block"
      className="h-4 bg-zinc-300 my-1 cursor-grab flex items-center justify-end"
    >
      <button
        onClick={onRemove}
        title="Remove block"
        className="text-xs leading-none text-zinc-600 hover:text-red-600 px-2"
      >
        ✕
      </button>
    </div>
  );
}

export function AddBlockGap({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative h-6 flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
      <button
        onClick={onAdd}
        className="relative text-xs leading-none px-2 py-0.5 rounded border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
      >
        + block
      </button>
    </div>
  );
}
