import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role server-side
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      console.error('Not an admin:', roleError);
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

    // Validate required fields
    if (!userId || !screeningType || !fileName) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, screeningType, fileName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate screening type
    if (!['pep', 'sanctions'].includes(screeningType)) {
      console.error('Invalid screening type:', screeningType);
      return new Response(
        JSON.stringify({ error: 'Invalid screening type. Must be "pep" or "sanctions"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type (PDF or images only)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (mimeType && !allowedMimeTypes.includes(mimeType)) {
      console.error('Invalid file type:', mimeType);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF and images (JPEG, PNG, WEBP) are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (fileSize && fileSize > maxFileSize) {
      console.error('File too large:', fileSize);
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate expiry date is in the future
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiry < today) {
        console.error('Expiry date in the past:', expiryDate);
        return new Response(
          JSON.stringify({ error: 'Expiry date must be in the future' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate screening provider is not empty
    if (!screeningProvider || screeningProvider.trim() === '') {
      console.error('Missing screening provider');
      return new Response(
        JSON.stringify({ error: 'Screening provider is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}_${sanitizedFileName}`;

    // Create signed upload URL for client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('compliance-screening-documents')
      .createSignedUploadUrl(filePath);

    if (uploadError) {
      console.error('Failed to create upload URL:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create upload URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create database record with pending status
    const { data: documentData, error: dbError } = await supabase
      .from('compliance_screening_documents')
      .insert({
        user_id: userId,
        screening_type: screeningType,
        screening_provider: screeningProvider.trim(),
        screening_reference: screeningReference?.trim() || null,
        status: 'approved', // Admins can approve directly
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize || null,
        mime_type: mimeType || null,
        expiry_date: expiryDate || null,
        uploaded_by: user.id,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to create screening record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile screening status
    const updateField = screeningType === 'pep' ? 'pep_screened' : 'sanctions_screened';
    const dateField = screeningType === 'pep' ? 'pep_screening_date' : 'sanctions_screening_date';
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        [updateField]: true,
        [dateField]: new Date().toISOString().split('T')[0]
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      // Don't fail the whole operation, just log
    }

    console.log('Screening document created successfully:', documentData.id);

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: uploadData.signedUrl,
        token: uploadData.token,
        path: filePath,
        documentId: documentData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
