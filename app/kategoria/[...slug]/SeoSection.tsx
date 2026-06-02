'use client';

import React from 'react';

const parseMarkdown = (text: string) => {
  if (!text) return '';
  let html = text.replace(/^## (.*$)/gim, '<h2 class="text-xl lg:text-2xl font-black mt-8 mb-4 text-slate-900">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-red-600 hover:underline font-bold">$1</a>');
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-5 list-disc marker:text-red-600 mb-2">$1</li>');
  html = html.replace(/\n\n/gim, '<br /><br />');
  return html;
};

export default function SeoSection({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mt-24 pt-12 border-t border-slate-200">
      <div 
        className="prose prose-slate max-w-none text-sm lg:text-base text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
      />
    </div>
  );
}