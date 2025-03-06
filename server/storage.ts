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

    // Calculate weighted scores and group students by gender
    const maleStudents: any[] = [];
    const femaleStudents: any[] = [];
    const otherStudents: any[] = [];

    students.forEach(student => {
      let skillScore = 0;
      for (const [skill, priority] of Object.entries(skillPriorities)) {
        skillScore += ((student.skills as any)[skill] || 0) * priority;
      }

      const studentData = {
        student,
        skillScore,
        metadata: {
          gender: student.gender,
          ethnicity: student.ethnicity,
          nunStatus: student.nunStatus,
          academicYear: student.academicYear
        }
      };

      if (student.gender.toLowerCase() === 'male') {
        maleStudents.push(studentData);
      } else if (student.gender.toLowerCase() === 'female') {
        femaleStudents.push(studentData);
      } else {
        otherStudents.push(studentData);
      }
    });

    // Sort each gender group by skill score
    maleStudents.sort((a, b) => b.skillScore - a.skillScore);
    femaleStudents.sort((a, b) => b.skillScore - a.skillScore);
    otherStudents.sort((a, b) => b.skillScore - a.skillScore);

    // Initialize groups
    const numGroups = Math.ceil(students.length / groupSize);
    const groups: { studentIds: number[] }[] = Array(numGroups)
      .fill(null)
      .map(() => ({ studentIds: [] }));

    // Helper function to distribute students from a list to groups
    const distributeStudents = (studentList: any[], startGroupIndex: number) => {
      let groupIndex = startGroupIndex;
      let direction = 1;

      studentList.forEach(studentData => {
        if (groups[groupIndex].studentIds.length < groupSize) {
          groups[groupIndex].studentIds.push(studentData.student.id);

          // Move to next group using snake pattern
          groupIndex += direction;
          if (groupIndex >= numGroups) {
            groupIndex = numGroups - 1;
            direction = -1;
          } else if (groupIndex < 0) {
            groupIndex = 0;
            direction = 1;
          }
        }
      });
    };

    // Distribute students ensuring gender and skill balance
    // Start with different genders at different points to ensure mixing
    distributeStudents(femaleStudents, 0);
    distributeStudents(maleStudents, Math.floor(numGroups / 2));
    distributeStudents(otherStudents, numGroups - 1);

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