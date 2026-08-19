import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Edit2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ColorPicker from '../common/ColorPicker';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function TagManager() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' });
  const [formLoading, setFormLoading] = useState(false);
  const { addToast } = useToast();

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await api.tags.getTags();
      setTags(res.data);
    } catch (err) {
      addToast('Failed to fetch tags', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Tag name is required', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await api.tags.createTag({
        name: formData.name.trim().toLowerCase().replace(/^#/, ''),
        color: formData.color
      });
      addToast(`Tag #${formData.name} created`, 'success');
      setIsAddOpen(false);
      setFormData({ name: '', color: '#6366f1' });
      fetchTags();
    } catch (err) {
      addToast(err.response?.data?.error || 'Tag name already exists or invalid', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.tags.deleteTag(deleteConfirm.id);
      addToast(`Deleted tag #${deleteConfirm.name}`, 'success');
      fetchTags();
    } catch (err) {
      addToast('Failed to delete tag', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading tags...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Tag Manager</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Organize services with custom colored tags and filters.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setIsAddOpen(true)}>Add Tag</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {tags.map(tag => (
          <div 
            key={tag.id} 
            className="glass-card rounded-2xl p-3.5 flex items-center justify-between hover:border-white/20 transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: tag.color || '#6366f1' }} />
              <div className="min-w-0">
                <span className="font-bold text-xs text-text-primary truncate block">#{tag.name}</span>
                <span className="text-[10px] text-text-secondary">
                  {tag.usage_count !== undefined ? `${tag.usage_count} services` : 'Tag'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setDeleteConfirm(tag)}
              className="p-1.5 text-text-secondary/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all hover:scale-105 active:scale-95"
              title="Delete tag"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="col-span-full py-16 text-center text-text-secondary border border-dashed border-white/15 rounded-[24px] glass-card p-6">
            <p className="font-bold text-base text-text-primary mb-1">No custom tags created</p>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
              Tags let you add custom labels like #docker, #media, or #smart-home.
            </p>
            <Button icon={Plus} size="sm" onClick={() => setIsAddOpen(true)}>Add First Tag</Button>
          </div>
        )}
      </div>

      {isAddOpen && (
        <Modal title="Create New Tag" onClose={() => setIsAddOpen(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <Input 
              label="Tag Name" 
              value={formData.name} 
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
              required 
              placeholder="e.g. docker, backup, dmz"
              autoFocus
            />
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5 tracking-tight">Tag Color</label>
              <ColorPicker color={formData.color} onChange={c => setFormData(prev => ({ ...prev, color: c }))} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={formLoading}>Create Tag</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={`Delete Tag "#${deleteConfirm.name}"?`}
          message={`This tag will be removed from all assigned services. Services will not be deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
