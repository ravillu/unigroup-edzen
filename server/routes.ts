import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertFormSchema, insertStudentSchema, insertGroupSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Forms
  app.post("/api/forms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const data = insertFormSchema.parse({
        ...req.body,
        professorId: req.user.id,
        createdAt: new Date().toISOString()
      });
      const form = await storage.createForm(data);
      res.status(201).json(form);
    } catch (error) {
      console.error('Failed to create form:', error);
      res.status(400).json({ message: "Invalid form data" });
    }
  });

  app.get("/api/forms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const forms = await storage.getFormsByProfessor(req.user.id);
      res.json(forms);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/:id", async (req, res) => {
    try {
      const form = await storage.getForm(parseInt(req.params.id));
      if (!form) return res.sendStatus(404);
      res.json(form);
    } catch (error) {
      console.error('Failed to fetch form:', error);
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  // Delete form and all associated data
  app.delete("/api/forms/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const formId = parseInt(req.params.id);
      await storage.deleteForm(formId);
      res.sendStatus(200);
    } catch (error) {
      console.error('Failed to delete form:', error);
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  // Students
  app.post("/api/forms/:formId/students", async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const form = await storage.getForm(formId);
      if (!form) return res.sendStatus(404);

      const data = insertStudentSchema.parse({
        ...req.body,
        formId
      });
      const student = await storage.createStudent(data);
      res.status(201).json(student);
    } catch (error) {
      console.error('Failed to create student:', error);
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  app.get("/api/forms/:formId/students", async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const students = await storage.getStudentsByForm(formId);
      res.json(students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Groups
  app.post("/api/forms/:formId/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const formId = parseInt(req.params.formId);
      const data = insertGroupSchema.parse({
        ...req.body,
        formId
      });
      const group = await storage.createGroup(data);
      res.status(201).json(group);
    } catch (error) {
      console.error('Failed to create group:', error);
      res.status(400).json({ message: "Invalid group data" });
    }
  });

  app.get("/api/forms/:formId/groups", async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const groups = await storage.getGroupsByForm(formId);
      res.json(groups);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.patch("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const group = await storage.updateGroup(id, req.body);
      res.json(group);
    } catch (error) {
      console.error('Failed to update group:', error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}