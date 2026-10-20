import { memo } from 'react';

// Tüm pikselart burada, karakter haritası olarak çizildi (oyundan alınmış görsel yok).
// '.' = şeffaf, diğer harfler PALETTE'teki renkler.
const PALETTE: Record<string, string> = {
  k: '#3b2314', // dış hat
  b: '#8b5a2b', // kahve
  B: '#c68642', // açık kahve
  g: '#3f8a34', // yeşil
  G: '#7ccf4f', // açık yeşil
  y: '#f2c94c', // sarı
  o: '#e07b39', // turuncu
  w: '#fff6dc', // krem
  p: '#f4e4bc', // parşömen
  r: '#c0392b', // kırmızı
};

const SPRITES = {
  seed: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '.....kk.....',
    '....kBBk....',
    '...kBbybk...',
    '..kbbbbbbk..',
    '.kkkkkkkkkk.',
    '............',
  ],
  sprout: [
    '............',
    '............',
    '.....G......',
    '....GgG.GG..',
    '.....gGGg...',
    '......g.....',
    '.....kgk....',
    '....kBgBk...',
    '...kBbbBk...',
    '..kbbbbbbk..',
    '.kkkkkkkkkk.',
    '............',
  ],
  crop: [
    '....G..G....',
    '...GgG.gG...',
    '....gGGg....',
    '.....gg.....',
    '....kyyk....',
    '...kyyyyk...',
    '...kywyyk...',
    '...kyyyok...',
    '....kyyk....',
    '....kyok....',
    '.....kk.....',
    '............',
  ],
  chest: [
    '............',
    '..kkkkkkkk..',
    '.kBBBBBBBBk.',
    '.kbbbbbbbbk.',
    '.kkkkkkkkkk.',
    '.kBBBkkBBBk.',
    '.kbbbyybbbk.',
    '.kBBBkkBBBk.',
    '.kbbbbbbbbk.',
    '.kBBBBBBBBk.',
    '.kkkkkkkkkk.',
    '............',
  ],
  sign: [
    '............',
    '.kkkkkkkkkk.',
    '.kBBBBBBBBk.',
    '.kBBkkkBBBk.',
    '.kBBBBBkBBk.',
    '.kBBBBkkBBk.',
    '.kBBBBBBBBk.',
    '.kkkkkkkkkk.',
    '.....bb.....',
    '.....bb.....',
    '....kbbk....',
    '...gGgGgg...',
  ],
  page: [
    '..kkkkkkk...',
    '..kpppppkk..',
    '..kpppppkpk.',
    '..kpkkkpkkk.',
    '..kpppppppk.',
    '..kpkkkkkpk.',
    '..kpppppppk.',
    '..kpkkkkkpk.',
    '..kpppppppk.',
    '..kpkkkpppk.',
    '..kpppppppk.',
    '..kkkkkkkkk.',
  ],
  sun: [
    '.....yy.....',
    '.y...yy...y.',
    '..y.yyyy.y..',
    '...yyyyyy...',
    '..yyyoyyyy..',
    'yyyyoyyyyyyy',
    'yyyyyyyyoyyy',
    '..yyyyyoyy..',
    '...yyyyyy...',
    '..y.yyyy.y..',
    '.y...yy...y.',
    '.....yy.....',
  ],
  coin: [
    '...kkkk...',
    '.kkyyyykk.',
    '.kywyyyyk.',
    'kywyyyyyok',
    'kyyyyyyyok',
    'kyyyyyyyok',
    'kyyyyyyook',
    '.kyyyyook.',
    '.kkooookk.',
    '...kkkk...',
  ],
  heart: [
    '.kk...kk.',
    'krrk.krrk',
    'krwrkrrrk',
    'krrrrrrrk',
    '.krrrrrk.',
    '..krrrk..',
    '...krk...',
    '....k....',
  ],
} as const;

export type SpriteName = keyof typeof SPRITES;

interface Props {
  name: SpriteName;
  size?: number;
  className?: string;
}

export const Sprite = memo(function Sprite({ name, size = 24, className }: Props) {
  const rows = SPRITES[name];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const rects = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x];
      if (c !== '.') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[c]} />);
    }
  }
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  );
});
