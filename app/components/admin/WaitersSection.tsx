"use client";

import { useCallback, useEffect, useState } from "react";
import { WaitersList } from "./WaitersList";
import { WaitersManager } from "./WaitersManager";
import { Waiter } from "./waiters.types";

type WaitersSectionProps = {
  brandSlug: string;
  restaurantSlug: string;
};

export function WaitersSection({ brandSlug, restaurantSlug }: WaitersSectionProps) {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);

  const loadWaiters = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({ brandSlug, restaurantSlug });
      const response = await fetch(`/api/admin/waiters?${params.toString()}`, { method: "GET", cache: "no-store" });
      const json = (await response.json()) as {
        ok: boolean;
        waiters?: Waiter[];
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudieron cargar los mozos");
      }

      setWaiters(json.waiters ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los mozos");
    } finally {
      setIsLoading(false);
    }
  }, [brandSlug, restaurantSlug]);

  useEffect(() => {
    void loadWaiters();
  }, [loadWaiters]);

  const handleCreated = (waiter: Waiter) => {
    setWaiters((previous) => [waiter, ...previous]);
    void loadWaiters();
  };

  const handleUpdated = (updated: Waiter) => {
    setWaiters((previous) => previous.map((waiter) => (waiter.id === updated.id ? updated : waiter)));
    setEditingWaiter(null);
    void loadWaiters();
  };

  const handleEdit = (waiter: Waiter) => {
    setEditingWaiter(waiter);
  };

  const handleCancelEdit = () => {
    setEditingWaiter(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const params = new URLSearchParams({ brandSlug, restaurantSlug });
      const response = await fetch(`/api/admin/waiters/${id}?${params.toString()}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo eliminar el mozo");
      }

      setWaiters((previous) => previous.filter((waiter) => waiter.id !== id));
      if (editingWaiter?.id === id) {
        setEditingWaiter(null);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el mozo");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <WaitersManager
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        editingWaiter={editingWaiter}
        onCancelEdit={handleCancelEdit}
        brandSlug={brandSlug}
        restaurantSlug={restaurantSlug}
      />
      <div className="mt-6">
        <WaitersList
          brandSlug={brandSlug}
          restaurantSlug={restaurantSlug}
          waiters={waiters}
          isLoading={isLoading}
          error={error}
          deletingId={deletingId}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </>
  );
}
