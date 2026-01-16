/**
 * @file http-client.helper.ts
 * @description HTTP client wrapper for integration tests with authentication support
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * HTTP client for integration tests
 * Provides methods for making authenticated API requests
 */
export class IntegrationHttpClient {
  private readonly client: AxiosInstance;
  private readonly baseURL: string;
  private authToken?: string;

  /**
   * Creates a new HTTP client instance
   * @param baseURL - Base URL for API requests (defaults to API_BASE_URL env var or localhost:3000)
   */
  constructor(baseURL?: string) {
    this.baseURL =
      baseURL || process.env.API_BASE_URL || 'http://localhost:3000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      validateStatus: () => true,
    });
  }

  /**
   * Sets the authentication token for subsequent requests
   * @param token - JWT authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clears the authentication token
   */
  clearAuthToken(): void {
    this.authToken = undefined;
  }

  /**
   * Performs a GET request
   * @param url - Request URL path
   * @param config - Optional axios configuration
   * @returns Promise with axios response
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, this.buildConfig(config));
  }

  /**
   * Performs a POST request
   * @param url - Request URL path
   * @param data - Request body data
   * @param config - Optional axios configuration
   * @returns Promise with axios response
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, this.buildConfig(config));
  }

  /**
   * Performs a PATCH request
   * @param url - Request URL path
   * @param data - Request body data
   * @param config - Optional axios configuration
   * @returns Promise with axios response
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, this.buildConfig(config));
  }

  /**
   * Performs a DELETE request
   * @param url - Request URL path
   * @param config - Optional axios configuration
   * @returns Promise with axios response
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, this.buildConfig(config));
  }

  /**
   * Gets the base URL used by this client
   * @returns Base URL string
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Builds axios configuration with authentication headers
   * @param config - Optional base configuration
   * @returns Complete axios configuration
   */
  private buildConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
    const headers: any = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return {
      ...config,
      headers,
    };
  }
}

/**
 * Factory function to create HTTP client instances
 * @param baseURL - Optional base URL
 * @returns New HTTP client instance
 */
export const createHttpClient = (baseURL?: string): IntegrationHttpClient => {
  return new IntegrationHttpClient(baseURL);
};
