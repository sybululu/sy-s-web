const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders(isFormData: boolean = false) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(isFormData),
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // Token 过期，跳转登录
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('登录已过期');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || '请求失败');
  }
  
  return await response.json();
}

// API 方法
export const api = {
  // 认证
  login: (email: string, password: string) => 
    apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  
  register: (email: string, password: string, name: string) => 
    apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    }),

  // 分析
  analyze: (text: string, source_type: string = 'text') =>
    apiFetch('/api/v1/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, source_type })
    }),
    
  rectify: (original_snippet: string, violation_type: string) =>
    apiFetch('/api/v1/rectify', {
      method: 'POST',
      body: JSON.stringify({ original_snippet, violation_type })
    }),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/api/v1/upload', {
      method: 'POST',
      body: formData
    });
  },

  fetchUrl: (url: string) =>
    apiFetch('/api/v1/fetch-url', {
      method: 'POST',
      body: JSON.stringify({ url })
    }),
  
  // 历史记录
  getProjects: () => apiFetch('/api/v1/projects'),
  getProject: (id: string) => apiFetch(`/api/v1/projects/${id}`),
  
  // 导出
  exportReport: (projectId: string) => {
    if (!API_BASE) {
      console.warn('VITE_API_URL 未配置，可能无法导出');
    }
    window.open(`${API_BASE}/api/v1/export/${projectId}?token=${localStorage.getItem('token')}`)
  }
};
