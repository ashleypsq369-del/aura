/**
 * SignOutModal - now uses Radix AlertDialog for proper WAI-ARIA compliance.
 * Role="alertdialog" announces immediately to screen readers.
 * Focus trap prevents accidental background interaction.
 */
import AlertDialog from './ui/AlertDialog';
import { LogOut } from 'lucide-react';

export default function SignOutModal({ isOpen, onClose, onConfirm }) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Sign out of Project Aura?"
      description="You'll need to sign in again to access your account. Any unsaved changes will be lost."
      confirmLabel="Sign Out"
      cancelLabel="Stay signed in"
      onConfirm={onConfirm}
      variant="warning"
    />
  );
}
