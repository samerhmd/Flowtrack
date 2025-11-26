export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getFlowRecipeItems } from '@/lib/db/flowRecipe';
import FlowRecipeView from '@/components/recipe/FlowRecipeView';

export default async function FlowRecipePage() {
  const supabase = createSupabaseServerClient();
  const items = await getFlowRecipeItems(supabase);

  return <FlowRecipeView initialItems={items} />;
}
