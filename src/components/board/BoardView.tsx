import { useCallback, useEffect, useRef, type DragEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import type { Board, FlowNodeType, PixyEdge, PixyNode } from '../../types';
import { uid, useStore } from '../../store';
import { play } from '../../sound';
import { askConfirm, askText } from '../../ui';
import { nodeTypes, SnapshotProvider } from './nodes';
import { NODE_MIME, NOTE_MIME, Palette } from './Palette';

const edgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#5a3a1e', width: 18, height: 18 },
};

const DEFAULT_DATA: Record<FlowNodeType, PixyNode['data']> = {
  start: { label: 'Gün doğdu' },
  task: { label: 'Yeni görev', status: 'seed' },
  decision: { label: 'Karar?' },
  note: { noteId: null },
  end: { label: 'Nakliye sandığı' },
};

const MINIMAP_COLORS: Record<string, string> = {
  start: '#f2c94c',
  task: '#7ccf4f',
  decision: '#c68642',
  note: '#f4e4bc',
  end: '#8b5a2b',
};

type Snapshot = { nodes: PixyNode[]; edges: PixyEdge[] };

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

// Kaydedilecek veriden geçici seçim bilgilerini temizle
const cleanNodes = (ns: PixyNode[]) => ns.map(({ selected: _s, dragging: _d, ...n }) => n);
const cleanEdges = (es: PixyEdge[]) => es.map(({ selected: _s, ...e }) => e);

