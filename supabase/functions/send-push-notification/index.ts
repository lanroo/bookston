
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushNotificationPayload {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  try {
    const { notification, actorProfile } = await req.json();

    if (!notification || !actorProfile) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .eq('user_id', notification.user_id);

    if (tokensError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let title = 'Nova notificação';
    let body = '';

    switch (notification.type) {
      case 'follow':
        title = 'Novo seguidor';
        body = `${actorProfile.name || 'Alguém'} começou a seguir você`;
        break;
      case 'like':
        title = 'Nova curtida';
        body = `${actorProfile.name || 'Alguém'} curtiu sua resenha`;
        break;
      case 'comment':
        title = 'Novo comentário';
        body = `${actorProfile.name || 'Alguém'} comentou na sua resenha`;
        break;
      case 'mention':
        title = 'Você foi mencionado';
        body = `${actorProfile.name || 'Alguém'} mencionou você`;
        break;
    }

    const messages: PushNotificationPayload[] = tokens.map((tokenRow) => ({
      to: tokenRow.token,
      sound: 'default',
      title,
      body,
      data: {
        type: notification.type,
        actorId: notification.actor_id,
        postId: notification.post_id,
        notificationId: notification.id,
      },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo Push API error: ${errorText}`);
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

