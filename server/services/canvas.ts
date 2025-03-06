import axios from 'axios';
import { Institution } from "@shared/schema";

class CanvasService {
  private apiToken: string;
  private baseUrl: string;

  constructor(institution: Institution, token?: string) {
    if (!token) {
      throw new Error('Canvas API token is required');
    }

    this.apiToken = token;
    this.baseUrl = institution.canvasInstanceUrl.endsWith('/') 
      ? institution.canvasInstanceUrl.slice(0, -1) 
      : institution.canvasInstanceUrl;
  }

  private async request(endpoint: string) {
    try {
      console.log('Making Canvas API request to:', `${this.baseUrl}/api/v1/${endpoint}`);
      const response = await axios.get(`${this.baseUrl}/api/v1/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json'
        }
      });
      console.log('Canvas API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Canvas API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        endpoint,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  async getCourses() {
    try {
      // Fetch all available courses where the user is a teacher
      const courses = await this.request(
        'courses?enrollment_type=teacher&include[]=total_students&per_page=100'
      );
      return courses;
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw new Error('Failed to fetch Canvas courses');
    }
  }

  async getCourseStudents(courseId: number) {
    try {
      // Fetch all students including inactive ones
      const students = await this.request(
        `courses/${courseId}/users?enrollment_type[]=student&per_page=100&include[]=email&include[]=enrollments`
      );
      return students;
    } catch (error) {
      console.error(`Failed to fetch students for course ${courseId}:`, error);
      throw new Error('Failed to fetch Canvas course students');
    }
  }
}

// Export a factory function instead of a singleton
export const createCanvasService = (institution: Institution, token: string) => {
  return new CanvasService(institution, token);
};