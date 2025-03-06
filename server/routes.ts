import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertFormSchema, insertStudentSchema, insertGroupSchema } from "@shared/schema";
import { canvasService } from "./services/canvas";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Forms
  app.post("/api/forms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertFormSchema.parse({
      ...req.body,
      professorId: req.user.id,
      createdAt: new Date().toISOString()
    });
    const form = await storage.createForm(data);
    res.status(201).json(form);
  });

  app.get("/api/forms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const forms = await storage.getFormsByProfessor(req.user.id);
    res.json(forms);
  });

  app.get("/api/forms/:id", async (req, res) => {
    const form = await storage.getForm(parseInt(req.params.id));
    if (!form) return res.sendStatus(404);
    res.json(form);
  });

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
    const formId = parseInt(req.params.formId);
    const form = await storage.getForm(formId);
    if (!form) return res.sendStatus(404);

    const data = insertStudentSchema.parse({
      ...req.body,
      formId
    });
    const student = await storage.createStudent(data);
    res.status(201).json(student);
  });

  app.get("/api/forms/:formId/students", async (req, res) => {
    const formId = parseInt(req.params.formId);
    const students = await storage.getStudentsByForm(formId);
    res.json(students);
  });

  // Groups
  app.post("/api/forms/:formId/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const formId = parseInt(req.params.formId);

    const data = insertGroupSchema.parse({
      ...req.body,
      formId
    });
    const group = await storage.createGroup(data);
    res.status(201).json(group);
  });

  app.get("/api/forms/:formId/groups", async (req, res) => {
    const formId = parseInt(req.params.formId);
    const groups = await storage.getGroupsByForm(formId);
    res.json(groups);
  });

  // Group Generation
  app.post("/api/forms/:formId/groups/generate", async (req, res) => {
    try {
      const formId = parseInt(req.params.formId);
      const { groupSize, skillPriorities } = req.body;

      if (!groupSize || typeof groupSize !== 'number' || groupSize < 2 || groupSize > 8) {
        return res.status(400).json({ message: "Invalid group size. Must be between 2 and 8." });
      }

      // Get students and form data
      const students = await storage.getStudentsByForm(formId);
      const form = await storage.getForm(formId);

      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      if (students.length === 0) {
        return res.status(400).json({ message: "No students available for grouping" });
      }

      // Generate groups
      const groups = await storage.generateGroups(formId, students, groupSize, skillPriorities);
      res.json(groups);
    } catch (error) {
      console.error('Group generation error:', error);
      res.status(500).json({ message: "Failed to generate groups" });
    }
  });

  app.patch("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const group = await storage.updateGroup(id, req.body);
    res.json(group);
  });

  // Added Canvas routes
  app.get("/api/canvas/courses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const courses = await canvasService.getCourses();
      res.json(courses);
    } catch (error) {
      console.error('Failed to fetch Canvas courses:', error);
      res.status(500).json({ message: "Failed to fetch Canvas courses" });
    }
  });

  app.get("/api/canvas/courses/:courseId/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const courseId = parseInt(req.params.courseId);
      const students = await canvasService.getCourseStudents(courseId);
      res.json(students);
    } catch (error) {
      console.error('Failed to fetch Canvas students:', error);
      res.status(500).json({ message: "Failed to fetch Canvas students" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}