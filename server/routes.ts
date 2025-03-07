import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertFormSchema, insertStudentSchema, insertGroupSchema, insertInstitutionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/init", async (req, res) => {
    try {
      const institutions = await storage.getAllInstitutions();
      if (institutions.length === 0) {
        await storage.createInstitution({
          name: "Northeastern University",
          canvasInstanceUrl: process.env.CANVAS_INSTANCE_URL || "https://northeastern.instructure.com",
          canvasClientId: "your_client_id",
          canvasClientSecret: "your_client_secret",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('Created initial Northeastern institution');
      }
      res.json({ message: "Initialization complete" });
    } catch (error) {
      console.error('Initialization error:', error);
      res.status(500).json({ message: "Failed to initialize" });
    }
  });

  // Institution Management Routes
  app.post("/api/institutions", async (req, res) => {
    try {
      const data = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      res.status(201).json(institution);
    } catch (error) {
      console.error('Failed to create institution:', error);
      res.status(500).json({ message: "Failed to create institution" });
    }
  });

  app.get("/api/institutions", async (req, res) => {
    try {
      const institutions = await storage.getAllInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error('Failed to fetch institutions:', error);
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  app.get("/api/institutions/:id", async (req, res) => {
    try {
      const institutionId = parseInt(req.params.id);
      const institution = await storage.getInstitution(institutionId);

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      res.json(institution);
    } catch (error) {
      console.error('Failed to fetch institution:', error);
      res.status(500).json({ message: "Failed to fetch institution" });
    }
  });


  // Forms
  app.post("/api/forms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertFormSchema.parse({
      ...req.body,
      professorId: req.user.id,
      institutionId: req.user.institutionId,
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

  app.patch("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const group = await storage.updateGroup(id, req.body);
    res.json(group);
  });

  const httpServer = createServer(app);
  return httpServer;
}