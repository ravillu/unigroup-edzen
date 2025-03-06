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

    // Calculate student scores based on skill priorities
    const studentScores = students.map(student => {
      let totalScore = 0;
      for (const [skill, priority] of Object.entries(skillPriorities)) {
        totalScore += ((student.skills as any)[skill] || 0) * priority;
      }
      return { student, score: totalScore };
    });

    // Sort students by score
    studentScores.sort((a, b) => b.score - a.score);

    // Calculate number of groups
    const numGroups = Math.ceil(students.length / groupSize);
    const groups: { studentIds: number[] }[] = Array(numGroups)
      .fill(null)
      .map(() => ({ studentIds: [] }));

    // Distribute students using snake pattern
    let groupIndex = 0;
    let direction = 1;

    studentScores.forEach(({ student }) => {
      groups[groupIndex].studentIds.push(student.id);

      groupIndex += direction;
      if (groupIndex >= numGroups) {
        groupIndex = numGroups - 1;
        direction = -1;
      } else if (groupIndex < 0) {
        groupIndex = 0;
        direction = 1;
      }
    });

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