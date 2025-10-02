"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CloseOutlined } from "@ant-design/icons";
import { UseFormReturn } from "react-hook-form";
import { getNodeSchema } from "~/lib/utils/validation";
import { toast } from "sonner";

interface NodeConfigPanelProps {
  node: {
    id: string;
    type: string;
    data: any;
  };
  onUpdate: (id: string, data: any) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({
  node,
  onUpdate,
  onClose,
}: NodeConfigPanelProps) {
  const schema = getNodeSchema(node.type);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...node.data,
    },
  });

  // Update form when node changes
  useEffect(() => {
    form.reset(node.data);
  }, [node, form]);

  function onSubmit(data: any) {
    let requiredFields: string[] = [];

    switch (node.type) {
      case "task":
        requiredFields = ["name", "assignee", "dueDate", "status"];
        break;
      case "condition":
        requiredFields = ["name", "condition"];
        break;
      case "notification":
        requiredFields = ["name", "recipients", "message", "channel"];
        break;
      case "calendar":
        requiredFields = ["name", "date", "time"];
        break;
      case "database":
        requiredFields = ["name", "query"];
        break;
      case "document":
        requiredFields = ["name", "content"];
        break;
      case "email":
        requiredFields = ["name", "recipients", "subject", "body"];
        break;
      default:
        break;
    }

    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      console.log(missingFields);
      toast.error(
        `Please fill in the required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    onUpdate(node.id, data);
  }

  return (
    <div className="w-[350px] border-l bg-background p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Configure Node</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <CloseOutlined style={{ fontSize: 16 }} />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {node.type === "task" && <TaskNodeForm form={form} />}
          {node.type === "condition" && <ConditionNodeForm form={form} />}
          {node.type === "notification" && <NotificationNodeForm form={form} />}
          {node.type === "database" && <DatabaseNodeForm form={form} />}
          {node.type === "document" && <DocumentNodeForm form={form} />}
          {node.type === "email" && <EmailNodeForm form={form} />}

          <Button
            type="submit"
            variant={"secondary"}
            className="w-full bg-black text-white z-3"
          >
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}

function TaskNodeForm({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Task Name is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Task Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter task name" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="assignee"
        rules={{ required: "Assignee is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Assignee *</FormLabel>
            <FormControl>
              <Input placeholder="Enter assignee name" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="dueDate"
        rules={{ required: "Due Date is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Due Date *</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter task description"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="status"
        rules={{ required: "Status is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Status *</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="z-20">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    </>
  );
}

function ConditionNodeForm({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Condition Name is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Condition Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter condition name" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="condition"
        rules={{ required: "Condition Expression is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Condition Expression *</FormLabel>
            <FormControl>
              <Input placeholder="e.g. status === 'completed'" {...field} />
            </FormControl>
            <FormDescription>
              Enter a JavaScript-like condition expression
            </FormDescription>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter condition description"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    </>
  );
}

function NotificationNodeForm({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Notification Name is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Notification Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter notification name" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="recipients"
        rules={{ required: "Recipients are required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Recipients *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. john@example.com, team@example.com"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Comma-separated list of recipients
            </FormDescription>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="message"
        rules={{ required: "Message is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Message *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter notification message"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="channel"
        rules={{ required: "Channel is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Channel *</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="z-20">
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="push">Push Notification</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    </>
  );
}
function DatabaseNodeForm({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Database Name is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Database Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter database name" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="query"
        rules={{ required: "Query is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Query *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter database query"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter query description"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    </>
  );
}

function DocumentNodeForm({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Document Name is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Document Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter document name" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="content"
        rules={{ required: "Content is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Content *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter document content"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter document description"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    </>
  );
}

function EmailNodeForm({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Email Name is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Email Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter email name" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="recipients"
        rules={{ required: "Recipients are required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Recipients *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. john@example.com, team@example.com"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Comma-separated list of recipients
            </FormDescription>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="subject"
        rules={{ required: "Subject is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Subject *</FormLabel>
            <FormControl>
              <Input placeholder="Enter email subject" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="body"
        rules={{ required: "Body is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Body *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter email body"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    </>
  );
}
