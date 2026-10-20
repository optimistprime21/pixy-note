// Parşömen zemin üzerinde okunaklı kalan, fosforlu kalem tonları
export const HIGHLIGHT_COLORS = [
  { id: 'yellow', name: 'Sarı', value: '#ffe066' },
  { id: 'green', name: 'Yeşil', value: '#b8e986' },
  { id: 'blue', name: 'Mavi', value: '#a8d8ff' },
  { id: 'pink', name: 'Pembe', value: '#ffb3d1' },
  { id: 'orange', name: 'Turuncu', value: '#ffc78a' },
  { id: 'purple', name: 'Mor', value: '#d4b8ff' },
] as const;

// Blokların zemin/kenar renkleri app.css'te [data-color] ile tanımlı; swatch burada
export const BLOCK_COLORS = [
  { id: 'yellow', name: 'Sarı', swatch: '#f2c94c' },
  { id: 'green', name: 'Yeşil', swatch: '#7ccf4f' },
  { id: 'blue', name: 'Mavi', swatch: '#5aa9e6' },
  { id: 'pink', name: 'Pembe', swatch: '#e58fb4' },
  { id: 'orange', name: 'Turuncu', swatch: '#e8904a' },
  { id: 'purple', name: 'Mor', swatch: '#a286e0' },
] as const;
