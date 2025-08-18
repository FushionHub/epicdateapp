import { supabase } from '../supabaseClient';

// --- Profile Functions ---

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }
}

export async function upsertProfile(userId, profileData) {
  try {
    const profile = { id: userId, ...profileData, updated_at: new Date() };
    const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating/updating profile:', error.message);
    return null;
  }
}

export async function getAllProfiles(currentUserId) {
    try {
        // Get IDs of users who have blocked the current user
        const { data: usersWhoBlockedMe } = await supabase
            .from('blocked_users')
            .select('blocker_id')
            .eq('blocked_id', currentUserId);
        const usersWhoBlockedMeIds = usersWhoBlockedMe.map(u => u.blocker_id);

        // Get IDs of users the current user has blocked
        const { data: usersIBlocked } = await supabase
            .from('blocked_users')
            .select('blocked_id')
            .eq('blocker_id', currentUserId);
        const usersIBlockedIds = usersIBlocked.map(u => u.blocked_id);

        const excludedIds = [...usersWhoBlockedMeIds, ...usersIBlockedIds, currentUserId];

        // Fetch all profiles excluding the excluded IDs
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .not('id', 'in', `(${excludedIds.join(',')})`);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching all profiles:', error.message);
        return [];
    }
}

// --- Matchmaking Functions ---

export async function likeUser(likedUserId) {
  try {
    const { data, error } = await supabase.rpc('create_like_and_match', { p_liked_id: likedUserId });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error liking user:', error.message);
    return null;
  }
}

export async function getMatches(currentUserId) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`id, created_at, user1:profiles!matches_user1_id_fkey(id, name, photos), user2:profiles!matches_user2_id_fkey(id, name, photos)`)
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
    if (error) throw error;
    const formattedMatches = data.map(match => {
      const otherUser = match.user1.id === currentUserId ? match.user2 : match.user1;
      return { match_id: match.id, matched_at: match.created_at, other_user: { id: otherUser.id, name: otherUser.name, photo: otherUser.photos ? otherUser.photos[0] : null } };
    });
    return formattedMatches;
  } catch (error) {
    console.error('Error fetching matches:', error.message);
    return [];
  }
}

// --- Timeline/Post Functions ---

export async function uploadPostImage(userId, file) {
  try {
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('post-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error.message);
    return null;
  }
}

export async function createPost(userId, textContent, imageUrl = null) {
  try {
    const { data, error } = await supabase.from('posts').insert([{ user_id: userId, text_content: textContent, image_url: imageUrl }]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating post:', error.message);
    return null;
  }
}

export async function getTimeline(userId) {
  try {
    const { data, error } = await supabase.from('posts').select(`*, author:profiles(name, photos)`).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching timeline:', error.message);
    return [];
  }
}

// --- Chat/Message Functions ---

export async function getMessages(matchId) {
  try {
    const { data, error } = await supabase.from('messages').select(`*, sender:profiles(name, photos)`).eq('match_id', matchId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    return [];
  }
}

export async function sendMessage(matchId, senderId, textContent) {
  try {
    const { data, error } = await supabase.from('messages').insert([{ match_id: matchId, sender_id: senderId, text_content: textContent, message_type: 'text' }]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error.message);
    return null;
  }
}

export async function sendMediaMessage(matchId, senderId, file, messageType) {
  try {
    const filePath = `${matchId}/${senderId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(filePath);
    const mediaUrl = urlData.publicUrl;
    const { data, error } = await supabase.from('messages').insert([{ match_id: matchId, sender_id: senderId, media_url: mediaUrl, message_type: messageType }]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending media message:', error.message);
    return null;
  }
}

// --- Monetization Functions ---

export async function getWallet(userId) {
  try {
    const { data, error } = await supabase.from('wallets').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching wallet:', error.message);
    return null;
  }
}

export async function getTransactions(walletId) {
  try {
    const { data, error } = await supabase.from('transactions').select('*').eq('wallet_id', walletId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    return [];
  }
}

export async function initializePayment(amount, currency = 'NGN') {
  try {
    const { data, error } = await supabase.functions.invoke('initialize-payment', {
      body: { amount, currency },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error initializing payment:', error.message);
    return null;
  }
}

export async function getGiftTypes() {
  try {
    const { data, error } = await supabase.from('gift_types').select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching gift types:', error.message);
    return [];
  }
}

export async function sendGift(receiverId, giftTypeId) {
  try {
    const { data, error } = await supabase.rpc('send_gift', {
      p_receiver_id: receiverId,
      p_gift_type_id: giftTypeId,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending gift:', error.message);
    return null;
  }
}

export async function getReceivedGifts(userId) {
    try {
        const { data, error } = await supabase
            .from('user_gifts')
            .select(`*, sender:profiles(name), gift:gift_types(*)`)
            .eq('receiver_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching received gifts:', error.message);
        return [];
    }
}

// --- Social Features Functions ---

export async function followUser(followerId, followingId) {
  try {
    const { data, error } = await supabase.from('followers').insert([{ follower_id: followerId, following_id: followingId }]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error following user:', error.message);
    return null;
  }
}

export async function unfollowUser(followerId, followingId) {
  try {
    const { data, error } = await supabase.from('followers').delete().match({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error unfollowing user:', error.message);
    return null;
  }
}

export async function getFollowerCount(userId) {
  try {
    const { count, error } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    if (error) throw error;
    return count;
  } catch (error) {
    console.error('Error getting follower count:', error.message);
    return 0;
  }
}

export async function getFollowingCount(userId) {
  try {
    const { count, error } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    if (error) throw error;
    return count;
  } catch (error) {
    console.error('Error getting following count:', error.message);
    return 0;
  }
}

export async function isFollowing(followerId, followingId) {
    try {
        const { data, error } = await supabase.from('followers').select('*').match({ follower_id: followerId, following_id: followingId }).maybeSingle();
        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Error checking follow status:', error.message);
        return false;
    }
}

export async function blockUser(blockerId, blockedId) {
    try {
        const { data, error } = await supabase.from('blocked_users').insert([{ blocker_id: blockerId, blocked_id: blockedId }]);
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error blocking user:', error.message);
        return null;
    }
}

export async function unblockUser(blockerId, blockedId) {
    try {
        const { data, error } = await supabase.from('blocked_users').delete().match({ blocker_id: blockerId, blocked_id: blockedId });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error unblocking user:', error.message);
        return null;
    }
}

export async function reportUser(reporterId, reportedId, reason) {
    try {
        const { data, error } = await supabase.from('reports').insert([{ reporter_id: reporterId, reported_id: reportedId, reason: reason }]);
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error reporting user:', error.message);
        return null;
    }
}

// --- Notification Functions ---

export async function saveFCMToken(userId, token) {
    try {
        const { data, error } = await supabase.from('fcm_tokens').upsert({ user_id: userId, token: token }, { onConflict: 'user_id, token' });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving FCM token:', error.message);
        return null;
    }
}
