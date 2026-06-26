'use client';

import React from 'react';

const parseMarkdown = (text: string) => {
  if (!text) return '';
  let html = text;

  // Nagłówki: ### -> h3, ## -> h2, # -> h2 (traktujemy # jak duży nagłówek sekcji)
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg lg:text-xl font-black mt-6 mb-3 text-slate-900">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl lg:text-2xl font-black mt-8 mb-4 text-slate-900">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-2xl lg:text-3xl font-black mt-8 mb-4 text-slate-900">$1</h2>');

  // Pogrubienie
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900">$1</strong>');

  // Linki
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-red-600 hover:underline font-bold">$1</a>');

  // Listy punktowane (* ...) - grupowanie w <ul>
  const bulletRegex = /(?:^\* .*$\n?)+/gim;
  html = html.replace(bulletRegex, (match) => {
    const items = match.replace(/^\* (.*$)/gim, '<li class="ml-5 list-disc marker:text-red-600 mb-2">$1</li>');
    return `<ul class="mb-4 pl-2 space-y-1">\n${items}</ul>\n`;
  });

  // Listy numerowane (1. 2. 3. ...) - grupowanie w <ol>
  const numberedRegex = /(?:^\d+\. .*$\n?)+/gim;
  html = html.replace(numberedRegex, (match) => {
    const items = match.replace(/^\d+\. (.*$)/gim, '<li class="ml-5 list-decimal marker:text-red-600 marker:font-bold mb-2">$1</li>');
    return `<ol class="mb-4 pl-2 space-y-1">\n${items}</ol>\n`;
  });

  // Podwójny enter -> akapit (ale nie wewnątrz list/nagłówków)
  html = html.replace(/\n\n+/gim, '<br /><br />');

  return html;
};

export default function SeoSection({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="max-w-7xl mx-auto px-6 mt-16 lg:mt-24 pt-12 pb-8 border-t border-slate-200">
      <div
        className="prose prose-slate max-w-none text-sm lg:text-base text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
      />
    </div>
  );
}