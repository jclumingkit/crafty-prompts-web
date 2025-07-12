"use client";

import { getVariablesQueryKey } from "@/app/(with-logged-in-user)/variables/queries";
import {
  VARIABLE_FORM_DEFAULT_VALUES,
  VariableFormValues,
  variableSchema,
} from "@/schemas/variable-schema";
import useAuthStore from "@/stores/use-auth-store";
import { TABLE_ROW_LIMIT } from "@/utils/constant";
import { standardDateFormat } from "@/utils/functions";
import { deleteVariable } from "@/utils/supabase/api/delete";
import { getVariables } from "@/utils/supabase/api/get";
import { createErrorLog, createVariable } from "@/utils/supabase/api/post";
import { updateVariable } from "@/utils/supabase/api/update";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { VariableTableRow } from "@/utils/supabase/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import dayjs from "dayjs";
import { Edit, Info, Plus, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import DataTable from "../ui/datatable";
import { Input } from "../ui/input";
import VariableFormDialog from "./variable-form-dialog";

export default function VariablesPage() {
  const { user } = useAuthStore();
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(
    null
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const debouncedSearchQuery = useDebounce(searchTerm, 300);
  const [isEdit, setIsEdit] = useState(false);
  const queryKey = getVariablesQueryKey(debouncedSearchQuery);

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
      getVariables(supabase, {
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
  const { variables, hasMore } = useMemo(() => {
    if (!data?.pages) {
      return { variables: [], hasMore: false };
    }

    const currentPage = data.pages[currentPageIndex];
    return {
      variables: currentPage?.data ?? [],
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

  const form = useForm<VariableFormValues>({
    resolver: zodResolver(variableSchema),
    defaultValues: VARIABLE_FORM_DEFAULT_VALUES,
  });

  const variableMutation = useMutation({
    mutationFn: async (data: VariableFormValues) => {
      if (!user) throw new Error("User is not defined");
      return isEdit
        ? await updateVariable(supabase, {
            ...data,
            updated_at: dayjs().toISOString(),
          })
        : await createVariable(supabase, { ...data, user_id: user.id });
    },
    onSuccess: () => {
      toast.success("Variable added successfully.");
      closeModal();
    },
    onError: (e) => {
      if (e.message.includes("duplicate")) {
        form.setError("label", { message: "Label already exists." });
      } else {
        toast.error("Failed to add variable.");
        handleErrors(JSON.stringify(e), "addVariableMutation");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleOpenModal = (variable?: VariableTableRow) => {
    if (variable) {
      form.reset(variable);
      setIsEdit(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    form.reset(VARIABLE_FORM_DEFAULT_VALUES);
    setIsEdit(false);
    setIsModalOpen(false);
  };

  const onSubmit = (data: VariableFormValues) => {
    variableMutation.mutate(data);
  };

  const deleteVariableMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteVariable(supabase, id);
    },
    onSuccess: () => {
      toast.success("Variable deleted successfully.");
      closeDeleteDialog();
    },
    onError: (e) => {
      toast.error("Failed to delete variable.");
      handleErrors(JSON.stringify(e), "deleteVariableMutation");
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
      deleteVariableMutation.mutate(selectedVariableId);
    }
  };

  const columns: ColumnDef<VariableTableRow>[] = [
    { accessorKey: "label", header: "Label" },
    { accessorKey: "value", header: "Value" },
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
          ? standardDateFormat(row.original.updated_at)
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Variables</h1>
        <p className="text-muted-foreground">
          Manage your prompt variables here.
        </p>
      </div>

      <Alert>
        <Info />
        <AlertTitle>How to use variables</AlertTitle>
        <AlertDescription>
          Use {`{{variable_label}}`} in your prompts. The system will
          automatically replace it with its value.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search variables..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenModal()}>
              <Plus /> Add Variable
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={variables}
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
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
        isLoading={deleteVariableMutation.isPending}
      />
      <FormProvider {...form}>
        <VariableFormDialog
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={onSubmit}
          isLoading={variableMutation.isPending}
          isEdit={isEdit}
        />
      </FormProvider>
    </>
  );
}
