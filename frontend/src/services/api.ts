import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      const message = errorData.message || errorData.error || 'Request failed';
      const errorMessage = Array.isArray(message) ? message.join(', ') : message;
      
      const err = new Error(errorMessage);
      (err as any).statusCode = error.response.status;
      throw err;
    }
    throw error;
  }
);

// ============================================
// AUTH ENDPOINTS
// ============================================
export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/auth/users');
    return response.data;
  },

  getUsersByRole: async (role: string) => {
    const response = await apiClient.get('/auth/users/by-role', { params: { role } });
    return response.data;
  },
};

// ============================================
// PROJECTS ENDPOINTS
// ============================================
export const projectService = {
  createProject: async (data: any) => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  getProjects: async (page = 1, limit = 10) => {
    const response = await apiClient.get('/projects', { params: { page, limit } });
    return response.data;
  },

  getProjectById: async (id: string) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  createContract: async (projectId: string, data: any) => {
    const response = await apiClient.post(`/projects/${projectId}/contract`, data);
    return response.data;
  },
};

// ============================================
// CONTRACTS & TERMS ENDPOINTS
// ============================================
export const termService = {
  createTerm: async (contractId: string, data: any) => {
    const response = await apiClient.post(`/terms/contract/${contractId}`, data);
    return response.data;
  },

  getTermById: async (id: string) => {
    const response = await apiClient.get(`/terms/${id}`);
    return response.data;
  },

  getTermsByContract: async (contractId: string) => {
    const response = await apiClient.get(`/terms/contract/${contractId}`);
    return response.data;
  },
};

// ============================================
// PROGRESS ENDPOINTS
// ============================================
export const progressService = {
  createProgress: async (termId: string, data: any) => {
    const response = await apiClient.post(`/progress/term/${termId}`, data);
    return response.data;
  },

  submitProgress: async (termId: string, data: any) => {
    const response = await apiClient.post(`/progress/term/${termId}/submit`, data);
    return response.data;
  },

  getProgressByTerm: async (termId: string) => {
    const response = await apiClient.get(`/progress/term/${termId}`);
    return response.data;
  },
};

// ============================================
// VERIFICATIONS ENDPOINTS
// ============================================
export const verificationService = {
  createVerification: async (termId: string, data: any) => {
    const response = await apiClient.post(`/verifications/term/${termId}`, data);
    return response.data;
  },

  getVerificationByTerm: async (termId: string) => {
    const response = await apiClient.get(`/verifications/term/${termId}`);
    return response.data;
  },

  getPendingVerifications: async () => {
    const response = await apiClient.get('/verifications/pending');
    return response.data;
  },

  approveVerification: async (id: string, notes?: string) => {
    const response = await apiClient.put(`/verifications/${id}`, {
      status: 'APPROVED',
      notes,
    });
    return response.data;
  },

  rejectVerification: async (id: string, notes: string) => {
    const response = await apiClient.put(`/verifications/${id}`, {
      status: 'REJECTED',
      notes,
    });
    return response.data;
  },
};

// ============================================
// PAYMENTS ENDPOINTS
// ============================================
export const paymentService = {
  confirmPayment: async (termId: string, data: any) => {
    const response = await apiClient.post(`/payments/term/${termId}/confirm`, data);
    return response.data;
  },

  getPaymentByTerm: async (termId: string) => {
    const response = await apiClient.get(`/payments/term/${termId}`);
    return response.data;
  },

  getReadyPayments: async () => {
    const response = await apiClient.get('/payments/ready');
    return response.data;
  },
};

// ============================================
// AUDIT ENDPOINTS
// ============================================
export const auditService = {
  getAuditLogs: async (page = 1, limit = 20) => {
    const response = await apiClient.get('/audit', { params: { page, limit } });
    return response.data;
  },

  getAuditByEntity: async (entityType: string, entityId: string) => {
    const response = await apiClient.get(`/audit/entity/${entityType}/${entityId}`);
    return response.data;
  },

  getAuditByUser: async (userId: string) => {
    const response = await apiClient.get(`/audit/user/${userId}`);
    return response.data;
  },
};

// ============================================
// ERROR HANDLING
// ============================================
export const handleApiError = (error: any) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
};

export default apiClient;
