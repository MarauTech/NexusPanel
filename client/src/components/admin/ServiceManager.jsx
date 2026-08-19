import React, { useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { Plus, GripVertical, Edit2, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import ServiceForm from './ServiceForm';
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

function SortableItem({ id, service, onEdit, onDelete, onToggleEnabled }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const serviceColor = service.color || 'var(--accent)';
  const isEnabled = service.enabled === 1 || service.enabled === true || service.enabled !== false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3.5 p-3.5 rounded-2xl glass-card transition-all ${
        isDragging 
          ? 'shadow-2xl border-accent opacity-90 scale-[1.02]' 
          : 'hover:border-black/[0.15] dark:hover:border-white/20'
      } ${!isEnabled ? 'opacity-55' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 -ml-1">
        <GripVertical className="w-5 h-5" />
      </div>
      
      {/* Squircle Brand Icon */}
      <div 
        className="w-11 h-11 rounded-[14px] flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md relative overflow-hidden" 
        style={{ 
          background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}cc 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/15 pointer-events-none" />
        <BrandIcon name={service.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={service.name} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{service.name}</span>
          {service.favorite === 1 && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
          {service.custom_badge && (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25 tracking-wider">
              {service.custom_badge}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono text-[11px]">
          {service.url} · <span className="font-sans text-accent">{service.category_name || 'Bez kategorii'}</span>
        </div>
      </div>

      {/* Interactive Toggle Switch for Enable/Disable */}
      <button
        onClick={() => onToggleEnabled(service)}
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isEnabled 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
            : 'bg-black/[0.04] dark:bg-white/5 text-slate-400 border border-black/[0.08] dark:border-white/10 hover:bg-black/[0.08]'
        }`}
        title={isEnabled ? 'Kliknij, aby ukryć usługę na pulpicie' : 'Kliknij, aby włączyć usługę na pulpicie'}
      >
        {isEnabled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        <span>{isEnabled ? 'Aktywna' : 'Wyłączona'}</span>
      </button>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onEdit(service)} 
          className="p-2 text-slate-400 hover:text-accent hover:bg-black/[0.04] dark:hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Edytuj usługę"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(service)} 
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Usuń usługę"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ServiceManager() {
  const { services, loading, refresh, reorder } = useServices();
  const [editingService, setEditingService] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { addToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(services, oldIndex, newIndex);
    const orderedIds = reordered.map((s) => s.id);

    try {
      await reorder(orderedIds);
      addToast('Zaktualizowano kolejność kafelków', 'success');
    } catch (err) {
      addToast('Błąd zmiany kolejności', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.services.deleteService(deleteConfirm.id);
      addToast(`Usunięto ${deleteConfirm.name}`, 'success');
      refresh();
    } catch (err) {
      addToast('Nie udało się usunąć usługi', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleEnabled = async (service) => {
    const newEnabled = service.enabled === 1 || service.enabled === true ? 0 : 1;
    try {
      if (api.services.toggleEnabled) {
        await api.services.toggleEnabled(service.id, newEnabled);
      } else {
        await api.services.updateService(service.id, {
          ...service,
          enabled: newEnabled
        });
      }
      addToast(newEnabled ? `Włączono ${service.name}` : `Ukryto ${service.name}`, 'info');
      refresh();
    } catch (err) {
      addToast('Błąd aktualizacji statusu', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Ładowanie listy usług...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Zarządzanie Usługami</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Dodawaj, zmieniaj kolejność (przeciągnij i upuść) oraz konfiguruj kafelki homelabu.
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            setEditingService(null);
            setIsFormOpen(true);
          }}
          className="shadow-lg shadow-accent/25 text-xs font-bold"
        >
          + Dodaj usługę
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={services.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {services.map((service) => (
              <SortableItem
                key={service.id}
                id={service.id}
                service={service}
                onEdit={(svc) => {
                  setEditingService(svc);
                  setIsFormOpen(true);
                }}
                onDelete={(svc) => setDeleteConfirm(svc)}
                onToggleEnabled={handleToggleEnabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {services.length === 0 && (
        <div className="py-16 text-center text-slate-500 border border-dashed border-black/[0.1] dark:border-white/10 rounded-[28px] glass-card p-6">
          <p className="font-bold text-base text-slate-900 dark:text-white mb-1">Brak skonfigurowanych usług</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Dodaj swoją pierwszą aplikację homelab lub skorzystaj ze skanera sieci LAN.
          </p>
          <Button
            icon={Plus}
            size="sm"
            onClick={() => {
              setEditingService(null);
              setIsFormOpen(true);
            }}
          >
            + Dodaj pierwszą usługę
          </Button>
        </div>
      )}

      {isFormOpen && (
        <ServiceForm
          service={editingService}
          onClose={() => {
            setIsFormOpen(false);
            setEditingService(null);
          }}
          onSuccess={() => {
            refresh();
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={`Usunąć "${deleteConfirm.name}"?`}
          message={`Czy na pewno chcesz bezpowrotnie usunąć ten kafelek z pulpitu?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
