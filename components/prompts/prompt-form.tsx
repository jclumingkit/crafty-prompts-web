"use client";

import { getVariablesQueryKey } from "@/app/(with-logged-in-user)/variables/queries";
import { PromptFormValues } from "@/schemas/prompt-schema";
import useAuthStore from "@/stores/use-auth-store";
import { getVariables } from "@/utils/supabase/api/get";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { ArrowLeft, Info, Loader, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import getCaretCoordinates from "textarea-caret";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PromptFormValues) => void;
  isLoading: boolean;
};

export default function PromptForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: Props) {
  const { user } = useAuthStore();
  const supabase = createSupabaseBrowserClient();
  const form = useFormContext<PromptFormValues>();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [triggerIndex, setTriggerIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchQuery = useDebounce(searchTerm, 300);
  const queryKey = getVariablesQueryKey(debouncedSearchQuery);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toLowerCase().includes("mac");
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlOrCmd && e.key === "Enter") {
        e.preventDefault();
        onSubmit(form.getValues());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (showToolbar && toolbarRef.current && textareaRef.current) {
      const toolbarEl = toolbarRef.current;
      const textareaEl = textareaRef.current;

      const coords = getCaretCoordinates(textareaEl, textareaEl.selectionStart);
      const containerRect = textareaEl.parentElement?.getBoundingClientRect();

      const leftOffset = coords.left;
      const topOffset = coords.top;

      const toolbarWidth = toolbarEl.offsetWidth;
      const availableSpaceRight =
        window.innerWidth - (containerRect?.left ?? 0) - leftOffset;

      const adjustedLeft =
        availableSpaceRight < toolbarWidth
          ? leftOffset - toolbarWidth
          : leftOffset;

      setToolbarPosition({
        top: topOffset + 24,
        left: adjustedLeft,
      });
    }
  }, [showToolbar]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({
        pageParam,
      }: {
        pageParam: { cursor: string | null; direction: string };
      }) =>
        getVariables(supabase, {
          userId: `${user?.id}`,
          limit: 1,
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

  const { variables, hasMore } = useMemo(() => {
    if (!data?.pages) {
      return { variables: [], hasMore: false };
    }

    const allVariables = data.pages.flatMap((page) => page?.data ?? []);
    const lastPage = data.pages[data.pages.length - 1];

    return {
      variables: allVariables,
      hasMore: lastPage?.hasMore ?? false,
    };
  }, [data]);

  const handleNext = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    const selectionStart = e.currentTarget.selectionStart;

    const beforeCursor = value.slice(0, selectionStart);
    const lastTwo = beforeCursor.slice(-2);
    const isDeleting = ["Backspace", "Delete"].includes(e.key);

    if (isDeleting) return;

    if (lastTwo === "//") {
      const coords = getCaretCoordinates(e.currentTarget, selectionStart);
      const containerRect =
        e.currentTarget.parentElement?.getBoundingClientRect();

      if (containerRect) {
        setToolbarPosition({
          top: coords.top,
          left: coords.left,
        });
      }

      setTriggerIndex(selectionStart - 2);
      setShowToolbar(true);
    } else if (e.key === "Escape") {
      setShowToolbar(false);
      setTriggerIndex(null);
    }
  };

  const insertVariable = (
    variable: string,
    fieldOnChange: (value: string | undefined) => void
  ) => {
    if (!textareaRef.current || triggerIndex === null) return;

    const el = textareaRef.current;
    const value = el.value;

    const before = value.slice(0, triggerIndex);
    const after = value.slice(el.selectionStart);

    const newValue = `${before}{{${variable}}}${after}`;
    const newCursor = `${before}{{${variable}}}`.length;

    fieldOnChange(newValue);

    setTimeout(() => {
      el.setSelectionRange(newCursor, newCursor);
      el.focus();
    }, 0);

    setShowToolbar(false);
    setTriggerIndex(null);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          {/* --- Main Actions Header --- */}
          <header className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={isLoading}
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground"
              ref={buttonRef}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <div className="flex wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Info />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Type //var to insert variables. Press Ctrl (or Cmd) + Enter
                    to save.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </header>

          {/* --- Editor Content Area --- */}
          <main className="mt-8 flex-grow space-y-5">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Prompt Title"
                      {...field}
                      disabled={isLoading}
                      className="h-auto p-0 text-xl md:text-2xl font-extrabold tracking-tight border-none shadow-none focus-visible:ring-0 dark:bg-transparent"
                    />
                  </FormControl>
                  <FormMessage className="pt-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder="Start writing your prompt here or type //commands..."
                        onKeyDown={handleKeyDown}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        className="h-auto min-h-[300px] p-0 text-xl leading-relaxed border-none shadow-none resize-none focus-visible:ring-0 bg-transparent dark:bg-transparent"
                        maxLength={3000}
                      />

                      {showToolbar && (
                        <div
                          ref={toolbarRef}
                          className="absolute z-50 w-48 rounded-lg bg-muted"
                          style={{
                            top: toolbarPosition.top,
                            left: toolbarPosition.left,
                          }}
                        >
                          <div className="p-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Press &apos;Esc&apos; to close.
                            </p>
                            <Input
                              placeholder="Search variable..."
                              className="h-8 w-full rounded-md border-zinc-200 bg-transparent px-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:text-zinc-50"
                              value={searchTerm}
                              onChange={(e) =>
                                setSearchTerm(e.currentTarget.value)
                              }
                            />
                          </div>
                          <ScrollArea className="min-h-auto max-h-72 p-2 pt-0">
                            <div>
                              {variables.map(({ id, value }) => (
                                <div
                                  key={id}
                                  className="cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  onClick={() =>
                                    insertVariable(value, field.onChange)
                                  }
                                >
                                  {value}
                                </div>
                              ))}
                            </div>
                            {hasMore && (
                              <>
                                <Separator className="my-sm" />
                                <Button
                                  type="button"
                                  className="w-full mb-2"
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleNext}
                                  disabled={isFetchingNextPage}
                                >
                                  <Loader className="h-3 w-3" /> Load more
                                </Button>
                              </>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="pt-2" />
                </FormItem>
              )}
            />
          </main>
        </form>
      </Form>
    </div>
  );
}
