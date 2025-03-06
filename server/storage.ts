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

  // Group generation method
  async generateGroups(
    formId: number,
    students: Student[],
    groupSize: number,
    skillPriorities: Record<string, number>
  ): Promise<Group[]> {
    // Delete existing groups first
    await this.deleteExistingGroups(formId);

    // Calculate student scores and metadata
    const studentScores = students.map(student => {
      // Calculate weighted skill score
      let skillScore = 0;
      for (const [skill, priority] of Object.entries(skillPriorities)) {
        skillScore += ((student.skills as any)[skill] || 0) * priority;
      }

      return {
        student,
        skillScore,
        metadata: {
          gender: student.gender,
          ethnicity: student.ethnicity,
          nunStatus: student.nunStatus,
          academicYear: student.academicYear
        }
      };
    });

    // Sort students by skill score
    studentScores.sort((a, b) => b.skillScore - a.skillScore);

    // Calculate number of groups
    const numGroups = Math.ceil(students.length / groupSize);
    const groups: { studentIds: number[] }[] = Array(numGroups)
      .fill(null)
      .map(() => ({ studentIds: [] }));

    // Helper function to calculate group diversity score
    const calculateGroupDiversity = (group: number[], newStudent: any) => {
      const groupStudents = group.map(id => 
        studentScores.find(s => s.student.id === id)!
      );

      let diversityScore = 0;

      // Check gender balance
      const genderCounts = new Map();
      [...groupStudents, newStudent].forEach(s => {
        genderCounts.set(s.metadata.gender, (genderCounts.get(s.metadata.gender) || 0) + 1);
      });
      diversityScore += Math.min(...Array.from(genderCounts.values())) / Math.max(...Array.from(genderCounts.values()));

      // Check ethnicity diversity
      const ethnicityCounts = new Map();
      [...groupStudents, newStudent].forEach(s => {
        ethnicityCounts.set(s.metadata.ethnicity, (ethnicityCounts.get(s.metadata.ethnicity) || 0) + 1);
      });
      diversityScore += ethnicityCounts.size / ([...groupStudents, newStudent].length);

      // Check NUin status mix
      const nuinCount = [...groupStudents, newStudent].filter(s => s.metadata.nunStatus === 'Yes').length;
      diversityScore += Math.abs(nuinCount - ([...groupStudents, newStudent].length / 2)) * -1;

      // Check academic year distribution
      const yearCounts = new Map();
      [...groupStudents, newStudent].forEach(s => {
        yearCounts.set(s.metadata.academicYear, (yearCounts.get(s.metadata.academicYear) || 0) + 1);
      });
      diversityScore += yearCounts.size / ([...groupStudents, newStudent].length);

      return diversityScore;
    };

    // Distribute students ensuring skill and diversity balance
    for (const studentData of studentScores) {
      // Find the best group for this student
      let bestGroupIndex = 0;
      let bestDiversityScore = -Infinity;

      for (let i = 0; i < groups.length; i++) {
        if (groups[i].studentIds.length >= groupSize) continue;

        const diversityScore = calculateGroupDiversity(groups[i].studentIds, studentData);
        if (diversityScore > bestDiversityScore) {
          bestDiversityScore = diversityScore;
          bestGroupIndex = i;
        }
      }

      groups[bestGroupIndex].studentIds.push(studentData.student.id);
    }

    // Create groups in database
    const createdGroups: Group[] = [];
    for (let i = 0; i < groups.length; i++) {
      const group = await this.createGroup({
        formId,
        name: `Group ${i + 1}`,
        studentIds: groups[i].studentIds
      });
      createdGroups.push(group);
    }

    return createdGroups;
  }
}

export const storage = new DatabaseStorage();