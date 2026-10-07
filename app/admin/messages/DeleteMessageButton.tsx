'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { AdminError, deleteContactMessage } from '@/lib/admin/api';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmDialog } from '@/components/ui/Dialog';

export default function DeleteMessageButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await deleteContactMessage(id);
      toast.success('Message supprimé.');
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Suppression impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <IconButton label="Supprimer le message" variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 size={15} aria-hidden="true" />
      </IconButton>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={confirm}
        title="Supprimer ce message ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        tone="danger"
        busy={busy}
      />
    </>
  );
}
