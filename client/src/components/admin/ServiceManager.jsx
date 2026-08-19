import React, { useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { Plus, GripVertical, Edit2, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import ServiceForm from './ServiceForm';
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

function SortableItem({ id, service, onEdit, onDelete }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const serviceColor = service.color || 'var(--accent)';

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
      
      {/* Squircle Brand Icon */}
      <div 
        className="w-11 h-11 rounded-[12px] flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md relative overflow-hidden" 
        style={{ 
          background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}cc 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/15 pointer-events-none" />
        <BrandIcon name={service.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={service.name} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-text-primary truncate">{service.name}</span>
          {service.favorite === 1 && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
          {service.custom_badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent uppercase tracking-wider">
              {service.custom_badge}
            </span>
          )}
        </div>
        <div className="text-xs text-text-secondary truncate mt-0.5 font-mono text-[11px] opacity-75">
          {service.url} · {service.category_name || 'Uncategorized'}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
        {service.enabled ? (
          <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3.5 h-3.5"/> Enabled</span>
        ) : (
          <span className="flex items-center gap-1 text-text-secondary/60"><XCircle className="w-3.5 h-3.5"/> Disabled</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onEdit(service)} 
          className="p-2 text-text-secondary hover:text-accent hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Edit service"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(service)} 
          className="p-2 text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Delete service"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ServiceManager() {
  const { services, loading, refresh, reorder } = useServices();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { addToast } = useToast();
  const [activeId, setActiveId] = useState(null);
  const [localItems, setLocalItems] = useState([]);

  React.useEffect(() => {
    setLocalItems(services);
  }, [services]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(i => i.id === active.id);
      const newIndex = localItems.findIndex(i => i.id === over.id);
      
      const newArray = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newArray);
      
      const orderedIds = newArray.map(item => item.id);
      await reorder(orderedIds);
      addToast('Service order updated', 'info');
    }
  };

  const handleAdd = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.services.deleteService(deleteConfirm.id);
      addToast(`Deleted "${deleteConfirm.name}"`, 'success');
      refresh();
    } catch (err) {
      addToast('Failed to delete service', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    refresh();
  };

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading services...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Services Manager</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Add, reorder, configure and manage all homelab tiles.
          </p>
        </div>
        <Button icon={Plus} onClick={handleAdd}>Add Service</Button>
      </div>

      {localItems.length === 0 ? (
        <div className="text-center py-16 text-text-secondary border border-dashed border-white/15 rounded-[24px] glass-card p-6">
          <p className="font-bold text-base text-text-primary mb-1">No services defined yet</p>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
            Click 'Add Service' above or load demo data to start organizing your dashboard.
          </p>
          <Button icon={Plus} size="sm" onClick={handleAdd}>Add First Service</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={localItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {localItems.map(service => (
                <SortableItem key={service.id} id={service.id} service={service} onEdit={handleEdit} onDelete={setDeleteConfirm} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="h-16 rounded-2xl glass-card border-2 border-accent opacity-90 shadow-2xl" />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {isFormOpen && (
        <ServiceForm 
          service={editingService} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={`Delete "${deleteConfirm.name}"?`}
          message={`This service will be permanently removed from your dashboard and health check monitoring.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
