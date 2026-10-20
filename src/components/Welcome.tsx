import { useStore } from '../store';
import { Sprite } from '../sprites';
import { play } from '../sound';

export function Welcome() {
  const { open, createNote, createBoard } = useStore.getState();
  return (
    <div className="welcome">
      <div className="welcome-card px-panel">
        <div className="welcome-sprites">
          <Sprite name="seed" size={48} />
          <Sprite name="sprout" size={48} />
          <Sprite name="crop" size={48} />
        </div>
        <h1>Çiftliğine hoş geldin!</h1>
        <p>Notlarını parşömenlere yaz, işlerini tarlalara ek. Görevlere tıklayarak onları büyüt ve hasat et.</p>
        <div className="welcome-actions">
          <button
            className="px-btn primary"
            onClick={() => {
              open({ kind: 'note', id: createNote() });
              play('pop');
            }}
          >
            Yeni not
          </button>
          <button
            className="px-btn primary"
            onClick={() => {
              open({ kind: 'board', id: createBoard() });
              play('pop');
            }}
          >
            Yeni tarla
          </button>
        </div>
      </div>
    </div>
  );
}
