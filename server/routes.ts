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
      const { institution_id } = req.query;

      if (!institution_id) {
        return res.status(400).json({ message: "Institution ID is required" });
      }

      // Validate environment variables
      if (!process.env.CANVAS_CLIENT_ID || !process.env.CANVAS_CLIENT_SECRET) {
        console.error('Missing Canvas credentials:', {
          clientId: !!process.env.CANVAS_CLIENT_ID,
          clientSecret: !!process.env.CANVAS_CLIENT_SECRET
        });
        return res.status(500).json({ message: "Canvas integration is not properly configured" });
      }

      // Test institution setup for Canvas.instructure.com
      const testInstitution = {
        id: parseInt(institution_id as string),
        name: "Test Institution",
        canvasInstanceUrl: "canvas.instructure.com",
        canvasClientId: process.env.CANVAS_CLIENT_ID,
        canvasClientSecret: process.env.CANVAS_CLIENT_SECRET,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating Canvas auth service with:', {
        instanceUrl: testInstitution.canvasInstanceUrl,
        hasClientId: !!testInstitution.canvasClientId,
        hasClientSecret: !!testInstitution.canvasClientSecret
      });

      const authService = createCanvasAuthService(testInstitution);
      const state = institution_id as string;
      const authUrl = authService.getAuthorizationUrl(state);

      console.log('Redirecting to Canvas auth URL:', authUrl);
      res.redirect(authUrl);
    } catch (error) {
      console.error('Canvas auth error:', error);
      res.redirect('/canvas?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Canvas auth failed'));
    }
  });

  app.get("/api/auth/canvas/callback", async (req, res) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        throw new Error('Invalid authorization code');
      }

      // For test institution
      const testInstitution = {
        id: 1,
        name: "Test Institution",
        canvasInstanceUrl: "canvas.instructure.com",
        canvasClientId: process.env.CANVAS_CLIENT_ID,
        canvasClientSecret: process.env.CANVAS_CLIENT_SECRET,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const authService = createCanvasAuthService(testInstitution);
      const tokenData = await authService.getTokenFromCode(code);

      // Get Canvas user profile
      const profile = await authService.getUserProfile(tokenData.access_token);

      // Update user with Canvas token
      const updatedUser = await storage.updateUser(req.user.id, {
        canvasToken: tokenData.access_token,
        updatedAt: new Date()
      });

      // Update the session
      req.user.canvasToken = tokenData.access_token;

      res.redirect('/');
    } catch (error) {
      console.error('Canvas OAuth callback error:', error);
      res.redirect('/canvas?error=canvas_auth_failed');
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

  // Add this route handler in the appropriate section of routes.ts
  app.patch("/api/user/canvas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { canvasInstanceUrl, canvasToken } = req.body;

      // Test the Canvas credentials before saving
      const testService = createCanvasService({
        ...req.user,
        canvasInstanceUrl,
        canvasToken
      });

      // Try to fetch courses to verify credentials
      await testService.getCourses();

      // Update user with new Canvas credentials
      const updatedUser = await storage.updateUser(req.user.id, {
        canvasInstanceUrl,
        canvasToken
      });

      // Update session
      req.session.canvasToken = canvasToken;

      res.json(updatedUser);
    } catch (error) {
      console.error('Failed to update Canvas credentials:', error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update Canvas credentials"
      });
    }
  });

  // Add this route handler in the appropriate section of routes.ts
  app.patch("/api/user/skip-canvas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Update user to mark Canvas setup as skipped
      const updatedUser = await storage.updateUser(req.user.id, {
        canvasSetupSkipped: true,
        updatedAt: new Date()
      });

      // Update the session user data
      req.user.canvasSetupSkipped = true;

      res.json(updatedUser);
    } catch (error) {
      console.error('Failed to skip Canvas setup:', error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to skip Canvas setup"
      });
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

  // Add new group generation route with proper error handling
  app.post("/api/forms/:formId/groups/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const formId = parseInt(req.params.formId);
      const { groupSize, skillPriorities } = req.body;

      // Input validation
      if (!groupSize || typeof groupSize !== 'number' || groupSize < 2) {
        return res.status(400).json({ message: "Invalid group size" });
      }

      if (!skillPriorities || typeof skillPriorities !== 'object') {
        return res.status(400).json({ message: "Invalid skill priorities" });
      }

      // Get form and students
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      const students = await storage.getStudentsByForm(formId);
      if (!students.length) {
        return res.status(400).json({ message: "No students available for group generation" });
      }

      // Generate groups
      const groups = await storage.generateGroups(formId, students, groupSize, skillPriorities);

      // Send JSON response
      res.setHeader('Content-Type', 'application/json');
      res.json(groups);
    } catch (error) {
      console.error('Error generating groups:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to generate groups"
      });
    }
  });

  // Add this route handler for publishing groups to Canvas
  app.post("/api/forms/:formId/groups/publish", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const formId = parseInt(req.params.formId);
      const { courseId } = req.body;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Get form details
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Get existing groups
      const groups = await storage.getGroupsByForm(formId);
      if (!groups.length) {
        return res.status(400).json({ message: "No groups found to publish" });
      }

      // Get students for mapping Canvas IDs
      const students = await storage.getStudentsByForm(formId);

      // Create Canvas service instance
      const canvasService = createCanvasService(req.user);

      // Create a group category in Canvas
      const groupCategory = await canvasService.createGroupCategory(courseId, {
        name: `${form.title} Groups`,
        description: "Automatically generated groups using UniGroup's AI algorithm"
      });

      // Create each group in Canvas and add members
      const canvasGroups = await Promise.all(
        groups.map(async (group) => {
          const groupStudents = students.filter(s => group.studentIds.includes(s.id));
          const canvasUserIds = groupStudents.map(s => s.canvasId).filter(Boolean);

          return await canvasService.createGroup(groupCategory.id, {
            name: group.name,
            description: `Group members: ${groupStudents.map(s => s.name).join(', ')}`,
            users: canvasUserIds as number[]
          });
        })
      );

      res.json({
        message: "Groups successfully published to Canvas",
        groupCategory,
        groups: canvasGroups
      });
    } catch (error) {
      console.error('Error publishing groups to Canvas:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to publish groups to Canvas"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}