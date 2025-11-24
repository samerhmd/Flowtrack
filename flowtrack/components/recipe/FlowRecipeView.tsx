'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { 
  getFlowRecipeItems, 
  createFlowRecipeItem, 
  updateFlowRecipeItem, 
  deleteFlowRecipeItem,
  type FlowRecipeItem,
  type FlowRecipeItemInput,
  type FlowRecipeItemUpdate
} from '@/lib/db/flowRecipe';
import { Button } from '@/components/ui/Button';

interface FlowRecipeViewProps {
  initialItems: FlowRecipeItem[];
}

interface RecipeFormData {
  title: string;
  notes: string;
  order_index?: number;
}

function RecipeForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isEditing = false 
}: { 
  initialData: RecipeFormData;
  onSubmit: (data: RecipeFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}) {
  const [formData, setFormData] = useState<RecipeFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.notes.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg bg-gray-50">
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        required
      />
      <input
        type="number"
        placeholder="Order (optional)"
        value={formData.order_index || ''}
        onChange={(e) => setFormData({ 
          ...formData, 
          order_index: e.target.value ? parseInt(e.target.value) : undefined 
        })}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Add')}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RecipeItemCard({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: FlowRecipeItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium">{item.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
          <p className="text-xs text-gray-500 mt-2">Order: {item.order_index}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            onClick={onEdit}
            variant="ghost"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="ghost"
            className="text-sm text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FlowRecipeView({ initialItems }: FlowRecipeViewProps) {
  const [items, setItems] = useState<FlowRecipeItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();

  const handleAddItem = async (data: RecipeFormData) => {
    try {
      const input: FlowRecipeItemInput = {
        title: data.title.trim(),
        notes: data.notes.trim(),
        order_index: data.order_index
      };
      
      const newItem = await createFlowRecipeItem(supabase, input);
      setItems([...items, newItem]);
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item. Please try again.');
    }
  };

  const handleUpdateItem = async (id: string, data: RecipeFormData) => {
    try {
      const updates: FlowRecipeItemUpdate = {
        title: data.title.trim(),
        notes: data.notes.trim(),
        order_index: data.order_index
      };
      
      const updatedItem = await updateFlowRecipeItem(supabase, id, updates);
      setItems(items.map(item => item.id === id ? updatedItem : item));
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteFlowRecipeItem(supabase, id);
      setItems(items.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const editingItem = editingId ? items.find(item => item.id === editingId) : null;

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Flow Recipe</h1>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setError(null);
          }}
        >
          Add Item
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <RecipeForm
          initialData={{ title: '', notes: '', order_index: undefined }}
          onSubmit={handleAddItem}
          onCancel={() => {
            setShowForm(false);
            setError(null);
          }}
          isEditing={false}
        />
      )}

      {editingId && editingItem && (
        <RecipeForm
          initialData={{
            title: editingItem.title,
            notes: editingItem.notes,
            order_index: editingItem.order_index
          }}
          onSubmit={(data) => handleUpdateItem(editingId, data)}
          onCancel={() => {
            setEditingId(null);
            setError(null);
          }}
          isEditing={true}
        />
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p>Your Flow Recipe is empty.</p>
            <p className="text-sm mt-1">Add 1–3 habits that help you focus.</p>
          </div>
        ) : (
          items.map((item) => (
            <RecipeItemCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditingId(item.id);
                setShowForm(false);
                setError(null);
              }}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}