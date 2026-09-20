export * from './client';
export * from './complaints';
export * from './admin';

/*
 * This file acts as an index for the API layer.
 *
 * New Actual Endpoints integrated:
 * POST /api/complaints/report/ (FormData: image, raw_text, user_identifier, latitude, longitude, campus_zone, address)
 * GET /api/complaints/ (Optional filter: user_identifier, status, campus_zone)
 * GET /api/complaints/<uuid:id>/ (Retrieve individual complaint)
 * GET /api/admin/clusters/ (Triage Inbox)
 * GET /api/admin/map-markers/ (Live ACTS Map)
 */
