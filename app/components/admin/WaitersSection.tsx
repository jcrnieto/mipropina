"use client";

import { useEffect, useState } from "react";
import { ListOfWhiters } from "./ListOfWhiters";
import { WaitersManager } from "./WaitersManager";
import { Waiter } from "./waiters.types";

export function WaitersSection() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);

  const loadWaiters = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/waiters", { method: "GET", cache: "no-store" });
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
  };

  useEffect(() => {
    void loadWaiters();
  }, []);

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
      const response = await fetch(`/api/admin/waiters/${id}`, {
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
      />
      <div className="mt-6">
        <ListOfWhiters
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
