import React, { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Eye, Edit3 } from 'lucide-react';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Write formatted description here...',
  helperText,
  minHeight = '150px',
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertTag = (tagOpen: string, tagClose: string) => {
    const textarea = document.getElementById(`rich-textarea-${label}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${tagOpen}${selectedText || 'text'}${tagClose}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, end + tagOpen.length);
    }, 50);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
          {label}
        </label>
        <div className="flex rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeTab === 'write'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <Edit3 className="h-3 w-3" /> Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <Eye className="h-3 w-3" /> Preview
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
        {/* Formatting Toolbar */}
        {activeTab === 'write' && (
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900 px-3 py-1.5 text-slate-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => insertTag('**', '**')}
              className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              title="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTag('*', '*')}
              className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              title="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-1" />
            <button
              type="button"
              onClick={() => insertTag('\n- ', '')}
              className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              title="Bullet List"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTag('\n1. ', '')}
              className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              title="Numbered List"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTag('\n> ', '')}
              className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              title="Blockquote"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {activeTab === 'write' ? (
          <textarea
            id={`rich-textarea-${label}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full bg-transparent p-3.5 text-xs text-slate-900 dark:text-white outline-none resize-y leading-relaxed font-sans"
          />
        ) : (
          <div
            style={{ minHeight }}
            className="p-4 text-xs text-slate-800 dark:text-zinc-200 prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed"
          >
            {value || <span className="text-slate-400 italic">No formatted content entered.</span>}
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">{helperText}</p>
      )}
    </div>
  );
};
