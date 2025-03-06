import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Institution table for managing multiple universities
export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  canvasInstanceUrl: text("canvas_instance_url").notNull(),
  canvasClientId: text("canvas_client_id").notNull(),
  canvasClientSecret: text("canvas_client_secret").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Update users table to include institution
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  institutionId: integer("institution_id").references(() => institutions.id),
  username: text("username").notNull(),
  password: text("password"), // Optional for SSO
  isProfessor: boolean("is_professor").notNull().default(true),
  canvasId: integer("canvas_id"),
  canvasToken: text("canvas_token"),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  institutionId: integer("institution_id").references(() => institutions.id),
  professorId: integer("professor_id").notNull(),
  courseId: integer("canvas_course_id"),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(),
  createdAt: text("created_at").notNull()
});

// Rest of the schema remains the same
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull(),
  name: text("name").notNull(),
  nuid: text("nuid").notNull(),
  gender: text("gender").notNull(),
  academicYear: text("academic_year").notNull(),
  ethnicity: text("ethnicity").notNull(),
  major: text("major").notNull(),
  nunStatus: text("nun_status").notNull(),
  skills: jsonb("skills").notNull()
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull(),
  name: text("name").notNull(),
  studentIds: integer("student_ids").array().notNull()
});

// Create insert schemas
export const insertInstitutionSchema = createInsertSchema(institutions);
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().optional(),
  canvasId: z.number().optional(),
  canvasToken: z.string().optional(),
});
export const insertFormSchema = createInsertSchema(forms);
export const insertStudentSchema = createInsertSchema(students);
export const insertGroupSchema = createInsertSchema(groups);

// Export types
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;