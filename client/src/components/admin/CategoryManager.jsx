import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, GripVertical, Edit2, Trash2, Folder } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import Input from '../common/Input';
import ColorPicker from '../common/ColorPicker';
import IconPicker from '../common/IconPicker';
import BrandIcon from '../common/BrandIcon';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

function SortableCategory({ id, category, onEdit, onDelete, t }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const catColor = category.color || '#6366f1';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3.5 p-3.5 rounded-2xl glass-card transition-all ${
        isDragging 
          ? 'shadow-2xl border-accent opacity-90 scale-[1.02]' 
          : 'hover:border-black/[0.15] dark:hover:border-white/20'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 -ml-1">
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div 
        className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden text-white" 
        style={{ 
          background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}cc 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/15 pointer-events-none" />
        <BrandIcon name={category.icon || 'folder'} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={category.name} />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="font-extrabold text-sm text-slate-900 dark:text-white block truncate">{category.name}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {category.service_count !== undefined 
            ? t('categories.services_count', `${category.service_count} przypisanych usług`).replace('{count}', category.service_count)
            : t('form.category', 'Kategoria')}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onEdit(category)} 
          className="p-2 text-slate-400 hover:text-accent hover:bg-black/[0.04] dark:hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title={t('common.edit', 'Edytuj')}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(category)} 
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title={t('common.delete', 'Usuń')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const { categories, loading, refresh } = useCategories();
  const { t } = useLanguage();
  const [localItems, setLocalItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    icon: 'folder',
    color: '#6366f1'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    setLocalItems(categories);
  }, [categories]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex(item => item.id === active.id);
    const newIndex = localItems.findIndex(item => item.id === over.id);

    const reordered = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(reordered);

    try {
      const itemsPayload = reordered.map((item, index) => ({ id: item.id, sort_order: index }));
      await api.categories.reorderCategories({ items: itemsPayload });
      addToast(t('common.saved', 'Zaktualizowano kolejność kategorii'), 'success');
      refresh();
    } catch (err) {
      addToast(t('common.error', 'Nie udało się zapisać kolejności'), 'error');
      setLocalItems(categories);
    }
  };

  const handleOpenAdd = () => {
    setEditingCat(null);
    setFormData({ name: '', icon: 'folder', color: '#6366f1' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, icon: cat.icon || 'folder', color: cat.color || '#6366f1' });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast(t('categories.name_label', 'Nazwa kategorii jest wymagana'), 'error');
      return;
    }

    try {
      if (editingCat) {
        await api.categories.updateCategory(editingCat.id, formData);
        addToast(t('common.saved', `Zaktualizowano kategorię "${formData.name}"`), 'success');
      } else {
        await api.categories.createCategory(formData);
        addToast(t('common.saved', `Utworzono kategorię "${formData.name}"`), 'success');
      }
      setIsFormOpen(false);
      refresh();
    } catch (err) {
      addToast(err.response?.data?.error || t('common.error', 'Błąd zapisywania kategorii'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.categories.deleteCategory(deleteConfirm.id);
      addToast(t('common.saved', `Usunięto kategorię "${deleteConfirm.name}"`), 'success');
      refresh();
    } catch (err) {
      addToast(t('common.error', 'Nie udało się usunąć kategorii'), 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">{t('common.loading', 'Ładowanie kategorii...')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('categories.title', 'Zarządzanie Kategoriami')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('categories.subtitle', 'Grupuj kafelki w sekcje (np. Infrastruktura, Smart Home, Media).')}
          </p>
        </div>
        <Button icon={Plus} onClick={handleOpenAdd} className="shadow-lg shadow-accent/25 text-xs font-bold">
          {t('categories.btn_add', '+ Dodaj kategorię')}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {localItems.map(category => (
              <SortableCategory
                key={category.id}
                id={category.id}
                category={category}
                t={t}
                onEdit={handleOpenEdit}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {localItems.length === 0 && (
        <div className="py-12 text-center text-slate-500 border border-dashed border-black/[0.1] dark:border-white/10 rounded-[24px] glass-card p-6">
          <p className="font-bold text-base text-slate-900 dark:text-white mb-1">
            {t('categories.no_categories', 'Brak utworzonych kategorii')}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {t('categories.no_categories_desc', 'Kategorie pozwalają dzielić usługi na logiczne bloki na pulpicie.')}
          </p>
          <Button icon={Plus} size="sm" onClick={handleOpenAdd}>
            {t('categories.add_first', '+ Dodaj pierwszą kategorię')}
          </Button>
        </div>
      )}

      {/* Category Add/Edit Modal */}
      {isFormOpen && (
        <Modal 
          title={editingCat ? t('categories.edit_title', `Edytuj: ${editingCat.name}`).replace('{name}', editingCat.name) : t('categories.add_title', '+ Nowa kategoria')} 
          onClose={() => setIsFormOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('categories.name_label', 'Nazwa kategorii *')}
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder={t('categories.name_placeholder', 'np. Infrastruktura, Media, Smart Home')}
              autoFocus
            />

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                {t('categories.icon_label', 'Ikona kategorii')}
              </label>
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: formData.color || '#6366f1' }}
                >
                  <BrandIcon name={formData.icon || 'folder'} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={formData.name} />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowIconPicker(true)}
                  className="flex-1 text-xs py-2 font-bold"
                >
                  {t('categories.icon_btn', 'Wybierz ikonę z biblioteki')}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
                {t('categories.color_label', 'Kolor kategorii')}
              </label>
              <ColorPicker color={formData.color} onChange={c => setFormData(prev => ({ ...prev, color: c }))} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-black/[0.06] dark:border-white/10">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                {t('common.cancel', 'Anuluj')}
              </Button>
              <Button type="submit">
                {editingCat ? t('common.save', 'Zapisz zmiany') : t('categories.btn_add', 'Utwórz kategorię')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Icon Picker Popup Modal */}
      {showIconPicker && (
        <IconPicker
          selectedIcon={formData.icon}
          onSelect={icon => {
            setFormData(prev => ({ ...prev, icon }));
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={t('categories.delete_title', `Usunąć kategorię "${deleteConfirm.name}"?`).replace('{name}', deleteConfirm.name)}
          message={t('categories.delete_msg', 'Usługi przypisane do tej kategorii zostaną przeniesione do grupy "Inne usługi". Żadna usługa nie zostanie skasowana.')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
