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

    // Normalize the Canvas URL format
    let baseUrl = user.canvasInstanceUrl.trim();
    if (baseUrl.includes('northeastern.instructure.com')) {
      // Extract just the domain if full URL is provided
      baseUrl = 'northeastern.instructure.com';
    }
    this.baseUrl = `https://${baseUrl}`;

    console.log('Canvas Service initialized:', {
      hasToken: !!this.apiToken,
      baseUrl: this.baseUrl,
      tokenPrefix: this.apiToken.substring(0, 5) + '...'
    });
  }

  private async request(endpoint: string) {
    const url = `${this.baseUrl}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log('Making Canvas API request:', { url });

    try {
      const response = await axios({
        method: 'get',
        url,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json'
        },
        validateStatus: null
      });

      console.log('Canvas API Response:', {
        status: response.status,
        contentType: response.headers['content-type'],
        responseType: typeof response.data
      });

      // Check for HTML response (error case)
      if (response.headers['content-type']?.includes('text/html')) {
        console.error('Received HTML response instead of JSON');
        throw new Error(
          'Invalid Canvas API response. Please ensure you are using a valid Canvas API token and the correct Canvas URL (northeastern.instructure.com)'
        );
      }

      // Handle error status codes
      if (response.status === 401) {
        throw new Error('Invalid or expired Canvas API token');
      }

      if (response.status >= 400) {
        throw new Error(
          response.data?.message || 
          `Canvas API returned error status: ${response.status}`
        );
      }

      return response.data;
    } catch (error: any) {
      console.error('Canvas API Error:', {
        message: error.message,
        status: error.response?.status,
        contentType: error.response?.headers?.['content-type'],
        url
      });

      throw new Error(
        'Failed to connect to Canvas API. Please verify your Canvas URL (northeastern.instructure.com) and API token.'
      );
    }
  }

  async getCourses() {
    try {
      console.log('Fetching Canvas courses...');
      const courses = await this.request('/courses?enrollment_type=teacher&include[]=total_students&per_page=100');
      return Array.isArray(courses) ? courses : [];
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

      return response.data;
    } catch (error: any) {
      console.error(`Failed to create assignment in course ${courseId}:`, error);
      throw new Error(
        `Failed to create Canvas assignment: ${error.response?.data?.message || error.message}`
      );
    }
  }
}

export const createCanvasService = (user?: User) => {
  return new CanvasService(user);
};