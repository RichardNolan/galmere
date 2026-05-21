import { supabase } from "@/lib/supabase";
import React from "react";

export const Product = ({ name, id }: { name: string; id: string }) => {
  const [newName, setNewName] = React.useState(name);

  const updateProduct = async () => {
    const { error } = await supabase
      .from("products")
      .update({ name: newName })
      .eq("id", id)
      .select();
    if (error) {
      console.error("Error updating product:", error);
    } else {
      console.log("Product updated successfully");
    }
  };
  return (
    <li className="flex items-center gap-3 py-2">
      <input
        className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <button
        className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={updateProduct}
      >
        Update
      </button>
    </li>
  );
};
