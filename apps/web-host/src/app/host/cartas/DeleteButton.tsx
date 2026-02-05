"use client";

import { deleteCardBunchAction } from "@/lib/actions/cardBunches";

interface DeleteButtonProps {
  id: string;
  name: string;
}

export default function DeleteButton({ id, name }: DeleteButtonProps) {
  return (
    <form
      action={deleteCardBunchAction}
      style={{ display: "inline" }}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar el grupo "${name}"?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-danger">
        Eliminar
      </button>
    </form>
  );
}
