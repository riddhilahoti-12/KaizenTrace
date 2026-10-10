import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { GitService } from '../services/gitService.js';
import { Event } from '../models/Event.js';
import { Run } from '../models/Run.js';
import { Incident } from '../models/Incident.js';

let app: any;

beforeAll(async () => {
  process.env.MONGODB_URI = 'memory';
  await connectDatabase();
  app = createApp();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('KaizenTrace Backend Endpoints', () => {
  it('GET /api/health should return ok with database and git status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toHaveProperty('connected');
    expect(res.body.git).toHaveProperty('baselineCommit');
  });

  it('GET /api/baseline should return current baseline commit', async () => {
    const res = await request(app).get('/api/baseline');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('baselineCommit');
  });

  it('POST /api/events should ingest and deduplicate telemetry events', async () => {
    const eventId = `test_evt_${Date.now()}`;
    const payload = {
      eventId,
      projectId: 'teamflow',
      eventType: 'APP_ERROR',
      component: 'auth.controller',
      route: '/api/tasks/123',
      errorMessage: 'Simulated permission denied error',
      severity: 'high',
    };

    const res1 = await request(app).post('/api/events').send(payload);
    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.count).toBe(1);

    // Duplicate submission should be gracefully ignored
    const res2 = await request(app).post('/api/events').send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body.count).toBe(0);

    const saved = await Event.findOne({ eventId });
    expect(saved).not.toBeNull();
    expect(saved?.errorMessage).toBe('Simulated permission denied error');
  });

  it('GET /api/runs and GET /api/incidents should return list of records', async () => {
    const runsRes = await request(app).get('/api/runs');
    expect(runsRes.status).toBe(200);
    expect(Array.isArray(runsRes.body.runs)).toBe(true);

    const incsRes = await request(app).get('/api/incidents');
    expect(incsRes.status).toBe(200);
    expect(Array.isArray(incsRes.body.incidents)).toBe(true);
  });
});
