'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Heading1, Heading2, ImageIcon, Italic, LinkIcon, List, ListOrdered, Undo2, Redo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? 'Schrijf je verhaal…' }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none focus:outline-none min-h-[280px] text-slate-800',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string;
    const url = window.prompt('Voer een URL in', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  const triggerImageUpload = () => fileInputRef.current?.click();

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) return;
      const file = event.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
        const path = `blog-images/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (error) {
        console.error('Failed to upload image', error);
        alert('Uploaden van afbeelding mislukt. Probeer het opnieuw.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [editor]
  );

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
    label,
    disabled,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: typeof Bold;
    label: string;
    disabled?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-9 w-9 p-0 text-slate-600 hover:text-primary',
        isActive && 'bg-primary/10 text-primary'
      )}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          label="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          label="Opsomming"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Genummerde lijst"
        />
        <ToolbarButton onClick={setLink} icon={LinkIcon} label="Link" />
        <ToolbarButton
          onClick={triggerImageUpload}
          icon={ImageIcon}
          label="Afbeelding"
          disabled={isUploading}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          icon={Undo2}
          label="Ongedaan maken"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          icon={Redo2}
          label="Opnieuw"
        />
        {isUploading && <span className="text-xs text-primary">Uploaden…</span>}
      </div>
      <div className="max-h-[420px] overflow-y-auto px-4 py-3">
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
