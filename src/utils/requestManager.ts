class RequestManager {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // 如果已有相同的请求在进行中，返回现有的 Promise
    if (this.pendingRequests.has(key)) {
      console.log(`Request ${key} already in progress, returning existing promise`);
      return this.pendingRequests.get(key) as Promise<T>;
    }
    
    // 创建新的请求
    const promise = requestFn()
      .then((result) => {
        // 请求完成后清除
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // 请求失败也要清除
        this.pendingRequests.delete(key);
        throw error;
      });
    
    // 存储请求 Promise
    this.pendingRequests.set(key, promise);
    
    return promise;
  }
  
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }
  
  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestManager = new RequestManager();