export const dynamic = 'force-dynamic';
import { getFlowRecipeItems } from '@/lib/db/flowRecipe';
import FlowRecipeView from '@/components/recipe/FlowRecipeView';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cookies } from 'next/headers';

export default async function FlowRecipePage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Flow Recipe</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in to manage your flow recipe.</p>
        <div>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = await getFlowRecipeItems(supabase);
  return <FlowRecipeView initialItems={items} />;
}
