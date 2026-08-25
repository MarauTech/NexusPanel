import React, { useEffect, useRef } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import BrandIcon from '../common/BrandIcon';
import { useServices } from '../../hooks/useServices';
import { useSearch } from '../../hooks/useSearch';
import { useLanguage } from '../../contexts/LanguageContext';

function HighlightText({ text = '', query = '' }) {
  if (!query || !text) return <span>{text}</span>;
  
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-blue-500/20 text-blue-400 font-semibold rounded-sm px-0.5">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function SearchModal({ isOpen, onClose }) {
  const { services } = useServices();
  const { query, setQuery, results } = useSearch(services);
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 20);
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, setQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const service = results[selectedIndex];
      if (service) {
        if (service.open_new_tab === 1 || service.openInNewTab !== false) {
          window.open(service.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = service.url;
        }
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 sm:px-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />
      
      {/* Solid Technical Search Spotlight */}
      <div className="relative w-full max-w-2xl bg-[#141b27] rounded-lg overflow-hidden shadow-2xl animate-in fade-in duration-150 border border-[#1d2635]">
        <div className="flex items-center px-4 py-3 border-b border-[#1c2534] bg-[#111622]">
          <Search className="w-4 h-4 text-blue-400 mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-sm text-slate-100 focus:outline-none placeholder-slate-500 font-normal font-mono"
            placeholder={t('header.search', 'Szukaj usług, kategorii, tagów, adresów IP... (Ctrl+K)')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-1">
          {results.length > 0 ? (
            <div>
              {results.map((service, index) => {
                const isSelected = index === selectedIndex;
                const categoryTitle = service.category_name || service.category?.name;
                
                let cleanHost = '';
                try {
                  cleanHost = new URL(service.url).host;
                } catch(e) {
                  cleanHost = service.url;
                }

                return (
                  <a
                    key={service.id}
                    href={service.url}
                    target={service.open_new_tab === 1 || service.openInNewTab !== false ? "_blank" : "_self"}
                    rel="noreferrer"
                    onClick={() => onClose()}
                    className={`flex items-center gap-3 p-2.5 rounded-md transition-colors text-xs ${
                      isSelected 
                        ? 'bg-[#1c2534] border border-[#2b394f] text-slate-100' 
                        : 'hover:bg-[#18202d] border border-transparent text-slate-300'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {/* Brand Icon (Matches ServiceCard) */}
                    <div className="w-8 h-8 rounded-md bg-[#192231] border border-[#222d41] flex items-center justify-center flex-shrink-0">
                      <BrandIcon name={service.icon} className="w-4 h-4" fallbackText={service.name} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-slate-100">
                          <HighlightText text={service.name} query={query} />
                        </span>
                        {categoryTitle && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            [<HighlightText text={categoryTitle} query={query} />]
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {cleanHost}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          <HighlightText text={service.description} query={query} />
                        </p>
                      )}
                    </div>
                    
                    <ExternalLink className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400 opacity-100' : 'text-slate-500 opacity-0'} transition-opacity`} />
                  </a>
                );
              })}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p className="font-medium text-slate-300">{t('scanner.no_results', `Nie znaleziono wyników dla "${query}"`)}</p>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-4 font-mono">
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#18202d] border border-[#222d41] text-[10px] text-slate-300">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-[#18202d] border border-[#222d41] text-[10px] text-slate-300">↓</kbd> Nawiguj</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#18202d] border border-[#222d41] text-[10px] text-slate-300">Enter</kbd> Otwórz</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#18202d] border border-[#222d41] text-[10px] text-slate-300">Esc</kbd> Zamknij</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
