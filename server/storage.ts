import { users, forms, students, groups } from "@shared/schema";
import { type User, type InsertUser, type Form, type InsertForm, type Student, type InsertStudent, type Group, type InsertGroup } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage {
  public sessionStore: session.Store;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Form methods
  async createForm(insertForm: InsertForm): Promise<Form> {
    const [form] = await db.insert(forms).values(insertForm).returning();
    return form;
  }

  async getFormsByProfessor(professorId: number): Promise<Form[]> {
    return await db.select().from(forms).where(eq(forms.professorId, professorId));
  }

  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form;
  }

  // Student methods
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async getStudentsByForm(formId: number): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.formId, formId));
  }

  // Group methods
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  async getGroupsByForm(formId: number): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.formId, formId));
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group> {
    const [group] = await db
      .update(groups)
      .set(groupData)
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  // Delete existing groups for a form
  private async deleteExistingGroups(formId: number): Promise<void> {
    await db.delete(groups).where(eq(groups.formId, formId));
  }

  async generateGroups(
    formId: number,
    students: Student[],
    groupSize: number,
    skillPriorities: Record<string, number>
  ): Promise<Group[]> {
    await this.deleteExistingGroups(formId);

    // Calculate student scores with weighted skills
    const studentScores = students.map(student => {
      let skillScore = 0;
      let maxSkill = 0;
      for (const [skill, priority] of Object.entries(skillPriorities)) {
        const skillLevel = (student.skills as any)[skill] || 0;
        skillScore += skillLevel * priority;
        if (skillLevel >= 4) maxSkill = Math.max(maxSkill, skillLevel);
      }

      return {
        student,
        skillScore,
        maxSkill,
        attributes: {
          gender: student.gender,
          ethnicity: student.ethnicity,
          nunStatus: student.nunStatus,
          academicYear: student.academicYear
        }
      };
    });

    // Sort by skill score and max skill level
    studentScores.sort((a, b) => {
      if (b.maxSkill !== a.maxSkill) return b.maxSkill - a.maxSkill;
      return b.skillScore - a.skillScore;
    });

    // Calculate number of groups based on user's specified group size
    const numGroups = Math.ceil(students.length / groupSize);

    const groups: { studentIds: number[]; metrics: any }[] = Array(numGroups)
      .fill(null)
      .map(() => ({ 
        studentIds: [],
        metrics: {
          genderCount: {},
          ethnicityCount: {},
          nunCount: 0,
          yearCount: {},
          skillLevels: {}
        }
      }));

    // Helper to find best group for a student
    const findBestGroup = (student: any) => {
      let bestGroupIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < groups.length; i++) {
        // Only allow groups that haven't reached the specified size
        if (groups[i].studentIds.length >= groupSize) continue;

        const group = groups[i];
        let score = 0;

        // Prefer smaller groups until they reach target size
        score += (groupSize - group.studentIds.length) * 2;

        // Gender balance score
        const genderCount = { ...group.metrics.genderCount };
        genderCount[student.attributes.gender] = (genderCount[student.attributes.gender] || 0) + 1;
        const genderRatio = Math.min(...Object.values(genderCount)) / Math.max(...Object.values(genderCount) || 1);
        score += genderRatio * 3;

        // Ethnic diversity score
        const ethnicityCount = { ...group.metrics.ethnicityCount };
        ethnicityCount[student.attributes.ethnicity] = (ethnicityCount[student.attributes.ethnicity] || 0) + 1;
        score += (Object.keys(ethnicityCount).length * 2);

        // NUin balance score
        const nunCount = group.metrics.nunCount + (student.attributes.nunStatus === 'Yes' ? 1 : 0);
        const nunRatio = 1 - Math.abs((nunCount / (group.studentIds.length + 1)) - 0.5);
        score += nunRatio * 2;

        // Academic year distribution
        const yearCount = { ...group.metrics.yearCount };
        yearCount[student.attributes.academicYear] = (yearCount[student.attributes.academicYear] || 0) + 1;
        score += Object.keys(yearCount).length * 1.5;

        // Skill distribution score
        for (const [skill, priority] of Object.entries(skillPriorities)) {
          const currentAvg = group.metrics.skillLevels[skill] || 0;
          const newSkillLevel = (student.student.skills as any)[skill] || 0;
          const newAvg = (currentAvg * group.studentIds.length + newSkillLevel) / (group.studentIds.length + 1);
          // Prefer balanced skill levels around 3-4 for high priority skills
          score += (5 - Math.abs(3.5 - newAvg)) * priority;
        }

        if (score > bestScore) {
          bestScore = score;
          bestGroupIndex = i;
        }
      }

      return bestGroupIndex;
    };

    // First pass: assign high-skill students
    for (const studentData of studentScores.filter(s => s.maxSkill >= 4)) {
      const groupIndex = findBestGroup(studentData);
      const group = groups[groupIndex];

      // Update group metrics
      group.studentIds.push(studentData.student.id);
      group.metrics.genderCount[studentData.attributes.gender] = 
        (group.metrics.genderCount[studentData.attributes.gender] || 0) + 1;
      group.metrics.ethnicityCount[studentData.attributes.ethnicity] = 
        (group.metrics.ethnicityCount[studentData.attributes.ethnicity] || 0) + 1;
      group.metrics.nunCount += studentData.attributes.nunStatus === 'Yes' ? 1 : 0;
      group.metrics.yearCount[studentData.attributes.academicYear] = 
        (group.metrics.yearCount[studentData.attributes.academicYear] || 0) + 1;

      // Update skill averages
      for (const [skill, level] of Object.entries(studentData.student.skills as Record<string, number>)) {
        group.metrics.skillLevels[skill] = group.metrics.skillLevels[skill] || 0;
        group.metrics.skillLevels[skill] = 
          (group.metrics.skillLevels[skill] * (group.studentIds.length - 1) + level) / group.studentIds.length;
      }
    }

    // Second pass: assign remaining students
    for (const studentData of studentScores.filter(s => s.maxSkill < 4)) {
      const groupIndex = findBestGroup(studentData);
      const group = groups[groupIndex];

      // Update group metrics (same as above)
      group.studentIds.push(studentData.student.id);
      group.metrics.genderCount[studentData.attributes.gender] = 
        (group.metrics.genderCount[studentData.attributes.gender] || 0) + 1;
      group.metrics.ethnicityCount[studentData.attributes.ethnicity] = 
        (group.metrics.ethnicityCount[studentData.attributes.ethnicity] || 0) + 1;
      group.metrics.nunCount += studentData.attributes.nunStatus === 'Yes' ? 1 : 0;
      group.metrics.yearCount[studentData.attributes.academicYear] = 
        (group.metrics.yearCount[studentData.attributes.academicYear] || 0) + 1;

      for (const [skill, level] of Object.entries(studentData.student.skills as Record<string, number>)) {
        group.metrics.skillLevels[skill] = group.metrics.skillLevels[skill] || 0;
        group.metrics.skillLevels[skill] = 
          (group.metrics.skillLevels[skill] * (group.studentIds.length - 1) + level) / group.studentIds.length;
      }
    }

    // Create groups in database
    const createdGroups: Group[] = [];
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].studentIds.length > 0) {
        const group = await this.createGroup({
          formId,
          name: `Group ${i + 1}`,
          studentIds: groups[i].studentIds
        });
        createdGroups.push(group);
      }
    }

    return createdGroups;
  }
}

export const storage = new DatabaseStorage();