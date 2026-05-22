import type { Product as ProductType } from "#/api/Products";
import { useAppForm } from "#/components/forms/app-form";
import { supabase } from "@/lib/supabase";
import React from "react";

type ProductProps = {
  product: ProductType;
};

type ProductFormValues = {
  id: string;
  created_at: string;
  productName: string;
  servingSizeValue: number;
  servingSizeUnit: string;
  packSizeValue: number;
  packSizeUnit: string;
  versionNumber: string;
  reviewStatus: string;
  lastUpdated: string;
  owner: string;
  lifecycle: string;
  market: string;
  approvalStage: string;
  completionPercent: number;
  nutritionId: number | null;
  nutrition: {
    carbs: number;
    fat: number;
    fibre: number;
    kcal: number;
    kj: number;
    protein: number;
    salt: number;
    sat: number;
    sugar: number;
  };
};

const nutritionFieldDefs: Array<{
  name: keyof ProductFormValues["nutrition"];
  label: string;
  step?: string;
}> = [
  { name: "carbs", label: "Carbs" },
  { name: "fat", label: "Fat" },
  { name: "fibre", label: "Fibre" },
  { name: "kcal", label: "Kcal", step: "1" },
  { name: "kj", label: "Kj", step: "1" },
  { name: "protein", label: "Protein" },
  { name: "salt", label: "Salt" },
  { name: "sat", label: "Sat" },
  { name: "sugar", label: "Sugar" },
];

function buildDefaultValues(product: ProductType): ProductFormValues {
  return {
    id: product.id,
    created_at: product.created_at,
    productName: product.productName,
    servingSizeValue: product.servingSizeValue,
    servingSizeUnit: product.servingSizeUnit,
    packSizeValue: product.packSizeValue,
    packSizeUnit: product.packSizeUnit,
    versionNumber: product.versionNumber,
    reviewStatus: product.reviewStatus,
    lastUpdated: product.lastUpdated,
    owner: product.owner,
    lifecycle: product.lifecycle,
    market: product.market,
    approvalStage: product.approvalStage,
    completionPercent: product.completionPercent,
    nutritionId: product.nutrition?.id ?? null,
    nutrition: {
      carbs: product.nutrition?.carbs ?? 0,
      fat: product.nutrition?.fat ?? 0,
      fibre: product.nutrition?.fibre ?? 0,
      kcal: product.nutrition?.kcal ?? 0,
      kj: product.nutrition?.kj ?? 0,
      protein: product.nutrition?.protein ?? 0,
      salt: product.nutrition?.salt ?? 0,
      sat: product.nutrition?.sat ?? 0,
      sugar: product.nutrition?.sugar ?? 0,
    },
  };
}

export const Product = ({ product }: ProductProps) => {
  const defaultValues = React.useMemo(() => buildDefaultValues(product), [product]);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setStatusMessage(null);

      const { nutrition, nutritionId, id, created_at: _createdAt, ...productPayload } = value;

      const { error: productError } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", id);

      if (productError) {
        setStatusMessage(`Failed to update product: ${productError.message}`);
        return;
      }

      if (nutritionId) {
        const { error: nutritionError } = await supabase
          .from("nutrition")
          .update(nutrition)
          .eq("id", nutritionId);

        if (nutritionError) {
          setStatusMessage(`Product updated, but nutrition failed: ${nutritionError.message}`);
          return;
        }
      }

      setStatusMessage("Product updated successfully");
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{form.state.values.productName}</h3>
        <div className="text-xs text-slate-500">ID: {form.state.values.id}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <form.AppField name="productName">
          {(field) => <field.TextField label="Product Name" />}
        </form.AppField>
        <form.AppField name="servingSizeValue">
          {(field) => <field.NumberField label="Serving Size Value" />}
        </form.AppField>
        <form.AppField name="servingSizeUnit">
          {(field) => <field.TextField label="Serving Size Unit" />}
        </form.AppField>
        <form.AppField name="packSizeValue">
          {(field) => <field.NumberField label="Pack Size Value" />}
        </form.AppField>
        <form.AppField name="packSizeUnit">
          {(field) => <field.TextField label="Pack Size Unit" />}
        </form.AppField>
        <form.AppField name="versionNumber">
          {(field) => <field.TextField label="Version Number" />}
        </form.AppField>
        <form.AppField name="reviewStatus">
          {(field) => <field.TextField label="Review Status" />}
        </form.AppField>
        <form.AppField name="lastUpdated">
          {(field) => <field.TextField label="Last Updated" />}
        </form.AppField>
        <form.AppField name="owner">{(field) => <field.TextField label="Owner" />}</form.AppField>
        <form.AppField name="lifecycle">
          {(field) => <field.TextField label="Lifecycle" />}
        </form.AppField>
        <form.AppField name="market">{(field) => <field.TextField label="Market" />}</form.AppField>
        <form.AppField name="approvalStage">
          {(field) => <field.TextField label="Approval Stage" />}
        </form.AppField>
        <form.AppField name="completionPercent">
          {(field) => <field.NumberField label="Completion Percent" />}
        </form.AppField>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Brand (read-only)</p>
        {product.brand ? (
          <p className="mt-1">
            {product.brand.brandName} ({product.brand.brandCode})
          </p>
        ) : (
          <p className="mt-1 text-slate-500">No brand linked</p>
        )}
      </div>

      {Boolean(product.nutrition) ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-900">Nutrition (editable)</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {nutritionFieldDefs.map((item) => (
              <form.AppField key={item.name} name={`nutrition.${item.name}` as const}>
                {(field) => <field.NumberField label={item.label} step={item.step ?? "0.01"} />}
              </form.AppField>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
          No nutrition record linked.
        </div>
      )}

      <div className="flex items-center gap-3">
        <form.AppForm>
          <form.SubmitButton />
        </form.AppForm>
        {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
      </div>
    </form>
  );
};
