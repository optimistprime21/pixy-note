import { createContext, useContext, useEffect, useState } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { PixyEdge, PixyNode, TaskStatus } from '../../types';
import { Sprite } from '../../sprites';
import { useStore } from '../../store';
import { play } from '../../sound';

/** Düğümler değişiklik yapmadan önce geri-al geçmişine kayıt düşsün diye. */
const SnapshotCtx = createContext<() => void>(() => {});
export const SnapshotProvider = SnapshotCtx.Provider;

function useNodeEditor() {
  const { updateNodeData } = useReactFlow<PixyNode, PixyEdge>();
  const snapshot = useContext(SnapshotCtx);
  return { updateNodeData, snapshot };
}

function EditableLabel({ id, value, placeholder }: { id: string; value?: string; placeholder: string }) {
  const { updateNodeData, snapshot } = useNodeEditor();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => setDraft(value ?? ''), [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== (value ?? '')) {
      snapshot();
      updateNodeData(id, { label: draft });
    }
  };

  if (editing) {
    return (
      <input
        className="node-input nodrag"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value ?? '');
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <div className="node-label" title="Düzenlemek için çift tıkla" onDoubleClick={() => setEditing(true)}>
      {value || <span className="muted">{placeholder}</span>}
    </div>
  );
}

const NEXT: Record<TaskStatus, TaskStatus> = { seed: 'sprout', sprout: 'harvest', harvest: 'seed' };
const STATUS_TEXT: Record<TaskStatus, string> = { seed: 'Tohum', sprout: 'Filizlendi', harvest: 'Hasat!' };

function TaskNode({ id, data, selected }: NodeProps<PixyNode>) {
  const { updateNodeData, snapshot } = useNodeEditor();
  const status = data.status ?? 'seed';

  const cycle = () => {
    const next = NEXT[status];
    snapshot();
    updateNodeData(id, { status: next });
    play(next === 'harvest' ? 'harvest' : next === 'sprout' ? 'grow' : 'click');
  };

  return (
    <div className={`pnode task status-${status}${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <button className="sprite-btn nodrag" title="Büyüt (tohum → filiz → hasat)" onClick={cycle}>
        <Sprite name={status === 'harvest' ? 'crop' : status} size={40} />
      </button>
      <div className="pnode-body">
        <EditableLabel id={id} value={data.label} placeholder="Görev adı" />
        <span className={`status-tag ${status}`}>{STATUS_TEXT[status]}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function StartNode({ id, data, selected }: NodeProps<PixyNode>) {
  return (
    <div className={`pnode start${selected ? ' selected' : ''}`}>
      <Sprite name="sun" size={36} />
      <EditableLabel id={id} value={data.label} placeholder="Başla" />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function EndNode({ id, data, selected }: NodeProps<PixyNode>) {
  return (
    <div className={`pnode end${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Sprite name="chest" size={36} />
      <EditableLabel id={id} value={data.label} placeholder="Bitir" />
    </div>
  );
}

function DecisionNode({ id, data, selected }: NodeProps<PixyNode>) {
  return (
    <div className={`pnode decision${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Sprite name="sign" size={36} />
      <EditableLabel id={id} value={data.label} placeholder="Soru?" />
      <Handle type="source" id="yes" position={Position.Right} />
      <span className="handle-tag yes">Evet</span>
      <Handle type="source" id="no" position={Position.Bottom} />
      <span className="handle-tag no">Hayır</span>
    </div>
  );
}

function NoteNode({ id, data, selected }: NodeProps<PixyNode>) {
  const { updateNodeData, snapshot } = useNodeEditor();
  const notes = useStore((s) => s.data.notes);
  const open = useStore((s) => s.open);
  const note = notes.find((n) => n.id === data.noteId);

  return (
    <div
      className={`pnode note${selected ? ' selected' : ''}`}
      title="Notu açmak için çift tıkla"
      onDoubleClick={() => note && open({ kind: 'note', id: note.id })}
    >
      <Handle type="target" position={Position.Left} />
      <Sprite name="page" size={36} />
      <div className="pnode-body">
        <div className="node-label">{note ? note.title || 'Adsız not' : <span className="muted">Bağlı not yok</span>}</div>
        {note?.text && <div className="excerpt">{note.text.slice(0, 70)}{note.text.length > 70 ? '…' : ''}</div>}
        <select
          className="node-select nodrag"
          value={data.noteId ?? ''}
          onChange={(e) => {
            snapshot();
            updateNodeData(id, { noteId: e.target.value || null });
          }}
        >
          <option value="">— not seç —</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title || 'Adsız not'}
            </option>
          ))}
        </select>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  decision: DecisionNode,
  note: NoteNode,
  end: EndNode,
};
