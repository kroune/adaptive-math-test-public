import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { Item, Topic, MotivationQuestion } from '../../types';

// --- Items ---

export async function createItem(payload: Omit<Item, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('items')
    .insert({ id: crypto.randomUUID(), ...payload });
  if (error) {
    logger.error('createItem failed', error);
    throw error;
  }
}

export async function updateItem(
  id: string,
  payload: Partial<Omit<Item, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('items').update(payload).eq('id', id);
  if (error) {
    logger.error('updateItem failed', error, { id });
    throw error;
  }
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) {
    logger.error('deleteItem failed', error, { id });
    throw error;
  }
}

// --- Topics ---

export async function createTopic(
  payload: Pick<Topic, 'name' | 'order_index'> & { icon_url?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('topics')
    .insert({ id: crypto.randomUUID(), ...payload });
  if (error) {
    logger.error('createTopic failed', error);
    throw error;
  }
}

export async function updateTopic(
  id: string,
  payload: Pick<Topic, 'name' | 'order_index'> & { icon_url?: string | null }
): Promise<void> {
  const { error } = await supabase.from('topics').update(payload).eq('id', id);
  if (error) {
    logger.error('updateTopic failed', error, { id });
    throw error;
  }
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) {
    logger.error('deleteTopic failed', error, { id });
    throw error;
  }
}

// --- Motivation Questions ---

export async function createMotivationQuestion(
  payload: Omit<MotivationQuestion, 'id'>
): Promise<void> {
  const { error } = await supabase
    .from('motivation_questions')
    .insert({ id: crypto.randomUUID(), ...payload });
  if (error) {
    logger.error('createMotivationQuestion failed', error);
    throw error;
  }
}

export async function updateMotivationQuestion(
  id: string,
  payload: Omit<MotivationQuestion, 'id'>
): Promise<void> {
  const { error } = await supabase
    .from('motivation_questions')
    .update(payload)
    .eq('id', id);
  if (error) {
    logger.error('updateMotivationQuestion failed', error, { id });
    throw error;
  }
}

export async function deleteMotivationQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('motivation_questions')
    .delete()
    .eq('id', id);
  if (error) {
    logger.error('deleteMotivationQuestion failed', error, { id });
    throw error;
  }
}
