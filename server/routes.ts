import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertFormSchema, insertStudentSchema, insertGroupSchema, insertInstitutionSchema } from "@shared/schema";
import { canvasService, createCanvasService } from "./services/canvas"; // Updated import
import { createCanvasAuthService } from "./services/canvas-auth";
import { createLTIService } from "./services/lti";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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

  // Canvas OAuth routes
  app.get("/api/auth/canvas", async (req, res) => {
    try {
      if (!req.query.institution_id) {
        return res.status(400).json({ message: "Institution ID is required" });
      }

      const institutionId = parseInt(req.query.institution_id as string);
      const institution = await storage.getInstitution(institutionId);

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const authService = createCanvasAuthService(institution);
      const authUrl = authService.getAuthorizationUrl(institutionId.toString());
      res.redirect(authUrl);
    } catch (error) {
      console.error('Canvas auth error:', error);
      res.redirect('/auth?error=canvas_auth_failed');
    }
  });

  app.get("/api/auth/canvas/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || typeof code !== 'string' || !state) {
        throw new Error('Invalid authorization code or state');
      }

      const institutionId = parseInt(state as string);
      const institution = await storage.getInstitution(institutionId);

      if (!institution) {
        throw new Error('Institution not found');
      }

      const authService = createCanvasAuthService(institution);

      // Exchange code for token
      const tokenData = await authService.getTokenFromCode(code);

      // Get user profile
      const profile = await authService.getUserProfile(tokenData.access_token);

      // Store institution and token in session
      req.session.canvasToken = tokenData.access_token;
      req.session.institutionId = institutionId;

      // Update or create user
      let user = await storage.getUserByUsername(profile.login_id);
      if (!user) {
        user = await storage.createUser({
          username: profile.login_id,
          email: profile.primary_email,
          institutionId,
          canvasId: profile.id,
          canvasToken: tokenData.access_token
        });
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          res.redirect('/auth?error=login_failed');
          return;
        }
        res.redirect('/');
      });
    } catch (error) {
      console.error('Canvas OAuth error:', error);
      res.redirect('/auth?error=canvas_auth_failed');
    }
  });

  // LTI Configuration endpoint
  app.get("/api/lti/config/:institutionId", async (req, res) => {
    try {
      const institutionId = parseInt(req.params.institutionId);
      const institution = await storage.getInstitution(institutionId);

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const ltiService = createLTIService(institution);
      res.json(ltiService.getLTIConfig());
    } catch (error) {
      console.error('LTI config error:', error);
      res.status(500).json({ message: "Failed to generate LTI configuration" });
    }
  });

  // Canvas API routes (updated to use user-specific Canvas service)
  app.get("/api/canvas/courses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const canvasService = createCanvasService(req.user);
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
      const canvasService = createCanvasService(req.user);
      const students = await canvasService.getCourseStudents(courseId);
      res.json(students);
    } catch (error) {
      console.error('Failed to fetch Canvas students:', error);
      res.status(500).json({ message: "Failed to fetch Canvas students" });
    }
  });

  // Add this route to handle Canvas assignment creation
  app.post("/api/canvas/courses/:courseId/assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const courseId = parseInt(req.params.courseId);
      const { formId, name, description } = req.body;

      // Get the submission URL
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const submissionUrl = `${baseUrl}/forms/${formId}/submit`;

      // Create assignment in Canvas using user's credentials
      const canvasService = createCanvasService(req.user);
      const assignment = await canvasService.createAssignment(courseId, {
        name,
        description: `${description ? description + "\n\n" : ""}Welcome to ${name}!\n\nPlease fill the personal profile survey using the link below before the start of your class.\n\n<a href="${submissionUrl}" target="_blank">Click here to access the group formation survey</a>`,
        submission_types: ["none"],
        published: true
      });

      res.json(assignment);
    } catch (error) {
      console.error('Failed to create Canvas assignment:', error);
      res.status(500).json({ message: "Failed to create Canvas assignment" });
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