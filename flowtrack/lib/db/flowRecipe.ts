import { SupabaseClient } from '@supabase/supabase-js';

export interface FlowRecipeItem {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  notes: string;
  order_index: number;
}

export interface FlowRecipeItemInput {
  title: string;
  notes: string;
  order_index?: number;
}

export interface FlowRecipeItemUpdate {
  title?: string;
  notes?: string;
  order_index?: number;
}

export async function getFlowRecipeItems(supabase: SupabaseClient | Promise<SupabaseClient>): Promise<FlowRecipeItem[]> {
  try {
    const client = (await supabase) as SupabaseClient;
    const { data, error } = await client
      .from('flow_recipe_items')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function createFlowRecipeItem(supabase: SupabaseClient, input: FlowRecipeItemInput): Promise<FlowRecipeItem> {
  try {
    const { data, error } = await supabase
      .from('flow_recipe_items')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating flow recipe item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createFlowRecipeItem:', error);
    throw error;
  }
}

export async function updateFlowRecipeItem(supabase: SupabaseClient, id: string, input: FlowRecipeItemUpdate): Promise<FlowRecipeItem> {
  try {
    const { data, error } = await supabase
      .from('flow_recipe_items')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating flow recipe item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateFlowRecipeItem:', error);
    throw error;
  }
}

export async function deleteFlowRecipeItem(supabase: SupabaseClient, id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('flow_recipe_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting flow recipe item:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteFlowRecipeItem:', error);
    throw error;
  }
}
