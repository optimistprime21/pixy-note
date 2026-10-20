import { useSeason, useStore } from './store';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { BoardView } from './components/board/BoardView';
import { Welcome } from './components/Welcome';
import { Dialog } from './components/Dialog';
import { Particles } from './components/Particles';

function Content() {
  const view = useStore((s) => s.view);
  const note = useStore((s) => (view?.kind === 'note' ? s.data.notes.find((n) => n.id === view.id) : undefined));
  const board = useStore((s) => (view?.kind === 'board' ? s.data.boards.find((b) => b.id === view.id) : undefined));

  if (note) return <NoteEditor key={note.id} note={note} />;
  if (board) return <BoardView board={board} />;
  return <Welcome />;
}

export default function App() {
  const loaded = useStore((s) => s.loaded);
  const effects = useStore((s) => s.data.settings.effects);
  const season = useSeason();

  if (!loaded) return <div className="loading">Çiftlik yükleniyor…</div>;

  return (
    <div className="app" data-season={season}>
      <TopBar />
      <div className="main-row">
        <Sidebar />
        <main className="content">
          <Content />
        </main>
      </div>
      {effects && <Particles season={season} />}
      <Dialog />
    </div>
  );
}
