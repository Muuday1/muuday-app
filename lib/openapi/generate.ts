/**
 * OpenAPI 3.1 document generator for Muuday API v1.
 *
 * Usage:
 *   import { generateOpenApiDocument } from '@/lib/openapi/generate'
 *   const doc = generateOpenApiDocument()
 */

import { z } from 'zod'
import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { apiV1Schemas } from '@/lib/schemas/api-v1'

export function generateOpenApiDocument() {
  const registry = new OpenAPIRegistry()

  // Register all shared schemas
  for (const [name, schema] of Object.entries(apiV1Schemas)) {
    registry.register(name, schema as any)
  }

  // Register paths for core mobile-facing endpoints
  // These are documented manually because Next.js App Router routes
  // don't have a unified decorator system like tRPC or Fastify.

  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/me',
    tags: ['Users'],
    summary: 'Get current user',
    description: 'Returns the authenticated user profile and professional summary (if applicable).',
    responses: {
      200: {
        description: 'User profile',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserMeResponse' } } },
      },
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      429: {
        description: 'Rate limited',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/users/me',
    tags: ['Users'],
    summary: 'Update current user',
    request: {
      body: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserBody' } } },
      },
    },
    responses: {
      200: {
        description: 'Profile updated',
        content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiValidationError' } } },
      },
      401: { description: 'Unauthorized' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/v1/bookings',
    tags: ['Bookings'],
    summary: 'List bookings',
    description: 'Returns bookings for the authenticated user (as client or professional).',
    request: {
      query: z.object({
        status: z.string().optional().describe('Filter by status'),
        limit: z.coerce.number().optional().describe('Max items per page'),
        offset: z.coerce.number().optional().describe('Items to skip'),
      }),
    },
    responses: {
      200: {
        description: 'Bookings list',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingsListResponse' } } },
      },
      401: { description: 'Unauthorized' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/api/v1/bookings',
    tags: ['Bookings'],
    summary: 'Create booking',
    request: {
      body: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingBody' } } },
      },
    },
    responses: {
      201: {
        description: 'Booking created',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingResponse' } } },
      },
      400: {
        description: 'Validation or business error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      401: { description: 'Unauthorized' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/v1/conversations',
    tags: ['Chat'],
    summary: 'List conversations',
    responses: {
      200: {
        description: 'Conversations list',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ConversationsListResponse' } } },
      },
      401: { description: 'Unauthorized' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/v1/conversations/{id}/messages',
    tags: ['Chat'],
    summary: 'List messages',
    request: {
      params: z.object({
        id: z.string().uuid().describe('Conversation ID'),
      }),
    },
    responses: {
      200: {
        description: 'Messages list',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/MessagesListResponse' } } },
      },
      401: { description: 'Unauthorized' },
      403: { description: 'Not a participant' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/api/v1/conversations/{id}/messages',
    tags: ['Chat'],
    summary: 'Send message',
    request: {
      body: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SendMessageBody' } } },
      },
    },
    responses: {
      201: {
        description: 'Message sent',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SendMessageResponse' } } },
      },
      400: { description: 'Validation error' },
      401: { description: 'Unauthorized' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/conversations/{id}/read',
    tags: ['Chat'],
    summary: 'Mark conversation as read',
    responses: {
      200: {
        description: 'Marked as read',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/MarkReadResponse' } } },
      },
      401: { description: 'Unauthorized' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/v1/notifications',
    tags: ['Notifications'],
    summary: 'List notifications',
    responses: {
      200: {
        description: 'Notifications list',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationsListResponse' } } },
      },
      401: { description: 'Unauthorized' },
      429: { description: 'Rate limited' },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/v1/notifications/unread-count',
    tags: ['Notifications'],
    summary: 'Get unread notification count',
    responses: {
      200: {
        description: 'Unread count',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UnreadCountResponse' } } },
      },
      401: { description: 'Unauthorized' },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/api/v1/professionals/search',
    tags: ['Search'],
    summary: 'Search professionals',
    description: 'Public search for approved professionals. Market-filtered.',
    responses: {
      200: {
        description: 'Search results',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfessionalSearchResult' } } },
      },
      400: { description: 'Invalid query parameters' },
      429: { description: 'Rate limited' },
    },
  })

  const generator = new OpenApiGeneratorV31(registry.definitions)

  const doc = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Muuday API v1',
      description: 'REST API for Muuday mobile and web clients.',
      version: '1.0.0',
      contact: { name: 'Muuday Engineering', email: 'engineering@muuday.com' },
    },
    servers: [
      { url: 'https://muuday-app.vercel.app', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Local development' },
    ],
    security: [{ bearerAuth: [] }],
  })

  // Add security schemes manually (OpenAPIObjectConfigV31 doesn't include components)
  ;(doc as any).components = {
    ...(doc as any).components,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase access token',
      },
      mobileApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Mobile-API-Key',
        description: 'Mobile API key (required for native app requests)',
      },
    },
  }

  return doc
}
