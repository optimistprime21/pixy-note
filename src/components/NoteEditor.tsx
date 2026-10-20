import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { Callout } from '../editor/callout';
import { BLOCK_COLORS, HIGHLIGHT_COLORS } from '../editor/colors';
import type { Note } from '../types';
import { useStore } from '../store';
import { askConfirm } from '../ui';
import { play } from '../sound';
import { Sprite } from '../sprites';

/** Araç çubuğunda açılır renk menüsü (dışarı tıklayınca kapanır). */
function ColorMenu({ label, title, active, children }: { label: ReactNode; title: string; active: boolean; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as globalThis.Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="color-menu" ref={ref}>
      <button
        className={`px-btn small${active || open ? ' active' : ''}`}
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        {label} ▾
      </button>
      {open && (
        <div className="color-pop px-panel" onMouseDown={(e) => e.preventDefault()}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function HighlightMenu({ editor }: { editor: Editor }) {
  const current = editor.getAttributes('highlight').color as string | undefined;
  return (
    <ColorMenu
      label={<span className="hl-icon" style={{ background: current ?? HIGHLIGHT_COLORS[0].value }}>A</span>}
      title="Vurgula (Ctrl+Shift+H)"
      active={editor.isActive('highlight')}
    >
      {(close) => (
        <>
          <div className="swatches">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                className={`swatch${current === c.value ? ' current' : ''}`}
                style={{ background: c.value }}
                title={c.name}
                onClick={() => {
                  editor.chain().focus().setHighlight({ color: c.value }).run();
                  close();
                }}
              />
            ))}
          </div>
          <button
            className="px-btn small"
            disabled={!editor.isActive('highlight')}
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              close();
            }}
          >
            Vurguyu kaldır
          </button>
        </>
      )}
    </ColorMenu>
  );
}

function BlockMenu({ editor }: { editor: Editor }) {
  const inBlock = editor.isActive('callout');
  const current = inBlock ? (editor.getAttributes('callout').color as string) : undefined;
  return (
    <ColorMenu label="▣ Blok" title="Renkli blok" active={inBlock}>
      {(close) => (
        <>
          <div className="block-options">
            {BLOCK_COLORS.map((c) => (
              <button
                key={c.id}
                className={`block-option${current === c.id ? ' current' : ''}`}
                data-color={c.id}
                onClick={() => {
                  editor.chain().focus().setCallout(c.id).run();
                  close();
                }}
              >
                <span className="swatch small" style={{ background: c.swatch }} />
                {c.name}
              </button>
            ))}
          </div>
          <button
            className="px-btn small"
            disabled={!inBlock}
            onClick={() => {
              editor.chain().focus().unsetCallout().run();
              close();
            }}
          >
            Bloğu kaldır
          </button>
        </>
      )}
    </ColorMenu>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (label: string, title: string, active: boolean, run: () => void) => (
    <button
      key={title}
      className={`px-btn small${active ? ' active' : ''}`}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );
  const c = () => editor.chain().focus();
  return (
    <div className="editor-toolbar">
      {btn('B', 'Kalın (Ctrl+B)', editor.isActive('bold'), () => c().toggleBold().run())}
      {btn('I', 'İtalik (Ctrl+I)', editor.isActive('italic'), () => c().toggleItalic().run())}
      {btn('S', 'Üstü çizili', editor.isActive('strike'), () => c().toggleStrike().run())}
      <HighlightMenu editor={editor} />
      <span className="sep" />
      {btn('H1', 'Başlık 1', editor.isActive('heading', { level: 1 }), () => c().toggleHeading({ level: 1 }).run())}
      {btn('H2', 'Başlık 2', editor.isActive('heading', { level: 2 }), () => c().toggleHeading({ level: 2 }).run())}
      <span className="sep" />
      {btn('• Liste', 'Madde listesi', editor.isActive('bulletList'), () => c().toggleBulletList().run())}
      {btn('1. Liste', 'Numaralı liste', editor.isActive('orderedList'), () => c().toggleOrderedList().run())}
      {btn('☑ Görev', 'Görev listesi', editor.isActive('taskList'), () => c().toggleTaskList().run())}
      <span className="sep" />
      <BlockMenu editor={editor} />
      {btn('❝', 'Alıntı', editor.isActive('blockquote'), () => c().toggleBlockquote().run())}
      {btn('</>', 'Kod bloğu', editor.isActive('codeBlock'), () => c().toggleCodeBlock().run())}
      {btn('—', 'Ayraç', false, () => c().setHorizontalRule().run())}
    </div>
  );
}

export function NoteEditor({ note }: { note: Note }) {
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);
  const open = useStore((s) => s.open);
  const boards = useStore((s) => s.data.boards);
  const usedIn = boards.filter((b) => b.nodes.some((n) => n.type === 'note' && n.data.noteId === note.id));

  // Yazarken her tuşta store'u güncellememek için kısa gecikme
  const timer = useRef<number>();
  const flush = useRef<() => void>();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Bugün çiftlikte neler oldu?' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Callout,
    ],
    content: note.content ?? '',
    autofocus: note.text === '' ? 'end' : false,
    onUpdate: ({ editor }) => {
      flush.current = () => updateNote(note.id, { content: editor.getJSON(), text: editor.getText({ blockSeparator: ' ' }) });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        flush.current?.();
        flush.current = undefined;
      }, 300);
    },
  });

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      flush.current?.();
    },
    [],
  );

  return (
    <div className="note-view">
      <header className="doc-header">
        <input
          className="title-input"
          value={note.title}
          placeholder="Not başlığı"
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && editor?.commands.focus('start')}
        />
        <span className="hint">Son düzenleme: {new Date(note.updatedAt).toLocaleString('tr-TR')}</span>
        <button
          className="px-btn danger"
          onClick={async () => {
            if (await askConfirm('Notu sil', `“${note.title || 'Adsız not'}” kalıcı olarak silinecek.`)) {
              deleteNote(note.id);
              play('remove');
            }
          }}
        >
          Sil
        </button>
      </header>
      {editor && <Toolbar editor={editor} />}
      <div className="paper" onClick={() => editor?.isEmpty && editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
      {usedIn.length > 0 && (
        <footer className="backlinks">
          <Sprite name="sprout" size={20} /> Bu not şu tarlalarda kullanılıyor:
          {usedIn.map((b) => (
            <button key={b.id} className="px-btn small" onClick={() => open({ kind: 'board', id: b.id })}>
              {b.title || 'Adsız tarla'}
            </button>
          ))}
        </footer>
      )}
    </div>
  );
}
