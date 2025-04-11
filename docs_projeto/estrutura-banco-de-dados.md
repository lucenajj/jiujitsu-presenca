create table public.academies (
  id uuid not null default gen_random_uuid (),
  owner_name character varying(255) not null,
  name character varying(255) not null,
  cnpj character varying(18) not null,
  street character varying(255) not null,
  neighborhood character varying(255) not null,
  zip_code character varying(9) not null,
  phone character varying(15) not null,
  email character varying(255) not null,
  user_id uuid null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint academies_pkey primary key (id),
  constraint academies_cnpj_key unique (cnpj),
  constraint academies_email_key unique (email),
  constraint academies_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint academies_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists academies_user_id_idx on public.academies using btree (user_id) TABLESPACE pg_default;

create index IF not exists academies_created_by_idx on public.academies using btree (created_by) TABLESPACE pg_default;

create index IF not exists academies_cnpj_idx on public.academies using btree (cnpj) TABLESPACE pg_default;

create index IF not exists academies_email_idx on public.academies using btree (email) TABLESPACE pg_default;

create trigger update_academies_modtime BEFORE
update on academies for EACH row
execute FUNCTION update_modified_column ();

create table public.attendance (
  id uuid not null default gen_random_uuid (),
  class_id uuid not null,
  date date not null,
  student_ids uuid[] not null,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  academy_id uuid null,
  constraint attendance_pkey primary key (id),
  constraint attendance_class_id_date_key unique (class_id, date),
  constraint attendance_academy_id_fkey foreign KEY (academy_id) references academies (id),
  constraint attendance_class_id_fkey foreign KEY (class_id) references classes (id),
  constraint attendance_created_by_fkey foreign KEY (created_by) references auth.users (id)
) TABLESPACE pg_default;

create table public.classes (
  id uuid not null default gen_random_uuid (),
  name text not null,
  instructor text not null,
  level public.class_level not null default 'all'::class_level,
  day_of_week weekday[] not null,
  time_start time without time zone not null,
  time_end time without time zone not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  academy_id uuid null,
  constraint classes_pkey primary key (id),
  constraint classes_academy_id_fkey foreign KEY (academy_id) references academies (id),
  constraint classes_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create trigger update_classes_timestamp BEFORE
update on classes for EACH row
execute FUNCTION update_timestamp ();

create table public.students (
  id uuid not null default gen_random_uuid (),
  name text not null,
  email text null,
  phone text null,
  belt public.belt_level not null default 'white'::belt_level,
  stripes integer not null default 0,
  status text not null default 'active'::text,
  registration_date timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  classes_per_week integer not null default 3,
  classes_attended integer not null default 0,
  last_promotion_date date not null default CURRENT_DATE,
  academy_id uuid null,
  constraint students_pkey primary key (id),
  constraint students_academy_id_fkey foreign KEY (academy_id) references academies (id)
) TABLESPACE pg_default;

create trigger update_students_timestamp BEFORE
update on students for EACH row
execute FUNCTION update_timestamp ();

FUNÇÃO QUE VOCÊ PEDIU PARA CRIAR:
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Note: O uso da service_role key é seguro aqui porque este código roda no servidor
// e não é exposto ao cliente.
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
async function listUsers(req) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Mapear usuários com suas roles para o formato esperado pelo front-end
    const mappedUsers = data.users.map((user)=>({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || '',
        role: user.user_metadata?.role || 'viewer'
      }));
    return new Response(JSON.stringify({
      users: mappedUsers
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Erro ao listar usuários'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
async function createUser(req) {
  try {
    const body = await req.json();
    const { email, password, role = 'viewer' } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'Email e senha são obrigatórios'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        role
      },
      email_confirm: true
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      user: data.user
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Erro ao criar usuário'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
async function updateUser(req) {
  try {
    const body = await req.json();
    const { userId, role } = body;
    if (!userId || !role) {
      return new Response(JSON.stringify({
        error: 'ID do usuário e role são obrigatórios'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        role
      }
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      user: data.user
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Erro ao atualizar usuário'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
async function deleteUser(req) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'ID do usuário é obrigatório'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Erro ao excluir usuário'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
// Trata as requisições HTTP
serve(async (req)=>{
  // Configura CORS - MODIFICADO PARA INCLUIR LOCALHOST:3025
  const headers = new Headers({
    'Access-Control-Allow-Origin': 'http://localhost:3025',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  });
  // Responde a requisições OPTIONS (preflight para CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers
    });
  }
  // Verifica a autorização (apenas usuários admin podem chamar estas funções)
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Não autorizado'
      }), {
        status: 401,
        headers
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user || user.user_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({
        error: 'Acesso restrito a administradores'
      }), {
        status: 403,
        headers
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Erro na autenticação'
    }), {
      status: 401,
      headers
    });
  }
  // Roteamento baseado na URL e método
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  // Adicionar os headers CORS em todas as respostas
  const addCorsHeaders = (response)=>{
    headers.forEach((value, key)=>{
      response.headers.set(key, value);
    });
    return response;
  };
  let response;
  switch(path){
    case 'list':
      response = await listUsers(req);
      return addCorsHeaders(response);
    case 'create':
      response = await createUser(req);
      return addCorsHeaders(response);
    case 'update':
      response = await updateUser(req);
      return addCorsHeaders(response);
    case 'delete':
      response = await deleteUser(req);
      return addCorsHeaders(response);
    default:
      response = new Response(JSON.stringify({
        error: 'Rota não encontrada'
      }), {
        status: 404,
        headers
      });
      return addCorsHeaders(response);
  }
});
