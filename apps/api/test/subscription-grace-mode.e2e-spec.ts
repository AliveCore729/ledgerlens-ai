import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Subscription Grace Mode (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUser: any;
  let testOrg: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Setup Test User and Org
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@e2e.com`,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    // Orgs default to PENDING
    testOrg = await prisma.organization.create({
      data: {
        name: 'Test Org',
      },
    });

    await prisma.organizationUser.create({
      data: {
        userId: testUser.id,
        organizationId: testOrg.id,
        role: 'ADMIN',
      },
    });

    authToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      role: 'USER',
    });
  });

  afterAll(async () => {
    await prisma.organizationUser.deleteMany({ where: { userId: testUser.id } });
    await prisma.organization.delete({ where: { id: testOrg.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await app.close();
  });

  describe('When Organization is PENDING', () => {
    it('should ALLOW GET /team (Read Access)', () => {
      return request(app.getHttpServer())
        .get('/team')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    it('should BLOCK POST /team/invite (Mutate Access)', () => {
      return request(app.getHttpServer())
        .post('/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invite@test.com', role: 'MEMBER' })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('read-only mode');
        });
    });
  });

  describe('When Organization is ACTIVE', () => {
    beforeAll(async () => {
      await prisma.organization.update({
        where: { id: testOrg.id },
        data: { subscriptionStatus: 'ACTIVE' },
      });
    });

    it('should ALLOW GET /team', () => {
      return request(app.getHttpServer())
        .get('/team')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should ALLOW POST /team/invite', () => {
      return request(app.getHttpServer())
        .post('/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invite@test.com', role: 'MEMBER' })
        .expect((res) => {
          // It might be 201 created or 400 bad request depending on email setup, 
          // but crucially it should NOT be 403 Forbidden.
          expect(res.status).not.toBe(403);
        });
    });

    it('should ALLOW GET /vendors (Testing shared helper)', () => {
      return request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should ALLOW GET /billing/subscription (Testing shared helper)', () => {
      return request(app.getHttpServer())
        .get('/billing/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ACTIVE');
        });
    });
  });
  
  describe('When Organization is EXPIRED', () => {
    beforeAll(async () => {
      await prisma.organization.update({
        where: { id: testOrg.id },
        data: { subscriptionStatus: 'EXPIRED' },
      });
    });

    it('should ALLOW GET /team (Read Access)', () => {
      return request(app.getHttpServer())
        .get('/team')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should BLOCK POST /team/invite (Mutate Access)', () => {
      return request(app.getHttpServer())
        .post('/team/invite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invite2@test.com', role: 'MEMBER' })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('read-only mode');
        });
    });
  });
});
