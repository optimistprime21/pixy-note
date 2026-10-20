import type { DragEvent } from 'react';
import type { FlowNodeType } from '../../types';
import { Sprite, type SpriteName } from '../../sprites';

export const NODE_MIME = 'application/pixy-node';
export const NOTE_MIME = 'application/pixy-note';

const ITEMS: { type: FlowNodeType; sprite: SpriteName; label: string; hint: string }[] = [
  { type: 'start', sprite: 'sun', label: 'Başlangıç', hint: 'Akışın başladığı yer' },
  { type: 'task', sprite: 'seed', label: 'Görev', hint: 'Tohum → filiz → hasat' },
  { type: 'decision', sprite: 'sign', label: 'Karar', hint: 'Evet / Hayır yol ayrımı' },
  { type: 'note', sprite: 'page', label: 'Not', hint: 'Bir nota bağlanır' },
  { type: 'end', sprite: 'chest', label: 'Bitiş', hint: 'Nakliye sandığı' },
];

export function Palette() {
  const onDragStart = (e: DragEvent, type: FlowNodeType) => {
    e.dataTransfer.setData(NODE_MIME, type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    // Stardew'deki envanter çubuğu gibi: alt ortada yan yana slotlar
    <div className="palette wood" title="Tarlaya sürükle">
      {ITEMS.map((it, i) => (
        <div
          key={it.type}
          className="palette-item"
          draggable
          onDragStart={(e) => onDragStart(e, it.type)}
          title={`${it.label}: ${it.hint}`}
        >
          <span className="slot-num">{i + 1}</span>
          <Sprite name={it.sprite} size={30} />
          <span className="slot-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
