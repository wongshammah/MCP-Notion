// API基础URL配置
const getBaseUrl = () => {
  // 首先检查环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 使用相对路径，依赖setupProxy.js的代理功能
  return '';
};

const API_BASE_URL = getBaseUrl();
console.log('API基础URL:', API_BASE_URL);

// 获取完整API URL
export const getApiUrl = (path) => `${API_BASE_URL}${path}`;

// API端点
export const API_ENDPOINTS = {
  // 领导人相关
  LEADERS: '/api/leaders',
  LEADER: (id) => `/api/leaders/${id}`,
  
  // 排期相关
  SCHEDULES: '/api/schedules',
  SCHEDULE: (date) => `/api/schedules/${date}`,
  SYNC_SCHEDULES: '/api/schedules/sync',
};

// 通用请求函数
export const fetchApi = async (url, options = {}) => {
  try {
    console.log(`API请求: ${options.method || 'GET'} ${url}`);
    const startTime = Date.now();
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log(`API响应: ${response.status} (${Date.now() - startTime}ms)`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// API请求函数
export const api = {
  // GET请求
  async get(endpoint) {
    return fetchApi(getApiUrl(endpoint));
  },

  // POST请求
  async post(endpoint, data) {
    return fetchApi(getApiUrl(endpoint), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT请求
  async put(endpoint, data) {
    return fetchApi(getApiUrl(endpoint), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE请求
  async delete(endpoint) {
    return fetchApi(getApiUrl(endpoint), {
      method: 'DELETE',
    });
  },
}; 