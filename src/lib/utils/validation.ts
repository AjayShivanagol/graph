import * as z from "zod";

export function getNodeSchema(nodeType: string) {
  switch (nodeType) {
    case "task":
      return z.object({
        name: z.string().min(1, "Task name is required"),
        assignee: z.string().optional(),
        dueDate: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "inProgress", "completed", "cancelled"]),
      });
    case "condition":
      return z.object({
        name: z.string().min(1, "Condition name is required"),
        condition: z.string().optional(),
        description: z.string().optional(),
      });
    case "notification":
      return z.object({
        name: z.string().min(1, "Notification name is required"),
        recipients: z.string().optional(),
        message: z.string().optional(),
        channel: z.enum(["email", "sms", "push", "slack"]),
      });
    case "calendarEvent":
      return z.object({
        name: z.string().min(1, "Event name is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().min(1, "End date is required"),
        location: z.string().optional(),
        description: z.string().optional(),
      });
    case "document":
      return z.object({
        name: z.string().min(1, "Document name is required"),
        url: z.string().url("Invalid URL"),
        description: z.string().optional(),
      });
    case "database":
      return z.object({
        name: z.string().min(1, "Database name is required"),
        host: z.string().min(1, "Host is required"),
        port: z.number().min(1, "Port is required"),
        username: z.string().optional(),
      });
    case "email":
      return z.object({
        name: z.string().min(1, "Email name is required"),
        to: z.string().email("Invalid email address"),
        subject: z.string().min(1, "Subject is required"),
        body: z.string().optional(),
      });
    default:
      return z.object({
        name: z.string().min(1, "Name is required"),
      });
  }
}
