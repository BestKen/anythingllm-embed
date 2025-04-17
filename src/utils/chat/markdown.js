import { encode as HTMLEncode } from "he";
import markdownIt from "markdown-it";
import { staticHljs as hljs } from "./hljs";
import { v4 } from "uuid";

const markdown = markdownIt({
  html: false,
  typographer: true,
  highlight: function (code, lang) {
    const uuid = v4();
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          `<div class="whitespace-pre-line w-full rounded-lg bg-black-900 pb-4 relative font-mono font-normal text-sm text-slate-200">
          <div class="w-full flex items-center absolute top-0 left-0 text-slate-200 bg-stone-800 px-4 py-2 text-xs font-sans justify-between rounded-t-md">
            <div class="flex gap-2"><code class="text-xs">${lang}</code></div>
            <button data-code-snippet data-code="code-${uuid}" class="flex items-center gap-x-2">
              <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              <p>Copy</p>
            </button>
          </div>
        <pre class="whitespace-pre-wrap px-2">` +
          hljs.highlight(code, { language: lang, ignoreIllegals: true }).value +
          "</pre></div>"
        );
      } catch (__) { }
    }

    return (
      `<div class="whitespace-pre-line w-full rounded-lg bg-black-900 pb-4 relative font-mono font-normal text-sm text-slate-200">
        <div class="w-full flex items-center absolute top-0 left-0 text-slate-200 bg-stone-800 px-4 py-2 text-xs font-sans justify-between rounded-t-md">
          <div class="flex gap-2"><code class="text-xs"></code></div>
          <button data-code-snippet data-code="code-${uuid}" class="flex items-center gap-x-2">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            <p>Copy</p>
          </button>
        </div>
      <pre class="whitespace-pre-wrap px-2">` +
      HTMLEncode(code) +
      "</pre></div>"
    );
  },
})
  // Enable <ol> and <ul> items to not assume an HTML structure so we can keep numbering from responses.
  .disable("list");

// Configure renderer to add target="_blank" to all links
const defaultRender = markdown.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

markdown.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // Add target="_blank" attribute to all links
  const aIndex = tokens[idx].attrIndex('target');
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']); // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank'; // replace value of existing attribute
  }

  // Add rel="noopener noreferrer" for security
  const relIndex = tokens[idx].attrIndex('rel');
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']); // add new attribute
  } else {
    tokens[idx].attrs[relIndex][1] = 'noopener noreferrer'; // replace value of existing attribute
  }

  // pass token to default renderer
  return defaultRender(tokens, idx, options, env, self);
};

export default function renderMarkdown(text = "") {
  return markdown.render(text);
}
