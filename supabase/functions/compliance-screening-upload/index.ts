import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roles) {
      console.error('Not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      userId, 
      screeningType, 
      screeningProvider, 
      screeningReference, 
      expiryDate,
      fileName,
      fileSize,
      mimeType,
      notes
    } = await req.json();

    // Validate inputs
    if (!userId || !screeningType || !screeningProvider || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate screening type
    if (!['pep', 'sanctions'].includes(screeningType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid screening type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF and images are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (10MB max)
    if (fileSize > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate expiry date if provided
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiry < today) {
        return new Response(
          JSON.stringify({ error: 'Expiry date cannot be in the past' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create file path and signed upload URL
    const filePath = `${userId}/${Date.now()}_${fileName}`;
    
    // Create database record first
    const { data: screeningDoc, error: insertError } = await supabaseClient
      .from('compliance_screening_documents')
      .insert({
        user_id: userId,
        screening_type: screeningType,
        screening_provider: screeningProvider,
        screening_reference: screeningReference || null,
        status: 'approved',
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        expiry_date: expiryDate || null,
        notes: notes || null,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create screening record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user profile with screening status
    const updateField = screeningType === 'pep' ? 'pep_screened' : 'sanctions_screened';
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        [updateField]: true,
        [`${screeningType}_screening_date`]: new Date().toISOString().split('T')[0]
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Generate signed upload URL
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('compliance-screening-documents')
      .createSignedUploadUrl(filePath);

    if (uploadError) {
      console.error('Upload URL error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate upload URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Compliance screening initiated by admin ${user.id} for user ${userId}, type: ${screeningType}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        uploadUrl: uploadData.signedUrl,
        data: screeningDoc,
        message: 'Screening record created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in compliance-screening-upload:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
