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
    if (!user?.canvasToken || !user?.canvasInstanceUrl) {
      throw new Error(
        "Canvas credentials not found. Please make sure you have entered your Canvas API token and instance URL."
      );
    }

    this.apiToken = user.canvasToken;

    // Clean and format the base URL
    let baseUrl = user.canvasInstanceUrl.trim();
    // Remove trailing slashes
    baseUrl = baseUrl.replace(/\/+$/, '');
    // Ensure https:// prefix
    if (!/^https?:\/\//i.test(baseUrl)) {
      baseUrl = `https://${baseUrl}`;
    }
    this.baseUrl = baseUrl;

    console.log('Canvas Service Configuration:', {
      hasToken: !!this.apiToken,
      baseUrl: this.baseUrl,
      tokenLength: this.apiToken?.length
    });
  }

  private async request(endpoint: string) {
    try {
      // Ensure endpoint starts with a forward slash
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${this.baseUrl}/api/v1${cleanEndpoint}`;

      console.log('Making Canvas API request to:', url);

      const response = await axios({
        method: 'get',
        url,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        validateStatus: null // Don't throw on any status code
      });

      // Log response details for debugging
      console.log('Canvas API Response:', {
        status: response.status,
        contentType: response.headers['content-type'],
        isHtml: response.headers['content-type']?.includes('text/html'),
        data: typeof response.data
      });

      // Check for HTML response
      if (response.headers['content-type']?.includes('text/html')) {
        throw new Error(`Received HTML instead of JSON. Please verify your Canvas URL: ${this.baseUrl}`);
      }

      // Handle error status codes
      if (response.status >= 400) {
        throw new Error(response.data?.message || `Canvas API error (${response.status})`);
      }

      return response.data;
    } catch (error: any) {
      console.error('Canvas API Error:', {
        message: error.message,
        status: error.response?.status,
        contentType: error.response?.headers?.['content-type'],
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        throw new Error("Invalid Canvas API token. Please check your token and try again.");
      } else if (error.response?.status === 404) {
        throw new Error("Could not connect to Canvas. Please verify your Canvas instance URL.");
      } else if (error.message.includes('text/html')) {
        throw new Error("Received HTML response. Please ensure you're using the correct Canvas API URL.");
      } else {
        throw new Error(`Canvas API error: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  async getCourses() {
    try {
      const courses = await this.request('/courses?enrollment_type=teacher&include[]=total_students&per_page=100');

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
        `/courses/${courseId}/users?enrollment_type[]=student&per_page=100&include[]=email&include[]=enrollments`
      );
      return students;
    } catch (error) {
      console.error(`Failed to fetch students for course ${courseId}:`, error);
      throw error;
    }
  }

  async createAssignment(courseId: number, options: AssignmentOptions) {
    try {
      const url = `${this.baseUrl}/api/v1/courses/${courseId}/assignments`;
      const response = await axios({
        method: 'post',
        url,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: {
          assignment: {
            name: options.name,
            description: options.description,
            submission_types: options.submission_types,
            published: options.published
          }
        }
      });

      if (response.status >= 400) {
        throw new Error(response.data?.message || 'Failed to create assignment');
      }

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