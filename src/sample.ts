import type { AppData, Board, Note } from './types';

// İlk açılışta gösterilen örnek not ve tarla.
export function createSampleData(): AppData {
  const t = Date.now();
  const noteId = crypto.randomUUID();
  const boardId = crypto.randomUUID();

  const note: Note = {
    id: noteId,
    title: 'Çiftliğe hoş geldin!',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Çiftliğe hoş geldin!' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bu bir ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'not' },
            { type: 'text', text: '. Soldaki listeden yenilerini açabilir, bir notu tarlaya sürükleyip akışa bağlayabilirsin.' },
          ],
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pixy Note’u kur' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'İlk tarlanı çiz' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bir görevi hasat et' }] }] },
          ],
        },
      ],
    },
    text: 'Çiftliğe hoş geldin! Bu bir not. Pixy Note’u kur İlk tarlanı çiz Bir görevi hasat et',
    createdAt: t,
    updatedAt: t,
  };

  const board: Board = {
    id: boardId,
    title: 'Örnek tarla',
    createdAt: t,
    updatedAt: t,
    nodes: [
      { id: 'n1', type: 'start', position: { x: 0, y: 96 }, data: { label: 'Gün doğdu' } },
      { id: 'n2', type: 'task', position: { x: 228, y: 84 }, data: { label: 'Tohumları ek', status: 'harvest' } },
      { id: 'n3', type: 'task', position: { x: 480, y: 84 }, data: { label: 'Ekinleri sula', status: 'sprout' } },
      { id: 'n4', type: 'decision', position: { x: 744, y: 84 }, data: { label: 'Hasat zamanı mı?' } },
      { id: 'n5', type: 'end', position: { x: 1020, y: 96 }, data: { label: 'Nakliye sandığı' } },
      { id: 'n6', type: 'task', position: { x: 744, y: 264 }, data: { label: 'Bir gün bekle', status: 'seed' } },
      { id: 'n7', type: 'note', position: { x: 228, y: 252 }, data: { noteId } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', sourceHandle: 'yes', target: 'n5', label: 'Evet' },
      { id: 'e5', source: 'n4', sourceHandle: 'no', target: 'n6', label: 'Hayır' },
      { id: 'e6', source: 'n6', target: 'n3' },
    ],
  };

  return {
    version: 1,
    notes: [note],
    boards: [board],
    settings: { season: 'auto', sound: true, effects: true },
    lastView: { kind: 'board', id: boardId },
  };
}
