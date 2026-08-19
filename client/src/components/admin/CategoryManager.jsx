import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { Plus, GripVertical, Edit2, Trash2, Folder } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import Input from '../common/Input';
import ColorPicker from '../common/ColorPicker';
import IconPicker from '../common/IconPicker';
import BrandIcon from '../common/BrandIcon';
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
          : 'hover:border-white/20'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-text-secondary/50 hover:text-text-primary p-1 -ml-1">
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
        <span className="font-bold text-sm text-text-primary block truncate">{category.name}</span>
        <span className="text-[11px] text-text-secondary">
          {category.service_count !== undefined ? `${category.service_count} services assigned` : 'Category'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onEdit(category)} 
          className="p-2 text-text-secondary hover:text-accent hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Edit category"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(category)} 
          className="p-2 text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Delete category"
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
  const { addToast } = useToast();
  const [activeId, setActiveId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', icon: 'folder', color: '#6366f1' });
  const [formLoading, setFormLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  React.useEffect(() => {
    setLocalItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    
    if (active.id !== over.id) {
      const oldIndex = localItems.findIndex(i => i.id === active.id);
      const newIndex = localItems.findIndex(i => i.id === over.id);
      
      const newArray = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newArray);
      
      try {
        await api.categories.reorderCategories({ 
          items: newArray.map((c, index) => ({ id: c.id, sort_order: index })) 
        });
        addToast('Category order updated', 'info');
      } catch (err) {
        addToast('Failed to reorder categories', 'error');
      }
    }
  };

  const handleAdd = () => {
    setEditingCat(null);
    setFormData({ name: '', icon: 'folder', color: '#6366f1' });
    setIsFormOpen(true);
  };

  const handleEdit = (cat) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, icon: cat.icon || 'folder', color: cat.color || '#6366f1' });
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.categories.deleteCategory(deleteConfirm.id);
      addToast(`Deleted category "${deleteConfirm.name}"`, 'success');
      refresh();
    } catch (err) {
      addToast('Failed to delete category', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Category name is required', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (editingCat) {
        await api.categories.updateCategory(editingCat.id, formData);
        addToast(`Updated category "${formData.name}"`, 'success');
      } else {
        await api.categories.createCategory(formData);
        addToast(`Created category "${formData.name}"`, 'success');
      }
      setIsFormOpen(false);
      refresh();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error saving category', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading categories...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Category Manager</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Organize homelab tiles into sections and custom categories.
          </p>
        </div>
        <Button icon={Plus} onClick={handleAdd}>Add Category</Button>
      </div>

      {localItems.length === 0 ? (
        <div className="text-center py-16 text-text-secondary border border-dashed border-white/15 rounded-[24px] glass-card p-6">
          <p className="font-bold text-base text-text-primary mb-1">No categories created</p>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
            Categories help you group services (e.g. Infrastructure, Smart Home, Media).
          </p>
          <Button icon={Plus} size="sm" onClick={handleAdd}>Add First Category</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={localItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {localItems.map(cat => (
                <SortableCategory key={cat.id} id={cat.id} category={cat} onEdit={handleEdit} onDelete={setDeleteConfirm} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? <div className="h-16 rounded-2xl glass-card border-2 border-accent opacity-90 shadow-2xl" /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {isFormOpen && (
        <Modal title={editingCat ? `Edit "${formData.name}"` : 'Add New Category'} onClose={() => setIsFormOpen(false)}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input 
              label="Category Name" 
              value={formData.name} 
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
              required 
              placeholder="e.g. Infrastructure, Storage, Smart Home"
              autoFocus
            />
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5 tracking-tight">Category Color</label>
              <ColorPicker color={formData.color} onChange={c => setFormData(prev => ({ ...prev, color: c }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5 tracking-tight">Category Icon</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                  style={{ backgroundColor: formData.color }}
                >
                  {getLucideIcon(formData.icon) ? 
                    React.createElement(getLucideIcon(formData.icon), { className: "w-5 h-5" }) : 
                    <Folder className="w-5 h-5" />
                  }
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowIconPicker(true)}>
                  Choose Icon
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={formLoading}>Save Category</Button>
            </div>
          </form>
        </Modal>
      )}

      {showIconPicker && (
        <Modal title="Select Category Icon" onClose={() => setShowIconPicker(false)}>
          <IconPicker onSelect={(icon) => { setFormData(prev => ({ ...prev, icon })); setShowIconPicker(false); }} />
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={`Delete Category "${deleteConfirm.name}"?`}
          message={`Services inside this category will not be deleted, but will become Uncategorized.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
