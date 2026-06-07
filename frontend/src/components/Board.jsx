import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge, Avatar, Button, Input } from "./ui.jsx";
import { CardModal } from "./CardModal.jsx";
import { api } from "../lib/api.js";

const PRIORITY_BORDER = {
  critical: "#f43f5e",
  high: "#f59e0b",
  medium: "#5b5bd6",
  low: "#e2e0db",
};

function MiniCard({ card }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderLeft: `3px solid ${PRIORITY_BORDER[card.priority]}`,
      borderRadius: 10, padding: "10px 12px",
      boxShadow: "0 16px 40px rgba(0,0,0,0.18)", transform: "rotate(1.5deg)",
      opacity: 0.95, width: 260, pointerEvents: "none",
    }}>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: 6, lineHeight: 1.3 }}>{card.title}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <Badge type="priority" value={card.priority} size="sm" />
        <Badge type="type" value={card.type} size="sm" />
      </div>
    </div>
  );
}

function SortableCard({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id, data: { type: "card", card },
  });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1 }}
      {...attributes} {...listeners}>
      <CardItem card={card} onClick={() => !isDragging && onClick(card)} />
    </div>
  );
}

function CardItem({ card, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderLeft: `3px solid ${PRIORITY_BORDER[card.priority]}`,
        borderRadius: 10, padding: "12px 14px", cursor: "pointer", marginBottom: 8,
        boxShadow: hovered ? "var(--shadow)" : "var(--shadow-sm)",
        transition: "box-shadow 0.15s, transform 0.1s",
        transform: hovered ? "translateY(-1px)" : "none", userSelect: "none",
      }}>
      {card.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 7 }}>
          {card.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: "0.68rem", padding: "1px 6px", background: "var(--indigo-light)", color: "var(--indigo)", borderRadius: 99, fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      )}
      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.35, marginBottom: 10 }}>{card.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Badge type="type" value={card.type} size="sm" />
        <Badge type="priority" value={card.priority} size="sm" />
        {card.githubIssue && (
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            #{card.githubIssue.number}
          </span>
        )}
        {card.assignee && <div style={{ marginLeft: card.githubIssue ? 0 : "auto" }}><Avatar name={card.assignee} size={20} /></div>}
      </div>
    </div>
  );
}

function Column({ col, onCardClick, onAddCard }) {
  const cardIds = col.cards.map(c => c._id);
  const { setNodeRef, isOver } = useDroppable({ id: col._id, data: { type: "column", columnId: col._id } });
  return (
    <div style={{
      display: "flex", flexDirection: "column", width: 280, flexShrink: 0,
      background: isOver ? "rgba(91,91,214,0.04)" : "var(--surface-2)",
      borderRadius: 16, border: isOver ? "2px dashed rgba(91,91,214,0.35)" : "2px solid transparent",
      transition: "all 0.15s", maxHeight: "100%",
    }}>
      <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)", flex: 1 }}>{col.name}</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-3)", background: "var(--border)", borderRadius: 99, padding: "2px 7px" }}>{col.cards.length}</span>
      </div>
      <div ref={setNodeRef} style={{ flex: 1, overflowY: "auto", padding: "4px 12px 12px" }}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {col.cards.map(card => <SortableCard key={card._id} card={card} onClick={onCardClick} />)}
        </SortableContext>
        {col.cards.length === 0 && (
          <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "20px 12px", textAlign: "center", color: "var(--text-3)", fontSize: "0.8rem", marginTop: 4 }}>
            Drop cards here
          </div>
        )}
      </div>
      <div style={{ padding: "4px 12px 12px", flexShrink: 0 }}>
        <button onClick={() => onAddCard(col._id)}
          style={{ width: "100%", padding: "7px", background: "none", border: "1px dashed var(--border-strong)", borderRadius: 6, color: "var(--text-3)", fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.color = "var(--indigo)"; e.currentTarget.style.background = "var(--indigo-light)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "none"; }}>
          + Add card
        </button>
      </div>
    </div>
  );
}

