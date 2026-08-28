import axios from 'axios';

// Fallback to Judge0 Community Edition endpoint if no explicit config is provided
const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '';
const JUDGE0_HOST = process.env.JUDGE0_API_HOST || '';

const headers: any = {
  'content-type': 'application/json',
};

if (JUDGE0_KEY && JUDGE0_HOST) {
  headers['X-RapidAPI-Key'] = JUDGE0_KEY;
  headers['X-RapidAPI-Host'] = JUDGE0_HOST;
}

const judgeClient = axios.create({
  baseURL: JUDGE0_URL,
  headers,
});

export class Judge0Client {
  /**
   * Submit code for execution
   * Returns a token which can be polled for the result.
   */
  static async submitCode(sourceCode: string, languageId: number, customInput?: string) {
    const payload = {
      source_code: Buffer.from(sourceCode).toString('base64'),
      language_id: languageId,
      stdin: customInput ? Buffer.from(customInput).toString('base64') : '',
    };

    const response = await judgeClient.post(
      '/submissions?base64_encoded=true&wait=false',
      payload,
    );
    return response.data.token;
  }

  /**
   * Fetch the result of an execution using the token.
   */
  static async getSubmission(token: string) {
    const response = await judgeClient.get(`/submissions/${token}?base64_encoded=true&fields=*`);
    const data = response.data;
    if (data.stdout) data.stdout = Buffer.from(data.stdout, 'base64').toString('utf8');
    if (data.stderr) data.stderr = Buffer.from(data.stderr, 'base64').toString('utf8');
    if (data.compile_output) data.compile_output = Buffer.from(data.compile_output, 'base64').toString('utf8');
    if (data.message) data.message = Buffer.from(data.message, 'base64').toString('utf8');
    return data;
  }

  /**
   * Get all active languages supported by Judge0.
   */
  static async getLanguages() {
    try {
      const response = await judgeClient.get('/languages');
      return response.data;
    } catch (err: any) {
      console.warn('Judge0 API failed (likely invalid key), returning fallback languages.');
      return [
        { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
        { id: 71, name: 'Python (3.8.1)' },
        { id: 54, name: 'C++ (GCC 9.2.0)' },
        { id: 62, name: 'Java (OpenJDK 13.0.1)' }
      ];
    }
  }
}
