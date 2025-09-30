/**
 * Integration tests for freemium access control
 * Testing API endpoints for chapters and concepts with access restrictions
 */

import request from 'supertest';
import { createMocks } from 'node-mocks-http';
import { GET as getChapters } from '@/app/api/chapters/route';
import { GET as getConcept } from '@/app/api/concepts/[slug]/route';

// Mock Drizzle ORM and services
jest.mock('@/lib/db/services', () => ({
  ContentService: jest.fn().mockImplementation(() => ({
    getAllChaptersWithConcepts: jest.fn(),
    getConceptBySlug: jest.fn(),
  })),
  UserService: jest.fn().mockImplementation(() => ({
    findByEmail: jest.fn(),
  })),
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Freemium Access Control API Tests', () => {
  let mockContentService: any;
  let mockUserService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mocked service instances
    const { ContentService, UserService } = require('@/lib/db/services');
    mockContentService = new ContentService();
    mockUserService = new UserService();
  });

  describe('GET /api/chapters', () => {
    it('should return all chapters with concept previews including premium indicators', async () => {
      // Mock data with both free and premium chapters
      const mockChapters = [
        {
          id: 'chapter-1',
          chapterNumber: 1,
          title: 'Fundamentals of Nursing',
          slug: 'fundamentals-nursing',
          concepts: [
            {
              id: 'concept-1',
              title: 'Nursing Process',
              slug: 'nursing-process',
              conceptNumber: 1,
              isPremium: false,
            },
          ],
        },
        {
          id: 'chapter-5',
          chapterNumber: 5,
          title: 'Advanced Cardiac Care',
          slug: 'advanced-cardiac-care',
          concepts: [
            {
              id: 'concept-5',
              title: 'Advanced Life Support',
              slug: 'advanced-life-support',
              conceptNumber: 1,
              isPremium: true,
            },
          ],
        },
      ];

      mockContentService.getAllChaptersWithConcepts.mockResolvedValue(mockChapters);

      const { req } = createMocks({ method: 'GET' });
      const response = await getChapters(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      
      // Verify free content is accessible
      expect(data.data[0].concepts[0].isPremium).toBe(false);
      
      // Verify premium content is marked
      expect(data.data[1].concepts[0].isPremium).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      mockContentService.getAllChaptersWithConcepts.mockRejectedValue(
        new Error('Database connection failed')
      );

      const { req } = createMocks({ method: 'GET' });
      const response = await getChapters(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch chapters');
    });
  });

  describe('GET /api/concepts/[slug] - Freemium Logic', () => {
    const mockFreeUser = {
      id: 'user-1',
      email: 'user@example.com',
      subscription: 'FREE',
    };

    const mockPremiumUser = {
      id: 'user-2',
      email: 'premium@example.com',
      subscription: 'PREMIUM',
    };

    it('should allow access to chapter 3 concept for guest user', async () => {
      const mockConceptResult = {
        hasAccess: true,
        data: {
          id: 'concept-3',
          title: 'Pain Management',
          slug: 'pain-management',
          content: 'Comprehensive pain assessment and management strategies...',
          conceptNumber: 2,
          chapter: {
            id: 'chapter-3',
            chapterNumber: 3,
            title: 'Patient Care',
          },
          questions: [],
          isPremium: false,
        },
      };

      mockContentService.getConceptBySlug.mockResolvedValue(mockConceptResult);

      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/pain-management',
      });

      const response = await getConcept(req as any, { 
        params: { slug: 'pain-management' } 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.chapter.chapterNumber).toBe(3);
      expect(mockContentService.getConceptBySlug).toHaveBeenCalledWith('pain-management', null);
    });

    it('should allow access to chapter 4 concept for free user', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({
        user: { email: mockFreeUser.email },
      });

      mockUserService.findByEmail.mockResolvedValue(mockFreeUser);

      const mockConceptResult = {
        hasAccess: true,
        data: {
          id: 'concept-4',
          title: 'Infection Control',
          slug: 'infection-control',
          content: 'Standard precautions and infection prevention...',
          conceptNumber: 1,
          chapter: {
            id: 'chapter-4',
            chapterNumber: 4,
            title: 'Safety & Infection Control',
          },
          questions: [
            {
              id: 'question-1',
              questionText: 'Which precaution is most important?',
              questionType: 'MULTIPLE_CHOICE',
              explanation: 'Hand hygiene is the cornerstone...',
              options: [],
            },
          ],
          isPremium: false,
        },
      };

      mockContentService.getConceptBySlug.mockResolvedValue(mockConceptResult);

      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/infection-control',
      });

      const response = await getConcept(req as any, { 
        params: { slug: 'infection-control' } 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.chapter.chapterNumber).toBe(4);
      expect(data.data.questions).toHaveLength(1);
    });

    it('should block access to chapter 5 concept for guest user', async () => {
      const mockConceptResult = {
        hasAccess: false,
        premiumRequired: true,
        chapterNumber: 5,
      };

      mockContentService.getConceptBySlug.mockResolvedValue(mockConceptResult);

      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/advanced-cardiac-monitoring',
      });

      const response = await getConcept(req as any, { 
        params: { slug: 'advanced-cardiac-monitoring' } 
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Premium access required');
      expect(data.premiumRequired).toBe(true);
      expect(data.chapterNumber).toBe(5);
      expect(data.message).toContain('Chapter 5');
      expect(data.message).toContain('premium subscription');
    });

    it('should block access to chapter 5 concept for free user', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({
        user: { email: mockFreeUser.email },
      });

      mockUserService.findByEmail.mockResolvedValue(mockFreeUser);

      const mockConceptResult = {
        hasAccess: false,
        premiumRequired: true,
        chapterNumber: 5,
      };

      mockContentService.getConceptBySlug.mockResolvedValue(mockConceptResult);

      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/advanced-life-support',
      });

      const response = await getConcept(req as any, { 
        params: { slug: 'advanced-life-support' } 
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.premiumRequired).toBe(true);
      expect(mockContentService.getConceptBySlug).toHaveBeenCalledWith(
        'advanced-life-support',
        mockFreeUser
      );
    });

    it('should allow access to chapter 5 concept for premium user', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({
        user: { email: mockPremiumUser.email },
      });

      mockUserService.findByEmail.mockResolvedValue(mockPremiumUser);

      const mockConceptResult = {
        hasAccess: true,
        data: {
          id: 'concept-5',
          title: 'Advanced Life Support',
          slug: 'advanced-life-support',
          content: 'ACLS protocols and advanced interventions...',
          conceptNumber: 1,
          chapter: {
            id: 'chapter-5',
            chapterNumber: 5,
            title: 'Advanced Cardiac Care',
          },
          questions: [
            {
              id: 'question-5',
              questionText: 'In cardiac arrest, what is the first priority?',
              questionType: 'MULTIPLE_CHOICE',
              explanation: 'High-quality chest compressions...',
              options: [],
            },
          ],
          isPremium: true,
        },
      };

      mockContentService.getConceptBySlug.mockResolvedValue(mockConceptResult);

      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/advanced-life-support',
      });

      const response = await getConcept(req as any, { 
        params: { slug: 'advanced-life-support' } 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.chapter.chapterNumber).toBe(5);
      expect(data.data.isPremium).toBe(true);
      expect(mockContentService.getConceptBySlug).toHaveBeenCalledWith(
        'advanced-life-support',
        mockPremiumUser
      );
    });

    it('should handle session errors gracefully', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockRejectedValue(new Error('Session service unavailable'));

      // Should still proceed without user context (guest access)
      const mockConceptResult = {
        hasAccess: true,
        data: {
          id: 'concept-1',
          title: 'Basic Nursing',
          slug: 'basic-nursing',
          chapter: { chapterNumber: 2 },
          questions: [],
          isPremium: false,
        },
      };

      mockContentService.getConceptBySlug.mockResolvedValue(mockConceptResult);

      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/basic-nursing',
      });

      const response = await getConcept(req as any, { 
        params: { slug: 'basic-nursing' } 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockContentService.getConceptBySlug).toHaveBeenCalledWith('basic-nursing', null);
    });

    it('should return 404 for non-existent concept', async () => {
      mockContentService.getConceptBySlug.mockRejectedValue(
        new Error('Concept not found')
      );

      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/non-existent-concept',
      });

      const response = await getConcept(req as any, { 
        params: { slug: 'non-existent-concept' } 
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Concept not found');
    });

    it('should return 400 for missing slug parameter', async () => {
      const { req } = createMocks({ 
        method: 'GET',
        url: '/api/concepts/',
      });

      const response = await getConcept(req as any, { 
        params: { slug: '' } 
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Concept slug is required');
    });
  });
});