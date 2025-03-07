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
    this.baseUrl = user.canvasInstanceUrl.replace(/\/$/, ''); // Remove trailing slash
    if (!this.baseUrl.startsWith('http')) {
      this.baseUrl = `https://${this.baseUrl}`;
    }

    console.log('Canvas Service Configuration:', {
      hasToken: !!this.apiToken,
      baseUrl: this.baseUrl
    });
  }

  private async request(endpoint: string) {
    try {
      const url = `${this.baseUrl}/api/v1/${endpoint.replace(/^\//, '')}`;
      console.log('Making Canvas API request to:', url);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      // Check if response is HTML (error page)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Invalid response from Canvas API. Please check your Canvas instance URL.');
      }

      // Handle 4xx errors
      if (response.status >= 400) {
        throw new Error(response.data.message || 'Canvas API request failed');
      }

      return response.data;
    } catch (error: any) {
      console.error('Canvas API Error:', {
        message: error.message,
        response: error.response?.data,
        endpoint,
      });

      if (error.response?.status === 401) {
        throw new Error(
          "Invalid Canvas API token. Please check your token and try again."
        );
      } else if (error.response?.status === 404) {
        throw new Error(
          "Could not connect to Canvas. Please verify your Canvas instance URL."
        );
      } else if (error.message.includes('text/html')) {
        throw new Error(
          "Invalid Canvas instance URL. Please ensure you're using the correct Canvas domain."
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
      const url = `${this.baseUrl}/api/v1/courses/${courseId}/assignments`;
      const response = await axios.post(
        url,
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