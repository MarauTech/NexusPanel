import React, { useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { useLanguage } from '../../contexts/LanguageContext';
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

function SortableItem({ id, service, onEdit, onDelete, onToggleEnabled, t }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const isEnabled = service.enabled === 1 || service.enabled === true || service.enabled !== false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-[#111622] border transition-colors shadow-sm dark:shadow-none ${
        isDragging 
          ? 'shadow-xl border-blue-500 bg-slate-100 dark:bg-[#18202d]' 
          : 'border-slate-200 hover:border-slate-300 dark:border-[#1d2635] dark:hover:border-[#2b394f]'
      } ${!isEnabled ? 'opacity-50' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 p-1 -ml-1">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Brand Icon (Matches ServiceCard exactly) */}
      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-[#192231] border border-slate-200 dark:border-[#222d41] flex items-center justify-center flex-shrink-0">
        <BrandIcon name={service.icon} className="w-4 h-4" fallbackText={service.name} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{service.name}</span>
          {service.favorite === 1 && (
            <Star className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
          {service.custom_badge && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex-shrink-0">
              {service.custom_badge}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
          {service.url} · <span className="text-slate-700 dark:text-slate-300 font-sans">{service.category_name || t('form.uncategorized', 'Bez kategorii')}</span>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <button
        onClick={() => onToggleEnabled(service)}
        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer border ${
          isEnabled 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20' 
            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-[#18202d] dark:text-slate-400 dark:border-[#202c3e] dark:hover:bg-[#202c3e]'
        }`}
      >
        {isEnabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        <span>{isEnabled ? t('common.active', 'Aktywna') : t('common.disabled', 'Wyłączona')}</span>
      </button>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onEdit(service)} 
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18202d] rounded-md transition-colors cursor-pointer"
          title={t('services.edit_tooltip', 'Edytuj usługę')}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => onDelete(service)} 
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
          title={t('services.delete_tooltip', 'Usuń usługę')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function ServiceManager() {
  const { services, loading, refresh, reorder } = useServices();
  const { t } = useLanguage();
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
      addToast(t('services.reordered', 'Zaktualizowano kolejność kafelków'), 'success');
    } catch (err) {
      addToast(t('common.error', 'Błąd zmiany kolejności'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.services.deleteService(deleteConfirm.id);
      addToast(t('services.deleted', `Usunięto ${deleteConfirm.name}`).replace('{name}', deleteConfirm.name), 'success');
      refresh();
    } catch (err) {
      addToast(t('common.error', 'Nie udało się usunąć usługi'), 'error');
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
      addToast(
        newEnabled 
          ? t('services.enabled_toast', `Włączono ${service.name}`).replace('{name}', service.name)
          : t('services.disabled_toast', `Ukryto ${service.name}`).replace('{name}', service.name), 
        'info'
      );
      refresh();
    } catch (err) {
      addToast(t('common.error', 'Błąd aktualizacji statusu'), 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">{t('common.loading', 'Ładowanie listy usług...')}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('services.title', 'Zarządzanie Usługami')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('services.subtitle', 'Dodawaj, zmieniaj kolejność (przeciągnij i upuść) oraz konfiguruj kafelki homelabu.')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEditingService(null);
            setIsFormOpen(true);
          }}
          className="text-xs font-medium"
        >
          {t('services.btn_add', 'Dodaj usługę')}
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
          <div className="space-y-2">
            {services.map((service) => (
              <SortableItem
                key={service.id}
                id={service.id}
                service={service}
                t={t}
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
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-[#1d2635] rounded-lg bg-slate-50 dark:bg-[#111622] p-6">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">
            {t('services.no_services', 'Brak skonfigurowanych usług')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {t('services.no_services_desc', 'Dodaj swoją pierwszą aplikację homelab lub skorzystaj ze skanera sieci LAN.')}
          </p>
          <Button
            variant="secondary"
            icon={Plus}
            size="sm"
            onClick={() => {
              setEditingService(null);
              setIsFormOpen(true);
            }}
          >
            {t('services.add_first', 'Dodaj pierwszą usługę')}
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
          title={t('services.delete_title', `Usunąć "${deleteConfirm.name}"?`).replace('{name}', deleteConfirm.name)}
          message={t('services.delete_msg', 'Czy na pewno chcesz bezpowrotnie usunąć ten kafelek z pulpitu?')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
