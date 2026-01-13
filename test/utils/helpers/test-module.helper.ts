/**
 * @file test-module.helper.ts
 * @description Helper utilities for setting up NestJS testing modules
 * @module test/utils/helpers
 * @category Test Utilities
 * @subcategory Helpers
 *
 * @author Unex Development Team
 * @since 2.0.0
 *
 * @description
 * Provides reusable helpers for creating and configuring NestJS testing modules.
 * Reduces boilerplate code in test files.
 *
 * @example
 * const module = await createTestingModule({
 *   controller: UserController,
 *   providers: [UserService, createPrismaMock()]
 * });
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Type } from '@nestjs/common';

/**
 * @interface TestModuleOptions
 * @description Options for creating a test module
 */
export interface TestModuleOptions {
  controller?: Type<any>;
  controllers?: Type<any>[];
  provider?: Type<any>;
  providers?: Type<any>[] | any[];
  imports?: Type<any>[];
}

/**
 * @function createTestModule
 * @description Helper to create a NestJS testing module with common setup
 * @param {TestModuleOptions} options - Module configuration options
 * @returns {Promise<TestingModule>} Configured testing module
 *
 * @example
 * const module = await createTestModule({
 *   controller: AuthController,
 *   providers: [
 *     AuthService,
 *     { provide: PrismaService, useValue: createPrismaMock() }
 *   ]
 * });
 * const controller = module.get<AuthController>(AuthController);
 */
export async function createTestModule(options: TestModuleOptions): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    controllers: options.controller ? [options.controller] : options.controllers,
    providers: options.provider ? [options.provider] : options.providers,
    imports: options.imports,
  });

  return moduleBuilder.compile();
}

/**
 * @function createMockProvider
 * @description Create a provider configuration for a mocked service
 * @param {Type<any>} serviceClass - The service class to mock
 * @param {any} mockValue - The mock implementation
 * @returns {object} Provider configuration object
 *
 * @example
 * const prismaProvider = createMockProvider(
 *   PrismaService,
 *   createPrismaMock()
 * );
 */
export function createMockProvider(serviceClass: Type<any>, mockValue: any): any {
  return {
    provide: serviceClass,
    useValue: mockValue,
  };
}
