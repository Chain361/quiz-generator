"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="destructive" type="submit" disabled={pending}>
      {pending ? "Deleting..." : "Confirm Delete"}
    </Button>
  );
}

export function DeleteQuizButton({ 
  deleteAction 
}: { 
  deleteAction: (formData: FormData) => void 
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setShowConfirm(true)}>
        Delete
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="cosmic-night bg-card border border-secondary shadow-2xl p-6 rounded-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-primary mb-2">Delete Quiz?</h2>
            <p className="text-secondary-foreground mb-6 text-sm">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowConfirm(false)}
                className="bg-transparent border-secondary text-foreground hover:bg-secondary/50"
              >
                Cancel
              </Button>
              <form action={deleteAction}>
                <SubmitButton />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}