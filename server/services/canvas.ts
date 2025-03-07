import axios from 'axios';
import { User } from "@shared/schema";

interface AssignmentOptions {
  name: string;
  description?: string;
  submission_types: string[];
  published?: boolean;
}

interface GroupSetOptions {
  name: string;
  description?: string;
  group_limit?: number;
}

interface GroupOptions {
  name: string;
  description?: string;
  users?: number[];
}

class CanvasService {
  private apiToken: string;
  private baseUrl: string;

  constructor(user?: User) {
    // Check user credentials first
    if (user?.canvasToken && user?.canvasInstanceUrl) {
      this.apiToken = user.canvasToken;
      this.baseUrl = user.canvasInstanceUrl;
    } 
    // Fall back to environment variables
    else if (process.env.CANVAS_API_TOKEN && process.env.CANVAS_INSTANCE_URL) {
      this.apiToken = process.env.CANVAS_API_TOKEN;
      this.baseUrl = process.env.CANVAS_INSTANCE_URL;
    }
    else {
      throw new Error(
        "Canvas credentials not found. Please make sure you have entered your Canvas API token and instance URL."
      );
    }

    // Clean up the base URL
    this.baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
  }

  private async request(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any) {
    try {
      const url = `${this.baseUrl}/api/v1/${endpoint}`;
      console.log(`Making Canvas API ${method} request to:`, url);

      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Canvas API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        endpoint,
      });

      // Provide more helpful error messages based on status code
      if (error.response?.status === 401) {
        throw new Error(
          "Invalid Canvas API token. Please check your token and try again."
        );
      } else if (error.response?.status === 404) {
        throw new Error(
          "Could not connect to Canvas. Please verify your Canvas instance URL."
        );
      } else {
        throw new Error(
          `Canvas API error: ${error.response?.data?.message || error.message}`
        );
      }
    }
  }

  async getCourses() {
    return await this.request('courses?enrollment_type=teacher&include[]=total_students&per_page=100');
  }

  async getCourseStudents(courseId: number) {
    return await this.request(
      `courses/${courseId}/users?enrollment_type[]=student&per_page=100&include[]=email&include[]=enrollments`
    );
  }

  async createAssignment(courseId: number, options: AssignmentOptions) {
    return await this.request(
      `courses/${courseId}/assignments`,
      'POST',
      { assignment: options }
    );
  }

  // New methods for group management
  async createGroupCategory(courseId: number, options: GroupSetOptions) {
    return await this.request(
      `courses/${courseId}/group_categories`,
      'POST',
      { name: options.name, group_limit: options.group_limit }
    );
  }

  async createGroup(groupCategoryId: number, options: GroupOptions) {
    const group = await this.request(
      `group_categories/${groupCategoryId}/groups`,
      'POST',
      { name: options.name, description: options.description }
    );

    if (options.users && options.users.length > 0) {
      await this.addUsersToGroup(group.id, options.users);
    }

    return group;
  }

  async addUsersToGroup(groupId: number, userIds: number[]) {
    const promises = userIds.map(userId =>
      this.request(
        `groups/${groupId}/memberships`,
        'POST',
        { user_id: userId }
      )
    );

    return await Promise.all(promises);
  }
}

// Create a factory function to get user-specific canvas service
export const createCanvasService = (user?: User) => {
  return new CanvasService(user);
};