function NewCardForm({ columnId, projectId, members, onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("task");
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const card = await api.createCard({ projectId, columnId, title: title.trim(), priority, type, assignee });
      onCreated(card);
    } catch (err) {
      alert("Error: " + err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(26,25,23,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div className="modal-in" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: 24, width: 380, boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 600, marginBottom: 16, fontSize: "0.95rem" }}>New Card</div>
        <form onSubmit={submit}>
          <Input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Card title…" style={{ marginBottom: 12, width: "100%", padding: "9px 12px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <select value={type} onChange={e => setType(e.target.value)} style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.85rem" }}>
              {["bug","feature","task","chore"].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.85rem" }}>
              {["critical","high","medium","low"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {members?.length > 0 && (
            <select value={assignee} onChange={e => setAssignee(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.85rem", marginBottom: 12 }}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m}>{m}</option>)}
            </select>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !title.trim()}>{loading ? "Adding…" : "Add Card"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Board({ columns: initialColumns, projectId, project, onColumnsChange }) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeCard, setActiveCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);

  // Keep a ref to the state snapshot before drag starts — used for revert on error
  const preDragColumns = useRef(null);
  // Track where the card ended up (updated in handleDragOver)
  const dragTargetRef = useRef({ colId: null, card: null });

  // Sync when parent reloads (e.g. after import)
  useEffect(() => { setColumns(initialColumns); }, [initialColumns]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const findColumnByCardId = useCallback((cardId, cols) => {
    return cols.find(col => col.cards.some(c => c._id === cardId));
  }, []);

  function handleDragStart({ active }) {
    // Snapshot state before drag
    preDragColumns.current = columns;
    const col = findColumnByCardId(active.id, columns);
    const card = col?.cards.find(c => c._id === active.id);
    setActiveCard(card || null);
    dragTargetRef.current = { colId: col?._id, card };
  }

  function handleDragOver({ active, over }) {
    if (!over) return;

    setColumns(prev => {
      const fromCol = findColumnByCardId(active.id, prev);
      if (!fromCol) return prev;

      // Determine target column id
      const overIsCard = prev.some(col => col.cards.some(c => c._id === over.id));
      const toColId = overIsCard ? findColumnByCardId(over.id, prev)?._id : over.id;
      if (!toColId || fromCol._id === toColId) return prev;

      const card = fromCol.cards.find(c => c._id === active.id);
      dragTargetRef.current.colId = toColId;

      return prev.map(col => {
        if (col._id === fromCol._id) return { ...col, cards: col.cards.filter(c => c._id !== active.id) };
        if (col._id === toColId) return { ...col, cards: [...col.cards, card] };
        return col;
      });
    });
  }

  async function handleDragEnd({ active, over }) {
    setActiveCard(null);
    if (!over) {
      // Dropped outside — revert
      setColumns(preDragColumns.current);
      return;
    }

    // After optimistic update, find where the card now lives
    const toCol = findColumnByCardId(active.id, columns);
    if (!toCol) return;

    const toIndex = toCol.cards.findIndex(c => c._id === active.id);
    const finalIndex = toIndex >= 0 ? toIndex : toCol.cards.length;

    // Bubble up to parent for header counter sync
    onColumnsChange?.(columns);

    try {
      await api.moveCard(active.id, toCol._id, finalIndex);
    } catch (e) {
      // Revert on API error
      setColumns(preDragColumns.current);
      onColumnsChange?.(preDragColumns.current);
      alert("Move failed: " + e.message);
    } finally {
      preDragColumns.current = null;
    }
  }

  function handleCardCreated(card) {
    setColumns(prev => {
      const next = prev.map(col =>
        col._id === card.columnId ? { ...col, cards: [...col.cards, card] } : col
      );
      onColumnsChange?.(next);
      return next;
    });
    setAddingToColumn(null);
  }

  function handleCardUpdated(updated) {
    setColumns(prev => {
      const next = prev.map(col => ({
        ...col,
        cards: col.cards.map(c => c._id === updated._id ? { ...c, ...updated } : c),
      }));
      onColumnsChange?.(next);
      return next;
    });
    setSelectedCard(prev => prev?._id === updated._id ? { ...prev, ...updated } : prev);
  }

  function handleCardDeleted(id) {
    setColumns(prev => {
      const next = prev.map(col => ({ ...col, cards: col.cards.filter(c => c._id !== id) }));
      onColumnsChange?.(next);
      return next;
    });
    setSelectedCard(null);
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: 16, height: "100%", overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
          {columns.map(col => (
            <Column key={col._id} col={col} onCardClick={setSelectedCard} onAddCard={setAddingToColumn} />
          ))}
        </div>
        <DragOverlay>{activeCard && <MiniCard card={activeCard} />}</DragOverlay>
      </DndContext>

      {addingToColumn && (
        <NewCardForm columnId={addingToColumn} projectId={projectId} members={project?.members || []}
          onCreated={handleCardCreated} onCancel={() => setAddingToColumn(null)} />
      )}

      {selectedCard && (
        <CardModal card={selectedCard} projectId={projectId} members={project?.members || []}
          onClose={() => setSelectedCard(null)} onUpdated={handleCardUpdated} onDeleted={handleCardDeleted} />
      )}
    </>
  );
}
