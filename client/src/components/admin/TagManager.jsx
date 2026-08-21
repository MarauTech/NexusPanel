import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Trash2, Tag, Edit2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ColorPicker from '../common/ColorPicker';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const PRESET_TAG_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'
];

export default function TagManager() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' });
  const [formLoading, setFormLoading] = useState(false);
  const { addToast } = useToast();
  const { t } = useLanguage();

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await api.tags.getTags();
      setTags(res.data);
    } catch (err) {
      addToast(t('common.error', 'Nie udało się pobrać listy tagów'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleOpenAdd = () => {
    const randomColor = PRESET_TAG_COLORS[Math.floor(Math.random() * PRESET_TAG_COLORS.length)];
    setFormData({ name: '', color: randomColor });
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast(t('tags.name_label', 'Wprowadź nazwę tagu'), 'error');
      return;
    }

    setFormLoading(true);
    try {
      await api.tags.createTag({
        name: formData.name.trim().toLowerCase().replace(/^#/, ''),
        color: formData.color
      });
      addToast(t('common.saved', `Utworzono tag #${formData.name}`), 'success');
      setIsAddOpen(false);
      setFormData({ name: '', color: '#6366f1' });
      fetchTags();
    } catch (err) {
      addToast(err.response?.data?.error || t('common.error', 'Taki tag już istnieje'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.tags.deleteTag(deleteConfirm.id);
      addToast(t('common.saved', `Usunięto tag #${deleteConfirm.name}`), 'success');
      fetchTags();
    } catch (err) {
      addToast(t('common.error', 'Błąd podczas usuwania tagu'), 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatCount = (count) => {
    return t('tags.services_count', `${count || 0} powiązanych usług`).replace('{count}', count || 0);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">{t('common.loading', 'Ładowanie tagów...')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('tags.title', 'Zarządzanie Tagami')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('tags.subtitle', 'Filtruj i organizuj usługi za pomocą kolorowych etykiet.')}
          </p>
        </div>
        <Button icon={Plus} onClick={handleOpenAdd} className="shadow-lg shadow-accent/25 text-xs font-bold">
          {t('tags.btn_add', '+ Dodaj tag')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {tags.map((tag, idx) => {
          const tagColor = tag.color || PRESET_TAG_COLORS[idx % PRESET_TAG_COLORS.length];
          return (
            <div 
              key={tag.id} 
              className="glass-card rounded-2xl p-3.5 flex items-center justify-between hover:border-black/[0.15] dark:hover:border-white/20 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: tagColor }} />
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate block">
                    #{tag.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {formatCount(tag.usage_count)}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setDeleteConfirm(tag)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={t('common.delete', 'Usuń')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {tags.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-black/[0.1] dark:border-white/15 rounded-[24px] glass-card p-6">
            <p className="font-bold text-base text-slate-900 dark:text-white mb-1">
              {t('tags.no_tags', 'Brak utworzonych tagów')}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {t('tags.no_tags_desc', 'Tagi pozwalają przypisywać własne etykiety, np. #docker, #media czy #smart-home.')}
            </p>
            <Button icon={Plus} size="sm" onClick={handleOpenAdd}>
              {t('tags.add_first', '+ Dodaj pierwszy tag')}
            </Button>
          </div>
        )}
      </div>

      {isAddOpen && (
        <Modal title={t('tags.add_title', '+ Utwórz nowy tag')} onClose={() => setIsAddOpen(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <Input 
              label={t('tags.name_label', 'Nazwa tagu')} 
              value={formData.name} 
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
              required 
              placeholder={t('tags.name_placeholder', 'np. docker, backup, dmz, multimedia')}
              autoFocus
            />
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
                {t('tags.color_label', 'Kolor tagu')}
              </label>
              <ColorPicker color={formData.color} onChange={c => setFormData(prev => ({ ...prev, color: c }))} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-black/[0.06] dark:border-white/10">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
                {t('common.cancel', 'Anuluj')}
              </Button>
              <Button type="submit" isLoading={formLoading}>
                {t('tags.create_btn', 'Utwórz tag')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={t('tags.delete_title', `Usunąć tag "#${deleteConfirm.name}"?`).replace('{name}', deleteConfirm.name)}
          message={t('tags.delete_msg', 'Tag zostanie odpięty od powiązanych usług. Same usługi nie zostaną skasowane.')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
