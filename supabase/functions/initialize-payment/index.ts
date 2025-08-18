import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'
import { corsHeaders } from '../_shared/cors.ts'

// IMPORTANT: The user must set this environment variable in their Supabase project settings
// Go to Project Settings -> Functions -> initialize-payment -> Secrets
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the auth token
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Get amount and currency from the request body
    const { amount, currency } = await req.json()
    if (!amount || !currency) {
      throw new Error('Amount and currency are required.')
    }

    // Paystack expects the amount in the smallest currency unit (kobo for NGN, cents for USD)
    const amountInKobo = amount * 100;

    const paystackBody = {
      email: user.email,
      amount: amountInKobo,
      currency: currency, // e.g., 'NGN', 'USD'
      // Generate a unique reference for this transaction
      reference: `datingapp_${user.id}_${Date.now()}`,
      metadata: {
        user_id: user.id,
        app_name: 'DatingApp'
      },
      callback_url: `${Deno.env.get('SITE_URL')}/wallet` // Redirect back to the wallet page after payment
    }

    // Call the Paystack API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackBody)
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || 'Failed to initialize payment with Paystack.')
    }

    return new Response(JSON.stringify(paystackData.data), {
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
