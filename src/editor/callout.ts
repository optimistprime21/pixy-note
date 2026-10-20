import { Node, mergeAttributes } from '@tiptap/react';
import { NodeRange } from '@tiptap/pm/model';
import { findWrapping } from '@tiptap/pm/transform';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /** Seçimi renkli bloğa sarar; zaten bloğun içindeyse sadece rengini değiştirir. */
      setCallout: (color: string) => ReturnType;
      /** Bloğu kaldırıp içeriğini dışarı çıkarır. */
      unsetCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      color: {
        default: 'yellow',
        parseHTML: (el) => el.getAttribute('data-color') ?? 'yellow',
        renderHTML: (attrs) => ({ 'data-color': attrs.color }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '', class: 'callout' }), 0];
  },

  addCommands() {
    return {
      setCallout:
        (color) =>
        ({ editor, commands, state, tr, dispatch }) => {
          if (editor.isActive(this.name)) return commands.updateAttributes(this.name, { color });
          // İçten dışa doğru sarılabilecek ilk seviyeyi ara. Örn. görev maddesinin paragrafı
          // tek başına sarılamaz (madde paragrafla başlamalı), o zaman listenin tamamı sarılır.
          const { $from, $to } = state.selection;
          for (let depth = $from.sharedDepth($to.pos); depth >= 0; depth--) {
            const range = new NodeRange($from, $to, depth);
            const wrapping = findWrapping(range, this.type, { color });
            if (wrapping) {
              if (dispatch) tr.wrap(range, wrapping).scrollIntoView();
              return true;
            }
          }
          return false;
        },
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
