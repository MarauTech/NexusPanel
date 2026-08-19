import React, { useEffect, useRef } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import BrandIcon from '../common/BrandIcon';
import { useServices } from '../../hooks/useServices';
import { useSearch } from '../../hooks/useSearch';

function HighlightText({ text = '', query = '' }) {
  if (!query || !text) return <span>{text}</span>;
  
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-accent/30 text-accent font-bold rounded-sm px-0.5">
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 sm:px-6">
      {/* Blurred VisionOS Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Floating Spotlight Capsule */}
      <div className="relative w-full max-w-2xl glass-card rounded-[28px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-black/[0.08] dark:border-white/20">
        <div className="flex items-center px-5 py-4 border-b border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/5">
          <Search className="w-5 h-5 text-accent mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-base sm:text-lg text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 font-medium tracking-tight"
            placeholder="Szukaj usług, kategorii, tagów, adresów IP... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full glass-pill text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((service, index) => {
                const isSelected = index === selectedIndex;
                const categoryTitle = service.category_name || service.category?.name;
                const serviceColor = service.color || '#6366f1';
                
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
                    className={`flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-150 ${
                      isSelected 
                        ? 'bg-accent/15 border border-accent/30 shadow-sm text-slate-900 dark:text-white' 
                        : 'hover:bg-black/[0.04] dark:hover:bg-white/5 border border-transparent'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {/* Squircle App Icon */}
                    <div 
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden text-white"
                      style={{ 
                        background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}cc 100%)`,
                        boxShadow: `0 4px 12px ${serviceColor}30`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/15 pointer-events-none" />
                      <BrandIcon name={service.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={service.name} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                          <HighlightText text={service.name} query={query} />
                        </span>
                        {categoryTitle && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                            <HighlightText text={categoryTitle} query={query} />
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cleanHost}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          <HighlightText text={service.description} query={query} />
                        </p>
                      )}
                    </div>
                    
                    <ExternalLink className={`w-4 h-4 ${isSelected ? 'text-accent opacity-100' : 'text-slate-400 opacity-0'} transition-opacity`} />
                  </a>
                );
              })}
            </div>
          ) : query ? (
            <div className="p-12 text-center text-slate-500 text-sm space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">Nie znaleziono usług dla zapytania „{query}”</p>
              <p className="text-xs text-slate-400">Spróbuj wyszukać po adresie IP, porcie, kategorii lub tagu.</p>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-4">
              <span><kbd className="px-2 py-1 rounded-md glass-pill font-mono text-[10px] text-slate-800 dark:text-slate-200">↑</kbd> <kbd className="px-2 py-1 rounded-md glass-pill font-mono text-[10px] text-slate-800 dark:text-slate-200">↓</kbd> Wybierz</span>
              <span><kbd className="px-2 py-1 rounded-md glass-pill font-mono text-[10px] text-slate-800 dark:text-slate-200">Enter</kbd> Otwórz</span>
              <span><kbd className="px-2 py-1 rounded-md glass-pill font-mono text-[10px] text-slate-800 dark:text-slate-200">Esc</kbd> Zamknij</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
