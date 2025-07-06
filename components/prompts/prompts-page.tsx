"use client";

import { getPromptsQueryKey } from "@/app/(with-logged-in-user)/prompts/queries";
import {
  PROMPT_FORM_DEFAULT_VALUES,
  PromptFormValues,
  promptSchema,
} from "@/schemas/prompt-schema";
import useAuthStore from "@/stores/use-auth-store";
import { TABLE_ROW_LIMIT } from "@/utils/constant";
import { standardDateFormat } from "@/utils/functions";
import { getPrompts } from "@/utils/supabase/api/get";
import { createErrorLog, createPrompt } from "@/utils/supabase/api/post";
import { updatePrompt } from "@/utils/supabase/api/update";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { PromptTableRow } from "@/utils/supabase/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { Edit, Plus, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import DataTable from "../ui/datatable";
import { Input } from "../ui/input";
import PromptForm from "./prompt-form";

export default function PromptsPage() {
  const { user } = useAuthStore();
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(
    null
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const debouncedSearchQuery = useDebounce(searchTerm, 300);
  const [isEdit, setIsEdit] = useState(false);
  const queryKey = getPromptsQueryKey(debouncedSearchQuery);

  const {
    data,
    status,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({
      pageParam,
    }: {
      pageParam: { cursor: string | null; direction: string };
    }) =>
      getPrompts(supabase, {
        userId: `${user?.id}`,
        limit: TABLE_ROW_LIMIT,
        search: debouncedSearchQuery,
        cursor: pageParam.cursor ?? undefined,
        direction: pageParam?.direction || "next",
      }),
    initialPageParam: { cursor: null, direction: "next" },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore
        ? { cursor: lastPage.nextCursor, direction: "next" }
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.prevCursor
        ? { cursor: firstPage.prevCursor, direction: "prev" }
        : undefined;
    },
    enabled: !!user?.id,
  });

  // Get the current page data
  const { prompts, hasMore } = useMemo(() => {
    if (!data?.pages) {
      return { prompts: [], hasMore: false };
    }

    const currentPage = data.pages[currentPageIndex];
    return {
      prompts: currentPage?.data ?? [],
      hasMore: currentPage?.hasMore ?? false,
    };
  }, [data, currentPageIndex]);

  const handlePrev = async () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    } else if (hasPreviousPage && !isFetchingPreviousPage) {
      await fetchPreviousPage();
    }
  };

  const handleNext = async () => {
    const totalPages = data?.pages?.length ?? 0;

    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    } else if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
      setCurrentPageIndex(totalPages);
    }
  };

  const canGoPrev =
    currentPageIndex > 0 || (hasPreviousPage && !isFetchingPreviousPage);

  const canGoNext =
    currentPageIndex < (data?.pages?.length ?? 0) - 1 ||
    (hasMore && hasNextPage && !isFetchingNextPage);

  const handleErrors = async (error: string, functionName: string) => {
    createErrorLog(supabase, {
      url_path: pathname,
      function_name: functionName,
      error_message: error,
    });
  };

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: PROMPT_FORM_DEFAULT_VALUES,
  });

  const addPromptMutation = useMutation({
    mutationFn: async (data: PromptFormValues) => {
      if (!user) throw new Error("User is not defined");
      return await createPrompt(supabase, { ...data, user_id: user.id });
    },
    onSuccess: () => {
      toast.success("Prompt saved successfully.");
      hidePrompt();
    },
    onError: (e) => {
      toast.error("Failed to save prompt.");
      handleErrors(JSON.stringify(e), "addPromptMutation");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updatePromptMutation = useMutation({
    mutationFn: async (data: PromptFormValues) => {
      return await updatePrompt(supabase, data);
    },
    onSuccess: () => {
      toast.success("Prompt updated successfully.");
      hidePrompt();
    },
    onError: (e) => {
      toast.error("Failed to update prompt.");
      handleErrors(JSON.stringify(e), "updatePromptMutation");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleOpenModal = (variable?: PromptTableRow) => {
    if (variable) {
      form.reset(variable);
      setIsEdit(true);
    }
    setShowPromptForm(true);
  };

  const hidePrompt = () => {
    form.reset(PROMPT_FORM_DEFAULT_VALUES);
    setIsEdit(false);
    setShowPromptForm(false);
  };

  const onSubmit = (data: PromptFormValues) => {
    if (isEdit) updatePromptMutation.mutate(data);
    else addPromptMutation.mutate(data);
  };

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/variables/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Something went wrong.");
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Variable deleted successfully.");
      closeDeleteDialog();
    },
    onError: (e) => {
      toast.error("Failed to delete variable.");
      handleErrors(JSON.stringify(e), "deletePromptMutation");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const openDeleteDialog = (id: string) => {
    setSelectedVariableId(id);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedVariableId(null);
  };

  const confirmDelete = () => {
    if (selectedVariableId) {
      deletePromptMutation.mutate(selectedVariableId);
    }
  };

  const columns: ColumnDef<PromptTableRow>[] = [
    { accessorKey: "label", header: "Label" },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => standardDateFormat(row.original.created_at),
    },
    {
      accessorKey: "updated_at",
      header: "Updated At",
      cell: ({ row }) =>
        row.original.updated_at
          ? standardDateFormat(row.original.created_at)
          : "Not Updated",
    },
    {
      accessorKey: "id",
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenModal(row.original)}
          >
            <Edit className="text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDeleteDialog(row.original.id)}
          >
            <X className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {showPromptForm ? (
        <FormProvider {...form}>
          <PromptForm
            isOpen={showPromptForm}
            onClose={hidePrompt}
            onSubmit={onSubmit}
            isLoading={
              addPromptMutation.isPending || updatePromptMutation.isPending
            }
            isEdit={isEdit}
          />
        </FormProvider>
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Prompts</h1>
            <p className="text-muted-foreground">Manage your prompts here.</p>
          </div>
          <Card>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="relative min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompt..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleOpenModal()}>
                  <Plus /> Add Prompt
                </Button>
              </div>

              <DataTable
                columns={columns}
                data={prompts}
                isLoading={
                  status === "pending" ||
                  isFetchingNextPage ||
                  isFetchingPreviousPage
                }
              />

              <div className="mt-1 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={!canGoPrev || isFetchingPreviousPage}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={!canGoNext || isFetchingNextPage}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
