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
};

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
  };
}

export const Product = ({ product }: ProductProps) => {
  const defaultValues = React.useMemo(() => buildDefaultValues(product), [product]);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setStatusMessage(null);

      const { id, created_at: _createdAt, ...productPayload } = value;

      const { error: productError } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", id);

      if (productError) {
        setStatusMessage(`Failed to update product: ${productError.message}`);
        return;
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

      <div className="flex items-center gap-3">
        <form.AppForm>
          <form.SubmitButton />
        </form.AppForm>
        {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
      </div>
    </form>
  );
};