function Canvas({ board }: { board: Board }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<PixyNode>(board.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<PixyEdge>(board.edges);
  const rf = useReactFlow<PixyNode, PixyEdge>();
  const updateBoard = useStore((s) => s.updateBoard);
  const createNote = useStore((s) => s.createNote);

  // --- Geri al / yinele -------------------------------------------------
  const current = useRef<Snapshot>({ nodes, edges });
  current.current = { nodes, edges };
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);

  const snapshot = useCallback(() => {
    past.current.push(current.current);
    if (past.current.length > 100) past.current.shift();
    future.current = [];
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(current.current);
    setNodes(prev.nodes);
    setEdges(prev.edges);
    play('click');
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(current.current);
    setNodes(next.nodes);
    setEdges(next.edges);
    play('click');
  }, [setNodes, setEdges]);

  // --- Store'a kaydet (gecikmeli) --------------------------------------
  const initial = useRef({ nodes, edges });
  useEffect(() => {
    if (nodes === initial.current.nodes && edges === initial.current.edges) return;
    const t = window.setTimeout(
      () => updateBoard(board.id, { nodes: cleanNodes(nodes), edges: cleanEdges(edges) }),
      250,
    );
    return () => window.clearTimeout(t);
  }, [nodes, edges, board.id, updateBoard]);

  // Tarla değişirken veya kapanırken son hali kaçmasın
  useEffect(
    () => () => {
      const { nodes: n, edges: e } = current.current;
      if (n !== initial.current.nodes || e !== initial.current.edges) {
        updateBoard(board.id, { nodes: cleanNodes(n), edges: cleanEdges(e) });
      }
    },
    [board.id, updateBoard],
  );

  // --- Kopyala / yapıştır ---------------------------------------------
  const clipboard = useRef<Snapshot | null>(null);

  const copy = useCallback(() => {
    const sel = current.current.nodes.filter((n) => n.selected);
    if (!sel.length) return;
    const ids = new Set(sel.map((n) => n.id));
    clipboard.current = {
      nodes: sel,
      edges: current.current.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    };
  }, []);

  const paste = useCallback(() => {
    const clip = clipboard.current;
    if (!clip) return;
    snapshot();
    const idMap = new Map(clip.nodes.map((n) => [n.id, uid()]));
    const newNodes = clip.nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: { x: n.position.x + 36, y: n.position.y + 36 },
      selected: true,
    }));
    const newEdges = clip.edges.map((e) => ({
      ...e,
      id: uid(),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      selected: false,
    }));
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setEdges((es) => [...es, ...newEdges]);
    // Bir sonraki yapıştırma biraz daha kaysın
    clipboard.current = { nodes: newNodes, edges: newEdges };
    play('pop');
  }, [snapshot, setNodes, setEdges]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) undo();
      else if ((k === 'z' && e.shiftKey) || k === 'y') redo();
      else if (k === 'c') copy();
      else if (k === 'v') paste();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, copy, paste]);

  // --- Tuval olayları ---------------------------------------------------
  const onConnect = useCallback(
    (c: Connection) => {
      snapshot();
      const label = c.sourceHandle === 'yes' ? 'Evet' : c.sourceHandle === 'no' ? 'Hayır' : undefined;
      setEdges((es) => addEdge({ ...c, id: uid(), label }, es));
      play('click');
    },
    [snapshot, setEdges],
  );

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData(NODE_MIME) as FlowNodeType | '';
    const existingNoteId = e.dataTransfer.getData(NOTE_MIME);
    if (!type && !existingNoteId) return;

    const position = rf.screenToFlowPosition({ x: e.clientX - 60, y: e.clientY - 24 });
    let node: PixyNode;
    if (existingNoteId) {
      node = { id: uid(), type: 'note', position, data: { noteId: existingNoteId } };
    } else if (type === 'note') {
      node = { id: uid(), type: 'note', position, data: { noteId: createNote('Yeni not') } };
    } else {
      node = { id: uid(), type: type as FlowNodeType, position, data: { ...DEFAULT_DATA[type as FlowNodeType] } };
    }
    snapshot();
    setNodes((ns) => [...ns, node]);
    play('pop');
  };

  const onEdgeDoubleClick = async (_: unknown, edge: PixyEdge) => {
    const value = await askText('Patika etiketi', typeof edge.label === 'string' ? edge.label : '');
    if (value === null) return;
    snapshot();
    setEdges((es) => es.map((x) => (x.id === edge.id ? { ...x, label: value.trim() || undefined } : x)));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ title: board.title, nodes: cleanNodes(nodes), edges: cleanEdges(edges) }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${board.title || 'tarla'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clearAll = async () => {
    if (!nodes.length) return;
    if (!(await askConfirm('Tarlayı temizle', 'Tüm düğümler sökülecek. (Ctrl+Z ile geri alabilirsin)'))) return;
    snapshot();
    setNodes([]);
    setEdges([]);
    play('remove');
  };

  return (
    <SnapshotProvider value={snapshot}>
      <ReactFlow<PixyNode, PixyEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={snapshot}
        onBeforeDelete={async () => {
          snapshot();
          play('remove');
          return true;
        }}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMoveEnd={(_, viewport) => updateBoard(board.id, { viewport })}
        defaultViewport={board.viewport}
        fitView={!board.viewport}
        fitViewOptions={{ padding: 0.25, maxZoom: 1.2 }}
        defaultEdgeOptions={edgeOptions}
        snapToGrid
        snapGrid={[12, 12]}
        deleteKeyCode={['Backspace', 'Delete']}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Lines} gap={48} lineWidth={2} />
        <Panel position="bottom-center">
          <Palette />
        </Panel>
        <Panel position="top-right" className="board-tools">
          <button className="px-btn" onClick={undo} title="Geri al (Ctrl+Z)">↶</button>
          <button className="px-btn" onClick={redo} title="Yinele (Ctrl+Shift+Z)">↷</button>
          <button className="px-btn" onClick={() => rf.fitView({ padding: 0.25, duration: 300 })} title="Tümünü göster">⌖</button>
          <button className="px-btn" onClick={exportJson} title="JSON olarak dışa aktar">⇩ JSON</button>
          <button className="px-btn danger" onClick={clearAll} title="Tarlayı temizle">Temizle</button>
        </Panel>
        <MiniMap pannable zoomable nodeColor={(n) => MINIMAP_COLORS[n.type ?? ''] ?? '#c68642'} nodeStrokeColor="#3b2314" nodeStrokeWidth={3} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </SnapshotProvider>
  );
}

export function BoardView({ board }: { board: Board }) {
  const updateBoard = useStore((s) => s.updateBoard);
  const deleteBoard = useStore((s) => s.deleteBoard);

  return (
    <div className="board-view">
      <header className="doc-header">
        <input
          className="title-input"
          value={board.title}
          placeholder="Tarla adı"
          onChange={(e) => updateBoard(board.id, { title: e.target.value })}
        />
        <span className="hint">Çift tık: düzenle · Sürükle: bağla · Del: sil · Ctrl+C/V: kopyala</span>
        <button
          className="px-btn danger"
          onClick={async () => {
            if (await askConfirm('Tarlayı sil', `“${board.title}” kalıcı olarak silinecek.`)) {
              deleteBoard(board.id);
              play('remove');
            }
          }}
        >
          Sil
        </button>
      </header>
      <div className="board-canvas">
        <ReactFlowProvider key={board.id}>
          <Canvas board={board} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
