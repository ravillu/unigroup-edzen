import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isProfessor: boolean("is_professor").notNull().default(true)
});

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(),
  createdAt: text("created_at").notNull()
});

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

export const insertUserSchema = createInsertSchema(users);
export const insertFormSchema = createInsertSchema(forms);
export const insertStudentSchema = createInsertSchema(students);
export const insertGroupSchema = createInsertSchema(groups);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type User = typeof users.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Group = typeof groups.$inferSelect;
