import type { Product as ProductType } from "#/api/Products";
import {
  FlattenedIngredientsSection,
  type FlatIngredientRow,
} from "#/components/flattened-ingredients-section";
import { IngredientDeclaration } from "#/components/ingredient-declaration";
import { IngredientsSection } from "#/components/ingredients-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";

type IngredientsPanelProps = {
  product: ProductType;
  flatIngredients?: FlatIngredientRow[];
  includeDeclaration?: boolean;
  includeIngredients?: boolean;
  includeFlattenedIngredients?: boolean;
};
export function IngredientsPanel({
  product,
  flatIngredients = [],
  includeDeclaration = true,
  includeIngredients = true,
  includeFlattenedIngredients = true,
}: IngredientsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingredients</CardTitle>
        <CardDescription>Product recipes and linked raw materials from Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {includeDeclaration ? <IngredientDeclaration product={product} /> : null}
        {includeIngredients ? <IngredientsSection product={product} /> : null}
        {includeFlattenedIngredients ? (
          <FlattenedIngredientsSection flatIngredients={flatIngredients} />
        ) : null}
      </CardContent>
    </Card>
  );
}
