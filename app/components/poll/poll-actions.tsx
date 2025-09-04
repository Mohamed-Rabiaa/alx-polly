"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/app/lib/supabase";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";

interface PollProps {
  pollId: string;
  pollCreatorId: string;
  currentUserId: string | undefined;
  onPollDeleted?: () => void;
}

export function Poll({
  pollId,
  pollCreatorId,
  currentUserId,
  onPollDeleted,
}: PollProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  // Only show if the current user created this poll
  if (!currentUserId || currentUserId !== pollCreatorId) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/polls/${pollId}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      
      // Delete the poll from the database
      const { error } = await supabase.from("polls").delete().eq("id", pollId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Poll deleted",
        description: "Your poll has been successfully deleted.",
      });
      
      // Refresh the polls list or call the callback
      if (onPollDeleted) {
        onPollDeleted();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({
        title: "Error",
        description: "Failed to delete the poll. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      // Dialog will close automatically after action
    }
  };

  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleEdit}
        className="flex items-center"
      >
        <Edit className="mr-1 h-4 w-4" />
        Edit
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            disabled={isDeleting}
            className="flex items-center"
          >
            <Trash className="mr-1 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your poll
              and remove all associated votes and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Poll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}