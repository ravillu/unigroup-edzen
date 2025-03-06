import { IStorage } from "./types";
import { User, InsertUser, Form, InsertForm, Student, InsertStudent, Group, InsertGroup } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private forms: Map<number, Form>;
  private students: Map<number, Student>;
  private groups: Map<number, Group>;
  public sessionStore: session.Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.forms = new Map();
    this.students = new Map();
    this.groups = new Map();
    this.currentId = { users: 1, forms: 1, students: 1, groups: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Form methods
  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = this.currentId.forms++;
    const form = { ...insertForm, id };
    this.forms.set(id, form);
    return form;
  }

  async getFormsByProfessor(professorId: number): Promise<Form[]> {
    return Array.from(this.forms.values()).filter(
      (form) => form.professorId === professorId
    );
  }

  async getForm(id: number): Promise<Form | undefined> {
    return this.forms.get(id);
  }

  // Student methods
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentId.students++;
    const student = { ...insertStudent, id };
    this.students.set(id, student);
    return student;
  }

  async getStudentsByForm(formId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.formId === formId
    );
  }

  // Group methods
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentId.groups++;
    const group = { ...insertGroup, id };
    this.groups.set(id, group);
    return group;
  }

  async getGroupsByForm(formId: number): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(
      (group) => group.formId === formId
    );
  }

  async updateGroup(id: number, group: Partial<Group>): Promise<Group> {
    const existing = this.groups.get(id);
    if (!existing) throw new Error("Group not found");
    const updated = { ...existing, ...group };
    this.groups.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
