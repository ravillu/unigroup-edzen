import axios from 'axios';
import { User } from "@shared/schema";

interface AssignmentOptions {
  name: string;
  description?: string;
  submission_types: string[];
  published?: boolean;
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

    // Log configuration for debugging
    console.log('Canvas Service Configuration:', {
      hasToken: !!this.apiToken,
      baseUrl: this.baseUrl,
      userProvided: !!(user?.canvasToken && user?.canvasInstanceUrl)
    });
  }

  private async request(endpoint: string) {
    try {
      const url = `${this.baseUrl}/api/v1/${endpoint}`;
      console.log('Making Canvas API request to:', url);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json'
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
    try {
      // Fetch all available courses where the user is a teacher
      const courses = await this.request(
        'courses?enrollment_type=teacher&include[]=total_students&per_page=100'
      );

      if (!Array.isArray(courses)) {
        throw new Error("Unexpected response format from Canvas API");
      }

      return courses;
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw error;
    }
  }

  async getCourseStudents(courseId: number) {
    try {
      const students = await this.request(
        `courses/${courseId}/users?enrollment_type[]=student&per_page=100&include[]=email&include[]=enrollments`
      );
      return students;
    } catch (error) {
      console.error(`Failed to fetch students for course ${courseId}:`, error);
      throw error;
    }
  }

  async createAssignment(courseId: number, options: AssignmentOptions) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/courses/${courseId}/assignments`,
        {
          assignment: {
            name: options.name,
            description: options.description,
            submission_types: options.submission_types,
            published: options.published
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to create assignment in course ${courseId}:`, error);
      throw new Error(
        `Failed to create Canvas assignment: ${error.response?.data?.message || error.message}`
      );
    }
  }
}

// Create a factory function to get user-specific canvas service
export const createCanvasService = (user?: User) => {
  return new CanvasService(user);
};