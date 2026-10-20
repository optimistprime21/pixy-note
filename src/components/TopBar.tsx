import { useEffect, useState } from 'react';
import { useSeason, useStore } from '../store';
import { Sprite } from '../sprites';
import type { Season, Settings } from '../types';
import { play } from '../sound';

export const SEASON_NAMES: Record<Season, string> = {
  spring: 'İlkbahar',
  summer: 'Yaz',
  fall: 'Sonbahar',
  winter: 'Kış',
};
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const GOLD_PER_HARVEST = 50;

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export function TopBar() {
  const now = useNow();
  const season = useSeason();
  const settings = useStore((s) => s.data.settings);
  const setSettings = useStore((s) => s.setSettings);
  const gold = useStore(
    (s) =>
      s.data.boards.reduce(
        (sum, b) => sum + b.nodes.filter((n) => n.type === 'task' && n.data.status === 'harvest').length,
        0,
      ) * GOLD_PER_HARVEST,
  );

  const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="topbar wood">
      <div className="brand">
        <Sprite name="crop" size={30} />
        <span>Pixy Note</span>
      </div>

      <div className="clock px-panel" title={now.toLocaleDateString('tr-TR', { dateStyle: 'full' })}>
        <span>
          {DAYS[now.getDay()]}. {now.getDate()}
        </span>
        <span className="clock-season">{SEASON_NAMES[season]}</span>
        <span>{time}</span>
      </div>

      <div className="gold px-panel" title={`Hasat edilen her görev ${GOLD_PER_HARVEST}g`}>
        <Sprite name="coin" size={20} />
        <span>{gold.toLocaleString('tr-TR')}g</span>
      </div>

      <div className="spacer" />

      <label className="setting">
        Mevsim
        <select
          value={settings.season}
          onChange={(e) => {
            setSettings({ season: e.target.value as Settings['season'] });
            play('click');
          }}
        >
          <option value="auto">Otomatik</option>
          {Object.entries(SEASON_NAMES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <button
        className={`px-btn small${settings.effects ? ' active' : ''}`}
        title="Mevsim efektleri (yaprak, kar…)"
        onClick={() => setSettings({ effects: !settings.effects })}
      >
        ✦ Efekt
      </button>
      <button
        className={`px-btn small${settings.sound ? ' active' : ''}`}
        title="Ses efektleri"
        onClick={() => {
          setSettings({ sound: !settings.sound });
          if (!settings.sound) setTimeout(() => play('pop'));
        }}
      >
        {settings.sound ? '♪ Ses' : '♪ Kapalı'}
      </button>
    </header>
  );
}
