import { supabase } from '../supabaseClient';

// --- Profile Functions ---

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase.from('profiles').select('*, ringtone:ringtones(*)').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }
}

export async function upsertProfile(userId, profileData) {
  try {
    // Prevent empty string from being saved if username is not changed
    if (profileData.username === '') {
      delete profileData.username;
    }
    const profile = { id: userId, ...profileData, updated_at: new Date() };
    const { data, error } = await supabase.from('profiles').upsert(profile).select().single();

    if (error) {
      console.error('Error creating/updating profile:', error.message);
      return { data: null, error: error };
    }

    return { data: data, error: null };
  } catch (error) {
    console.error('Catastrophic error creating/updating profile:', error.message);
    return { data: null, error: error };
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

export async function createGroup(name, memberIds) {
  try {
    const { data, error } = await supabase.rpc('create_group_with_members', {
      p_name: name,
      p_member_ids: memberIds,
    });
    if (error) throw error;
    return { success: true, groupId: data };
  } catch (error) {
    console.error('Error creating group:', error.message);
    return { success: false, error: error.message };
  }
}

export async function contactSeller(sellerId) {
  try {
    const { data, error } = await supabase.rpc('create_conversation_for_listing', {
      p_seller_id: sellerId,
    });
    if (error) throw error;
    return { success: true, matchId: data };
  } catch (error) {
    console.error('Error contacting seller:', error.message);
    return { success: false, error: error.message };
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

export async function sendMediaMessage(matchId, senderId, file, messageType, isViewOnce = false) {
  try {
    const filePath = `${matchId}/${senderId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(filePath);
    const mediaUrl = urlData.publicUrl;
    const { data, error } = await supabase.from('messages').insert([{
      match_id: matchId,
      sender_id: senderId,
      media_url: mediaUrl,
      message_type: messageType,
      is_view_once: isViewOnce,
    }]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending media message:', error.message);
    return null;
  }
}

export async function editMessage(messageId, newTextContent) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .update({ text_content: newTextContent, is_edited: true })
            .eq('id', messageId);
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error editing message:', error.message);
        return null;
    }
}

export async function markMessageAsViewed(messageId) {
  try {
    const { data, error } = await supabase.functions.invoke('mark-message-viewed', {
      body: { messageId },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking message as viewed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function boostPost(postId) {
  try {
    const { data, error } = await supabase.functions.invoke('boost-post', {
      body: { postId },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error boosting post:', error.message);
    // It's good to return the error message from the function
    return { success: false, error: error.data?.error || error.message };
  }
}

// --- Monetization & KYC Functions ---

export async function getWallet(userId) {
  try {
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId);
    if (error) throw error;
    return data; // Returns an array of wallets
  } catch (error) {
    console.error('Error fetching wallet:', error.message);
    return [];
  }
}

export async function initializePayment(amount, currency = 'NGN', provider) {
  try {
    const { data, error } = await supabase.functions.invoke('initialize-payment', {
      body: { amount, currency, provider },
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

export async function transferFunds(receiverId, amount, currency) {
  try {
    const { data, error } = await supabase.rpc('transfer_funds', {
      p_receiver_id: receiverId,
      p_amount: amount,
      p_currency: currency,
    });
    if (error) {
      // The RPC function returns a text message, not an error object on failure
      // So we check if the data contains the error message.
      if (typeof data === 'string' && (data.includes('Insufficient funds') || data.includes('does not have a wallet'))) {
         return { error: data };
      }
      throw error;
    }
    return { success: true, message: data };
  } catch (error) {
    console.error('Error transferring funds:', error.message);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function createOnfidoApplicant() {
    try {
        const { data, error } = await supabase.functions.invoke('create-onfido-applicant');
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating Onfido applicant:', error.message);
        return { error: error.message };
    }
}

export async function uploadKycDocument(userId, file, documentType) {
    try {
        const filePath = `${userId}/${documentType}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('kyc-documents').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('kyc-documents').getPublicUrl(filePath);
        const documentUrl = data.publicUrl;

        // Create a record in the kyc_documents table
        const { error: dbError } = await supabase.from('kyc_documents').insert([
            { user_id: userId, document_type: documentType, document_url: documentUrl, status: 'pending' }
        ]);
        if (dbError) throw dbError;

        // Update profile kyc_status
        await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', userId);

        return { success: true };
    } catch (error) {
        console.error('Error uploading KYC document:', error.message);
        return { success: false, error: error.message };
    }
}

// --- Marketplace Functions ---

export async function getListings() {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        price,
        currency,
        image_urls,
        seller:profiles(id, name)
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching listings:', error.message);
    return [];
  }
}

export async function getListingDetails(listingId) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*, seller:profiles(*)')
      .eq('id', listingId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching listing details:', error.message);
    return null;
  }
}

export async function uploadListingImage(file, userId) {
  try {
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('listing-images').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('listing-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading listing image:', error.message);
    return null;
  }
}

export async function createListing(listingData) {
  try {
    const { data, error } = await supabase.from('listings').insert([listingData]).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating listing:', error.message);
    return null;
  }
}

export async function updateListing(listingId, updates) {
  try {
    const { data, error } = await supabase.from('listings').update(updates).eq('id', listingId).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating listing:', error.message);
    return null;
  }
}

export async function deleteListing(listingId) {
  try {
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting listing:', error.message);
    return { success: false, error: error.message };
  }
}


// --- Social & Call Functions ---

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

export async function sendIncomingCallSignal(callerId, receiverId, matchId) {
    const channel = supabase.channel(`user-calls-${receiverId}`);
    return await channel.send({
        type: 'broadcast',
        event: 'incoming-call',
        payload: { callerId, matchId },
    });
}

// ... other functions ...

export async function findFriendsFromContacts(contacts) {
  try {
    const { data, error } = await supabase.functions.invoke('find-friends-from-contacts', {
      body: { contacts },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error finding friends from contacts:', error.message);
    return { success: false, error: error.message };
  }
}

// --- Group Chat Functions ---

export async function getGroupsForUser(userId) {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        avatar_url,
        group_members!inner(user_id)
      `)
      .eq('group_members.user_id', userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching groups for user:', error.message);
    return [];
  }
}

// --- Advertisement Functions ---

export async function getAdvertisements() {
  try {
    const { data, error } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching advertisements:', error.message);
    return [];
  }
}

export async function uploadAdImage(file) {
  try {
    const filePath = `public/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('ad-images').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('ad-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading ad image:', error.message);
    return null;
  }
}

export async function createAdvertisement(adData) {
  try {
    const { data, error } = await supabase.from('advertisements').insert([adData]).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating advertisement:', error.message);
    return null;
  }
}

export async function updateAdvertisement(adId, updates) {
  try {
    const { data, error } = await supabase.from('advertisements').update(updates).eq('id', adId).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating advertisement:', error.message);
    return null;
  }
}
