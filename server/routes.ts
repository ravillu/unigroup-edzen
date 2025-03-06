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

  // Add this after the other POST routes
  app.post("/api/forms/seed-test", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      // Create test form
      const form = await storage.createForm({
        professorId: req.user.id,
        title: "BUSN1011-SV Sample Form",
        description: "Test form with sample student data",
        questions: [
          { id: "speaking", text: "Public Speaking Comfort", type: "skill", min: 0, max: 5 },
          { id: "writing", text: "Writing Ability", type: "skill", min: 0, max: 5 },
          { id: "social", text: "Social Outgoingness", type: "skill", min: 0, max: 5 },
          { id: "excel", text: "Excel Proficiency", type: "skill", min: 0, max: 5 },
          { id: "business", text: "Business Planning Experience", type: "skill", min: 0, max: 5 }
        ],
        createdAt: new Date().toISOString()
      });

      // Sample student data
      const sampleStudents = [
        {
          name: "Sreevats Ramesh Ravillu",
          nuid: "002851945",
          major: "FIN - Finance",
          academicYear: "Sophomore",
          gender: "Male",
          ethnicity: "Asian",
          nunStatus: "No",
          skills: {
            "Public Speaking Comfort": 2,
            "Writing Ability": 2,
            "Social Outgoingness": 1,
            "Excel Proficiency": 4,
            "Business Planning Experience": 5
          }
        },
        {
          name: "Sven T Olson",
          nuid: "002851946",
          major: "FINTECH - Financial Technology",
          academicYear: "Freshman",
          gender: "Female",
          ethnicity: "Asian",
          nunStatus: "No",
          skills: {
            "Public Speaking Comfort": 1,
            "Writing Ability": 0,
            "Social Outgoingness": 1,
            "Excel Proficiency": 5,
            "Business Planning Experience": 5
          }
        },
        {
          name: "Sven T Olson",
          nuid: "002851947",
          major: "Explore Business",
          academicYear: "Freshman",
          gender: "Non-binary",
          ethnicity: "Asian",
          nunStatus: "No",
          skills: {
            "Public Speaking Comfort": 1,
            "Writing Ability": 2,
            "Social Outgoingness": 2,
            "Excel Proficiency": 4,
            "Business Planning Experience": 5
          }
        },
        {
          name: "Sreevats",
          nuid: "002851948",
          major: "FINTECH - Financial Technology",
          academicYear: "Sophomore",
          gender: "Female",
          ethnicity: "Asian",
          nunStatus: "No",
          skills: {
            "Public Speaking Comfort": 1,
            "Writing Ability": 1,
            "Social Outgoingness": 2,
            "Excel Proficiency": 5,
            "Business Planning Experience": 4
          }
        },
        {
          name: "Sreevats Ramesh Ravillu",
          nuid: "002851949",
          major: "FIN - Finance",
          academicYear: "Sophomore",
          gender: "Female",
          ethnicity: "Black or African American",
          nunStatus: "No",
          skills: {
            "Public Speaking Comfort": 2,
            "Writing Ability": 1,
            "Social Outgoingness": 1,
            "Excel Proficiency": 4,
            "Business Planning Experience": 3
          }
        },
        {
          name: "Sreevats Ramesh Ravillu",
          nuid: "002851950",
          major: "FINTECH - Financial Technology",
          academicYear: "Freshman",
          gender: "Female",
          ethnicity: "American Indian or Alaska Native",
          nunStatus: "No",
          skills: {
            "Public Speaking Comfort": 1,
            "Writing Ability": 1,
            "Social Outgoingness": 2,
            "Excel Proficiency": 4,
            "Business Planning Experience": 3
          }
        },
        {
          name: "Sven T Olson",
          nuid: "002851951",
          major: "FINTECH - Financial Technology",
          academicYear: "Sophomore",
          gender: "Female",
          ethnicity: "Asian",
          nunStatus: "No",
          skills: {
            "Public Speaking Comfort": 1,
            "Writing Ability": 2,
            "Social Outgoingness": 3,
            "Excel Proficiency": 4,
            "Business Planning Experience": 3
          }
        }
      ];

      // Add students to form
      for (const studentData of sampleStudents) {
        await storage.createStudent({
          ...studentData,
          formId: form.id
        });
      }

      res.status(201).json(form);
    } catch (error) {
      console.error('Failed to seed test data:', error);
      res.status(500).json({ message: "Failed to seed test data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}