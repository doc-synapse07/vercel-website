"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Eraser,
} from "lucide-react";

/**
 * Simple rich-text editor for non-technical admins. Toolbar buttons apply
 * formatting via the built-in browser editing commands — no HTML knowledge
 * needed. The produced HTML is synced into a hidden input so the existing
 * server-action form flow is unchanged.
 */
export function DescriptionEditor({ defaultValue }: { defaultValue: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [empty, setEmpty] = useState(() => stripTags(defaultValue).length === 0);

  function stripTags(html: string) {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }

  function syncHidden() {
    const html = editorRef.current?.innerHTML ?? "";
    if (hiddenRef.current) hiddenRef.current.value = html;
    setEmpty(stripTags(html).length === 0);
  }

  function run(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncHidden();
  }

  function addLink() {
    const url = window.prompt("Link address (https://…)", "https://");
    if (!url) return;
    run("createLink", url);
  }

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900";
  const sep = <span aria-hidden className="mx-0.5 h-5 w-px bg-ink-200" />;

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Formatting options"
        className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-ink-300 bg-ink-50 px-2 py-1.5"
        onMouseDown={(e) => e.preventDefault()}
      >
        <button type="button" title="Bold" aria-label="Bold" className={btn} onClick={() => run("bold")}>
          <Bold size={15} />
        </button>
        <button type="button" title="Italic" aria-label="Italic" className={btn} onClick={() => run("italic")}>
          <Italic size={15} />
        </button>
        <button type="button" title="Underline" aria-label="Underline" className={btn} onClick={() => run("underline")}>
          <Underline size={15} />
        </button>
        <button type="button" title="Strikethrough" aria-label="Strikethrough" className={btn} onClick={() => run("strikeThrough")}>
          <Strikethrough size={15} />
        </button>
        {sep}
        <button type="button" title="Heading" aria-label="Heading" className={btn} onClick={() => run("formatBlock", "h3")}>
          <Heading2 size={15} />
        </button>
        <button type="button" title="Sub-heading" aria-label="Sub-heading" className={btn} onClick={() => run("formatBlock", "h4")}>
          <Heading3 size={15} />
        </button>
        {sep}
        <button type="button" title="Bullet list" aria-label="Bullet list" className={btn} onClick={() => run("insertUnorderedList")}>
          <List size={15} />
        </button>
        <button type="button" title="Numbered list" aria-label="Numbered list" className={btn} onClick={() => run("insertOrderedList")}>
          <ListOrdered size={15} />
        </button>
        {sep}
        <button type="button" title="Add link" aria-label="Add link" className={btn} onClick={addLink}>
          <Link2 size={15} />
        </button>
        <button type="button" title="Clear formatting" aria-label="Clear formatting" className={btn} onClick={() => run("removeFormat")}>
          <Eraser size={15} />
        </button>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncHidden}
          onBlur={syncHidden}
          dangerouslySetInnerHTML={{ __html: defaultValue }}
          aria-label="Full description"
          className="rich-text min-h-[180px] rounded-b-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-100 [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:pl-5"
        />
        {empty && (
          <span className="pointer-events-none absolute left-3.5 top-2.5 text-sm text-ink-400">
            Write what&apos;s inside — select text and use the toolbar to format it…
          </span>
        )}
      </div>

      <input ref={hiddenRef} type="hidden" name="description" defaultValue={defaultValue} />
    </div>
  );
}
