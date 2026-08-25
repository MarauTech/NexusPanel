import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Save, FileText } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function ScratchpadWidget() {
  const [notes, setNotes] = useState('');
  const [sshCommands, setSshCommands] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchScratchpad = async () => {
    try {
      const res = await api.widgets.getScratchpad();
      setNotes(res.data?.notes || '');
      setSshCommands(res.data?.ssh || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchScratchpad();
  }, []);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    addToast('Skopiowano komendę do schowka!', 'success');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await api.widgets.updateScratchpad({ notes, ssh: sshCommands });
      addToast('Notatnik zapisany!', 'success');
    } catch (e) {
      addToast('Nie udało się zapisać notatnika', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WidgetCard
      title="Notatnik & Skróty SSH"
      icon={Terminal}
      badge="Homelab Notes"
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      onRefresh={fetchScratchpad}
    >
      <div className="space-y-3">
        {/* Notes Textarea */}
        <div className="relative">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Szybkie notatki (IP, porty, TODO)..."
            rows={3}
            className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-border/60 focus:border-accent rounded-xl p-2.5 text-xs font-mono text-text-primary focus:outline-none resize-none"
          />
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={saving}
            className="absolute bottom-2.5 right-2.5 p-1 rounded-md bg-accent text-white hover:bg-accent-hover text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
            title="Zapisz notatki"
          >
            <Save className="w-3 h-3" />
            <span>Zapisz</span>
          </button>
        </div>

        {/* 1-click SSH snippets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
            Szybkie komendy SSH:
          </span>
          <div className="space-y-1">
            {sshCommands.map((cmd, idx) => (
              <div 
                key={idx}
                onClick={() => handleCopy(cmd, idx)}
                className="flex items-center justify-between p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] hover:bg-accent/10 border border-border/40 hover:border-accent/40 text-xs font-mono text-text-primary cursor-pointer transition-all group"
              >
                <span className="truncate pr-2">{cmd}</span>
                {copiedIdx === idx ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
