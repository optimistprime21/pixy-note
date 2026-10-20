import { useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { Sprite, type SpriteName } from '../sprites';
import { play } from '../sound';
import { NOTE_MIME } from './board/Palette';

const normalize = (s: string) => s.toLocaleLowerCase('tr-TR');

function Section({ title, sprite, onAdd, children }: { title: string; sprite: SpriteName; onAdd: () => void; children: ReactNode }) {
  return (
    <section className="side-section">
      <div className="side-head">
        <Sprite name={sprite} size={22} />
        <span>{title}</span>
        <button className="px-btn small" title="Yeni ekle" onClick={onAdd}>
          +
        </button>
      </div>
      <div className="side-list">{children}</div>
    </section>
  );
}

export function Sidebar() {
  const notes = useStore((s) => s.data.notes);
  const boards = useStore((s) => s.data.boards);
  const view = useStore((s) => s.view);
  const { open, createNote, createBoard } = useStore.getState();
  const [query, setQuery] = useState('');

  const q = normalize(query.trim());
  const filteredNotes = useMemo(
    () =>
      [...notes]
        .filter((n) => !q || normalize(n.title).includes(q) || normalize(n.text).includes(q))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [notes, q],
  );
  const filteredBoards = useMemo(
    () => [...boards].filter((b) => !q || normalize(b.title).includes(q)).sort((a, b) => b.updatedAt - a.updatedAt),
    [boards, q],
  );

  const select = (kind: 'note' | 'board', id: string) => {
    open({ kind, id });
    play('click');
  };

  return (
    <aside className="sidebar wood">
      <input className="search" placeholder="Ara…" value={query} onChange={(e) => setQuery(e.target.value)} />

      <Section
        title="Notlar"
        sprite="page"
        onAdd={() => {
          open({ kind: 'note', id: createNote() });
          play('pop');
        }}
      >
        {filteredNotes.map((n) => (
          <button
            key={n.id}
            className={`side-item${view?.id === n.id ? ' active' : ''}`}
            onClick={() => select('note', n.id)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(NOTE_MIME, n.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            title="Tıkla: aç · Tarlaya sürükle: akışa ekle"
          >
            <span className="side-item-title">{n.title || 'Adsız not'}</span>
            {q && n.text && <span className="side-item-sub">{n.text.slice(0, 40)}</span>}
          </button>
        ))}
        {!filteredNotes.length && <div className="side-empty">{q ? 'Bulunamadı' : 'Henüz not yok'}</div>}
      </Section>

      <Section
        title="Tarlalar"
        sprite="sprout"
        onAdd={() => {
          open({ kind: 'board', id: createBoard() });
          play('pop');
        }}
      >
        {filteredBoards.map((b) => {
          const harvested = b.nodes.filter((n) => n.type === 'task' && n.data.status === 'harvest').length;
          const tasks = b.nodes.filter((n) => n.type === 'task').length;
          return (
            <button
              key={b.id}
              className={`side-item${view?.id === b.id ? ' active' : ''}`}
              onClick={() => select('board', b.id)}
            >
              <span className="side-item-title">{b.title || 'Adsız tarla'}</span>
              {tasks > 0 && (
                <span className="side-item-sub">
                  {harvested}/{tasks} hasat
                </span>
              )}
            </button>
          );
        })}
        {!filteredBoards.length && <div className="side-empty">{q ? 'Bulunamadı' : 'Henüz tarla yok'}</div>}
      </Section>
    </aside>
  );
}
