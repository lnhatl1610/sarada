import { useEffect } from 'react'
import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useTranslation } from 'react-i18next'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  invalid?: boolean
}

export function RichTextField({ value, onChange, disabled = false, ariaLabel, ariaDescribedBy, invalid = false }: Props) {
  const { t } = useTranslation()
  const resolvedAriaLabel = ariaLabel ?? t('Mô tả chi tiết sản phẩm')
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        'aria-label': resolvedAriaLabel,
        ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
        'aria-invalid': String(invalid),
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  if (!editor) return <div className="reference-rich-editor-loading" role="status">{t('Đang tải trình soạn thảo…')}</div>

  return <div className="reference-rich-editor">
    <div className="reference-rich-editor-toolbar" role="toolbar" aria-label={t('Định dạng mô tả sản phẩm')}>
      <button type="button" aria-label={t('In đậm')} aria-pressed={editor.isActive('bold')} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></button>
      <button type="button" aria-label={t('In nghiêng')} aria-pressed={editor.isActive('italic')} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></button>
      <button type="button" aria-label={t('Danh sách dấu đầu dòng')} aria-pressed={editor.isActive('bulletList')} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></button>
      <button type="button" aria-label={t('Danh sách đánh số')} aria-pressed={editor.isActive('orderedList')} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></button>
      <button type="button" aria-label={t('Hoàn tác')} disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></button>
      <button type="button" aria-label={t('Làm lại')} disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></button>
    </div>
    <EditorContent editor={editor} />
  </div>
}
