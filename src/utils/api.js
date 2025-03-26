// API基础URL配置
const getBaseUrl = () => {
  // 首先检查环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 默认使用当前域名加上端口3001
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // 生产环境下使用相对路径
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
    const requestStartTime = Date.now();
    console.log(`🚀 API请求: ${options.method || 'GET'} ${url}`);
    
    // 添加错误处理的超时机制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时，请稍后再试')), 30000); // 30秒超时
    });
    
    // 实际请求
    const fetchPromise = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    // 使用Promise.race判断哪个先完成
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    const requestDuration = Date.now() - requestStartTime;
    console.log(`✅ API响应: ${response.status} (${requestDuration}ms)`);

    // 处理HTTP错误
    if (!response.ok) {
      let errorMessage = `请求失败: HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        console.warn('无法解析错误响应体:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    // 尝试解析JSON响应
    try {
      const jsonData = await response.json();
      return jsonData;
    } catch (jsonError) {
      console.error('JSON解析错误:', jsonError);
      throw new Error('服务器返回的数据格式无效');
    }
  } catch (error) {
    // 区分网络错误和其他错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ 网络请求失败:', error);
      throw new Error('网络连接失败，请检查您的网络连接或服务器是否在线');
    }
    
    console.error('❌ API请求错误:', error);
    throw error;
  }
};

// API请求函数
export const api = {
  // GET请求
  async get(endpoint) {
    try {
      return await fetchApi(getApiUrl(endpoint));
    } catch (error) {
      console.error(`GET ${endpoint} 失败:`, error);
      throw error;
    }
  },

  // POST请求
  async post(endpoint, data) {
    try {
      return await fetchApi(getApiUrl(endpoint), {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`POST ${endpoint} 失败:`, error);
      throw error;
    }
  },

  // PUT请求
  async put(endpoint, data) {
    try {
      return await fetchApi(getApiUrl(endpoint), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`PUT ${endpoint} 失败:`, error);
      throw error;
    }
  },

  // DELETE请求
  async delete(endpoint) {
    try {
      return await fetchApi(getApiUrl(endpoint), {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`DELETE ${endpoint} 失败:`, error);
      throw error;
    }
  },
}; 