import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { Plus, GripVertical, Edit2, Trash2, Folder } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import Input from '../common/Input';
import ColorPicker from '../common/ColorPicker';
import IconPicker from '../common/IconPicker';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import * as LucideIcons from 'lucide-react';

function getLucideIcon(iconName) {
  if (!iconName) return null;
  if (LucideIcons[iconName]) return LucideIcons[iconName];
  const pascal = iconName.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
  return LucideIcons[pascal] || null;
}

function SortableCategory({ id, category, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const CategoryIcon = getLucideIcon(category.icon) || Folder;
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
        <CategoryIcon className="w-5 h-5 relative z-10" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="font-extrabold text-sm text-slate-900 dark:text-white block truncate">{category.name}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {category.service_count !== undefined 
            ? `${category.service_count} ${category.service_count === 1 ? 'przypisana usługa' : category.service_count >= 2 && category.service_count <= 4 ? 'przypisane usługi' : 'przypisanych usług'}`
            : 'Kategoria'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onEdit(category)} 
          className="p-2 text-slate-400 hover:text-accent hover:bg-black/[0.04] dark:hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Edytuj kategorię"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(category)} 
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Usuń kategorię"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const { categories, loading, refresh } = useCategories();
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
      addToast('Zaktualizowano kolejność kategorii', 'success');
      refresh();
    } catch (err) {
      addToast('Nie udało się zapisać kolejności', 'error');
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
      addToast('Nazwa kategorii jest wymagana', 'error');
      return;
    }

    try {
      if (editingCat) {
        await api.categories.updateCategory(editingCat.id, formData);
        addToast(`Zaktualizowano kategorię "${formData.name}"`, 'success');
      } else {
        await api.categories.createCategory(formData);
        addToast(`Utworzono kategorię "${formData.name}"`, 'success');
      }
      setIsFormOpen(false);
      refresh();
    } catch (err) {
      addToast(err.response?.data?.error || 'Błąd zapisywania kategorii', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.categories.deleteCategory(deleteConfirm.id);
      addToast(`Usunięto kategorię "${deleteConfirm.name}"`, 'success');
      refresh();
    } catch (err) {
      addToast('Nie udało się usunąć kategorii', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Ładowanie kategorii...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Zarządzanie Kategoriami</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Grupuj kafelki w sekcje (np. Infrastruktura, Smart Home, Media).
          </p>
        </div>
        <Button icon={Plus} onClick={handleOpenAdd} className="shadow-lg shadow-accent/25 text-xs font-bold">
          + Dodaj kategorię
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
                onEdit={handleOpenEdit}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {localItems.length === 0 && (
        <div className="py-12 text-center text-slate-500 border border-dashed border-black/[0.1] dark:border-white/10 rounded-[24px] glass-card p-6">
          <p className="font-bold text-base text-slate-900 dark:text-white mb-1">Brak utworzonych kategorii</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Kategorie pozwalają dzielić usługi na logiczne bloki na pulpicie.
          </p>
          <Button icon={Plus} size="sm" onClick={handleOpenAdd}>
            + Dodaj pierwszą kategorię
          </Button>
        </div>
      )}

      {isFormOpen && (
        <Modal 
          title={editingCat ? `Edytuj: ${editingCat.name}` : '+ Nowa kategoria'} 
          onClose={() => setIsFormOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nazwa kategorii"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="np. Infrastruktura, Media, Smart Home"
              autoFocus
            />

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                Ikona kategorii
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowIconPicker(true)}
                  className="flex-1 text-xs py-2"
                >
                  Wybierz ikonę z biblioteki
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
                Kolor kategorii
              </label>
              <ColorPicker color={formData.color} onChange={c => setFormData(prev => ({ ...prev, color: c }))} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-black/[0.06] dark:border-white/10">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit">
                {editingCat ? 'Zapisz zmiany' : 'Utwórz kategorię'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
          title={`Usunąć kategorię "${deleteConfirm.name}"?`}
          message="Usługi przypisane do tej kategorii zostaną przeniesione do grupy 'Inne usługi'. Żadna usługa nie zostanie skasowana."
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
