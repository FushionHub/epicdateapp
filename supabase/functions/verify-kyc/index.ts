import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'
import { corsHeaders } from '../_shared/cors.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { kycType, value } = await req.json() // e.g., kycType: 'bvn', value: '12345678901'

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')!
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let paystackUrl = ''
    switch (kycType) {
        case 'bvn':
            paystackUrl = `https://api.paystack.co/bvn/match`;
            // Paystack requires more data for BVN match, this is a simplified example
            // A real implementation would need to collect first_name, last_name, etc.
            break;
        case 'nin':
            // Paystack has different endpoints or partners for NIN verification
            throw new Error('NIN verification not implemented in this example.');
        default:
            throw new Error('Invalid KYC type.');
    }

    // This is a placeholder for the actual API call logic
    // const response = await fetch(paystackUrl, { ... });
    // const data = await response.json();
    // if (!data.status || !data.data.is_blacklisted) { ... }

    // --- MOCK RESPONSE FOR DEMONSTRATION ---
    const mockSuccess = Math.random() > 0.3; // Simulate 70% success rate

    if (!mockSuccess) {
        throw new Error(`KYC verification failed for ${kycType}.`);
    }
    // --- END MOCK RESPONSE ---

    // If verification is successful, update the user's profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ kyc_status: 'approved' })
      .eq('id', user.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, message: 'KYC verification successful.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
