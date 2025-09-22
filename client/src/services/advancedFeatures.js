// Advanced Features Service Layer
// This file contains all the service functions for the new advanced features

import { supabase } from '../supabaseClient';

// ==================== AI FEED ALGORITHM ====================

/**
 * Track user interaction for AI feed algorithm
 */
export async function trackUserInteraction(contentType, contentId, interactionType, interactionValue = 1) {
  try {
    const { data, error } = await supabase
      .from('user_interactions')
      .insert([{
        content_type: contentType,
        content_id: contentId,
        interaction_type: interactionType,
        interaction_value: interactionValue
      }]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error tracking interaction:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get AI-powered feed for user
 */
export async function getAIFeed(contentType = 'post', limit = 20) {
  try {
    // First, compute fresh scores for the user
    const { error: computeError } = await supabase.rpc('compute_feed_scores', {
      p_content_type: contentType
    });

    if (computeError) throw computeError;

    // Then fetch the ranked content
    let query;
    if (contentType === 'post') {
      query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, name, photos, is_verified),
          content_score:content_scores!inner(final_score)
        `)
        .eq('content_scores.content_type', 'post')
        .eq('content_scores.user_id', (await supabase.auth.getUser()).data.user.id)
        .order('content_scores.final_score', { ascending: false })
        .limit(limit);
    } else if (contentType === 'reel') {
      query = supabase
        .from('reels')
        .select(`
          *,
          author:profiles(id, name, photos, is_verified),
          content_score:content_scores!inner(final_score)
        `)
        .eq('content_scores.content_type', 'reel')
        .eq('content_scores.user_id', (await supabase.auth.getUser()).data.user.id)
        .order('content_scores.final_score', { ascending: false })
        .limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching AI feed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's personalization preferences
 */
export async function getUserPreferences() {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user preferences:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================== VIRTUAL GIFTS ====================

/**
 * Get all available virtual gifts
 */
export async function getVirtualGifts() {
  try {
    const { data, error } = await supabase
      .from('virtual_gifts')
      .select('*')
      .eq('is_active', true)
      .order('cost', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching virtual gifts:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a virtual gift to another user
 */
export async function sendVirtualGift(receiverId, giftId, message = null, context = 'profile', contextId = null) {
  try {
    const { data, error } = await supabase.rpc('send_virtual_gift', {
      p_receiver_id: receiverId,
      p_gift_id: giftId,
      p_message: message,
      p_context: context,
      p_context_id: contextId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending virtual gift:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get received virtual gifts for a user
 */
export async function getReceivedVirtualGifts(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('user_virtual_gifts')
      .select(`
        *,
        gift:virtual_gifts(*),
        sender:profiles(id, name, photos)
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching received gifts:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get sent virtual gifts for a user
 */
export async function getSentVirtualGifts(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('user_virtual_gifts')
      .select(`
        *,
        gift:virtual_gifts(*),
        receiver:profiles(id, name, photos)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching sent gifts:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================== PROFILE BOOST ====================

/**
 * Get boost pricing from app settings
 */
export async function getBoostPricing() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'profile_boost_cost')
      .single();

    if (error) throw error;
    return { success: true, data: data.value };
  } catch (error) {
    console.error('Error fetching boost pricing:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Purchase a profile boost
 */
export async function purchaseProfileBoost(durationMinutes = 30, boostType = 'visibility') {
  try {
    const { data, error } = await supabase.rpc('purchase_profile_boost', {
      p_duration_minutes: durationMinutes,
      p_boost_type: boostType
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error purchasing profile boost:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's active boosts
 */
export async function getActiveBoosts() {
  try {
    const { data, error } = await supabase
      .from('profile_boosts')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching active boosts:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================== GAMIFICATION ====================

/**
 * Get all available badges
 */
export async function getBadges() {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching badges:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId) {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user badges:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's daily streak information
 */
export async function getDailyStreak() {
  try {
    const { data, error } = await supabase
      .from('daily_streaks')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching daily streak:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update daily streak (call on login)
 */
export async function updateDailyStreak() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('update_daily_streak', {
      p_user_id: user.id
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating daily streak:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get user achievements
 */
export async function getUserAchievements() {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user achievements:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger badge check (call after user actions)
 */
export async function checkBadges(action, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('check_and_award_badges', {
      p_user_id: user.id,
      p_action: action,
      p_metadata: metadata
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error checking badges:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================== ADMIN ANALYTICS ====================

/**
 * Get cohort analysis data (Admin only)
 */
export async function getCohortAnalysis() {
  try {
    const { data, error } = await supabase
      .from('user_cohorts')
      .select('*')
      .order('cohort_month', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching cohort analysis:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get feature usage analytics (Admin only)
 */
export async function getFeatureUsage(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('feature_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching feature usage:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get revenue analytics (Admin only)
 */
export async function getRevenueAnalytics(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching revenue analytics:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get app settings (Admin only for non-public settings)
 */
export async function getAppSettings() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching app settings:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update app setting (Admin only)
 */
export async function updateAppSetting(key, value, description = null) {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating app setting:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get content moderation logs (Admin only)
 */
export async function getModerationLogs(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('content_moderation_logs')
      .select(`
        *,
        user:profiles(id, name),
        moderator:profiles(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching moderation logs:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Moderate content manually (Admin only)
 */
export async function moderateContent(contentType, contentId, status, notes = null) {
  try {
    const { data, error } = await supabase
      .from('content_moderation_logs')
      .insert([{
        content_type: contentType,
        content_id: contentId,
        moderation_type: 'manual',
        status: status,
        flags: notes ? { manual_notes: notes } : {}
      }]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error moderating content:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Track feature usage for analytics
 */
export async function trackFeatureUsage(featureName, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('feature_usage')
      .insert([{
        feature_name: featureName,
        metadata: metadata,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      }]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error tracking feature usage:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get public app settings (available to all users)
 */
export async function getPublicAppSettings() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('is_public', true);

    if (error) throw error;
    
    // Convert to key-value object
    const settings = data.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error fetching public app settings:', error.message);
    return { success: false, error: error.message };
  }
}