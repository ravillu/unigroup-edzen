import { users, forms, students, groups, institutions } from "@shared/schema";
import { type User, type InsertUser, type Form, type InsertForm, type Student, type InsertStudent, type Group, type InsertGroup, type Institution, type InsertInstitution } from "@shared/schema";
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

  // Institution methods
  async getInstitution(id: number): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution;
  }

  async createInstitution(insertInstitution: InsertInstitution): Promise<Institution> {
    const [institution] = await db.insert(institutions).values(insertInstitution).returning();
    return institution;
  }

  async updateInstitution(id: number, data: Partial<InsertInstitution>): Promise<Institution> {
    const [institution] = await db
      .update(institutions)
      .set(data)
      .where(eq(institutions.id, id))
      .returning();
    return institution;
  }

  async getAllInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions);
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

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Form methods with institution support
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

  // Delete form and all associated data
  async deleteForm(formId: number): Promise<void> {
    // Delete associated groups first
    await db.delete(groups).where(eq(groups.formId, formId));

    // Delete associated students
    await db.delete(students).where(eq(students.formId, formId));

    // Finally delete the form
    await db.delete(forms).where(eq(forms.id, formId));
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

    // Calculate student scores and identify key skills
    const studentScores = students.map(student => {
      let skillScore = 0;
      let maxSkill = 0;
      let keySkills = new Set<string>();

      for (const [skill, priority] of Object.entries(skillPriorities)) {
        const skillLevel = (student.skills as any)[skill] || 0;
        skillScore += skillLevel * priority;
        if (skillLevel >= 4) {
          maxSkill = Math.max(maxSkill, skillLevel);
          keySkills.add(skill);
        }
      }

      return {
        student,
        skillScore,
        maxSkill,
        keySkills,
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

    // Calculate optimal group distribution
    const numStudents = students.length;
    const numGroups = Math.ceil(numStudents / groupSize);
    const minStudentsPerGroup = Math.floor(numStudents / numGroups);
    const extraStudents = numStudents % numGroups;

    // Initialize groups with target sizes
    const groups: { 
      studentIds: number[]; 
      targetSize: number;
      metrics: {
        genderCount: Record<string, number>;
        ethnicityCount: Record<string, number>;
        nunCount: number;
        yearCount: Record<string, number>;
        skillLevels: Record<string, number>;
        keySkills: Set<string>;
      }
    }[] = Array(numGroups).fill(null).map((_, i) => ({
      studentIds: [],
      targetSize: minStudentsPerGroup + (i < extraStudents ? 1 : 0),
      metrics: {
        genderCount: {},
        ethnicityCount: {},
        nunCount: 0,
        yearCount: {},
        skillLevels: {},
        keySkills: new Set()
      }
    }));

    // Helper to find best group for a student
    const findBestGroup = (student: any) => {
      let bestGroupIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < groups.length; i++) {
        if (groups[i].studentIds.length >= groups[i].targetSize) continue;

        const group = groups[i];
        let score = 0;

        // Group size balance - strongly prefer filling up to target size
        score += (group.targetSize - group.studentIds.length) * 5;

        // Gender balance
        const genderCount = { ...group.metrics.genderCount };
        genderCount[student.attributes.gender] = (genderCount[student.attributes.gender] || 0) + 1;
        const genderRatio = Math.min(...Object.values(genderCount)) / (Math.max(...Object.values(genderCount)) || 1);
        score += genderRatio * 4;

        // Ethnic diversity
        const ethnicityCount = { ...group.metrics.ethnicityCount };
        ethnicityCount[student.attributes.ethnicity] = (ethnicityCount[student.attributes.ethnicity] || 0) + 1;
        score += (Object.keys(ethnicityCount).length * 3);

        // Academic year distribution
        const yearCount = { ...group.metrics.yearCount };
        yearCount[student.attributes.academicYear] = (yearCount[student.attributes.academicYear] || 0) + 1;
        score += Object.keys(yearCount).length * 2;

        // Skill distribution - ensure key skills are spread across groups
        for (const skill of student.keySkills) {
          if (!group.metrics.keySkills.has(skill)) {
            score += 5; // Bonus for adding a missing key skill
          }
        }

        // Average skill levels
        for (const [skill, priority] of Object.entries(skillPriorities)) {
          const currentAvg = group.metrics.skillLevels[skill] || 0;
          const newSkillLevel = (student.student.skills as any)[skill] || 0;
          const newAvg = (currentAvg * group.studentIds.length + newSkillLevel) / (group.studentIds.length + 1);
          score += (5 - Math.abs(3.5 - newAvg)) * priority;
        }

        if (score > bestScore) {
          bestScore = score;
          bestGroupIndex = i;
        }
      }

      return bestGroupIndex;
    };

    // Distribute students
    for (const studentData of studentScores) {
      const groupIndex = findBestGroup(studentData);
      const group = groups[groupIndex];

      // Update group
      group.studentIds.push(studentData.student.id);

      // Update metrics
      group.metrics.genderCount[studentData.attributes.gender] = 
        (group.metrics.genderCount[studentData.attributes.gender] || 0) + 1;
      group.metrics.ethnicityCount[studentData.attributes.ethnicity] = 
        (group.metrics.ethnicityCount[studentData.attributes.ethnicity] || 0) + 1;
      group.metrics.nunCount += studentData.attributes.nunStatus === 'Yes' ? 1 : 0;
      group.metrics.yearCount[studentData.attributes.academicYear] = 
        (group.metrics.yearCount[studentData.attributes.academicYear] || 0) + 1;

      // Update skill metrics
      for (const [skill, level] of Object.entries(studentData.student.skills as Record<string, number>)) {
        group.metrics.skillLevels[skill] = group.metrics.skillLevels[skill] || 0;
        group.metrics.skillLevels[skill] = 
          (group.metrics.skillLevels[skill] * (group.studentIds.length - 1) + level) / group.studentIds.length;
      }

      // Add key skills
      for (const skill of studentData.keySkills) {
        group.metrics.keySkills.add(skill);
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