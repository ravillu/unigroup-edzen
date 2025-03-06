import axios from 'axios';

class CanvasService {
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    const token = process.env.CANVAS_API_TOKEN;
    const url = process.env.CANVAS_INSTANCE_URL;

    if (!token || !url) {
      throw new Error('Canvas API credentials not properly configured. Please set CANVAS_API_TOKEN and CANVAS_INSTANCE_URL');
    }

    this.apiToken = token;
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
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

export const canvasService = new CanvasService();