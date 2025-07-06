"use client";

import { PromptFormValues } from "@/schemas/prompt-schema";
import { ArrowLeft, Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PromptFormValues) => void;
  isLoading: boolean;
  isEdit: boolean;
};

export default function PromptForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  isEdit,
}: Props) {
  const form = useFormContext<PromptFormValues>();

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
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </header>

          <Separator className="my-8" />

          {/* --- Editor Content Area --- */}
          <main className="flex-grow space-y-10">
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
                      className="h-auto p-0 text-3xl md:text-5xl font-extrabold tracking-tight border-none shadow-none focus-visible:ring-0 dark:bg-transparent"
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
                    <Textarea
                      placeholder="Start writing your prompt here..."
                      {...field}
                      disabled={isLoading}
                      className="h-auto min-h-[300px] p-0 text-xl leading-relaxed border-none shadow-none resize-none focus-visible:ring-0 bg-transparent dark:bg-transparent"
                    />
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
