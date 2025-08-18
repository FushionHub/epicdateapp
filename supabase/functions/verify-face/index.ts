import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'
import { RekognitionClient, CompareFacesCommand } from 'https://esm.sh/@aws-sdk/client-rekognition@3.226.0'
import { corsHeaders } from '../_shared/cors.ts'

// IMPORTANT: The user must set these environment variables in their Supabase project settings
// Go to Project Settings -> Functions -> verify-face -> Secrets
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')!
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')!
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1' // Default to us-east-1 if not set

const rekognitionClient = new RekognitionClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
})

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

    // Get the live selfie image data from the request body
    const { liveImage } = await req.json()
    // The liveImage should be a base64-encoded string, so we need to decode it
    const liveImageBytes = atob(liveImage).split('').map(c => c.charCodeAt(0))


    // Fetch the user's profile to get their reference photo URL
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('photos')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.photos || profile.photos.length === 0) {
      throw new Error('Profile photo not found.')
    }
    const referencePhotoUrl = profile.photos[0]

    // Fetch the reference photo from the URL and get its bytes
    const referenceImageResponse = await fetch(referencePhotoUrl)
    const referenceImageBytes = new Uint8Array(await referenceImageResponse.arrayBuffer())

    // Prepare the command for Rekognition
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: referenceImageBytes },
      TargetImage: { Bytes: new Uint8Array(liveImageBytes) },
      SimilarityThreshold: 90, // Set a high similarity threshold
    })

    // Send the command to Rekognition
    const response = await rekognitionClient.send(command)

    let isVerified = false
    if (response.FaceMatches && response.FaceMatches.length > 0) {
      const match = response.FaceMatches[0]
      if (match.Similarity && match.Similarity >= 90) {
        isVerified = true
      }
    }

    if (isVerified) {
      // If verified, update the user's profile in the database
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id)

      if (updateError) throw updateError
    }

    return new Response(JSON.stringify({ verified: isVerified, details: response.FaceMatches }), {
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
