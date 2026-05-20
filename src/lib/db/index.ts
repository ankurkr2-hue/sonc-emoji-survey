import { excelDb } from './excel';
import { supabaseDb } from './supabase';
import type { DbInterface } from './interface';

const backend = process.env.DB_BACKEND ?? 'excel';

export const db: DbInterface = backend === 'supabase' ? supabaseDb : excelDb;
export type { DbInterface };
export * from './types';
