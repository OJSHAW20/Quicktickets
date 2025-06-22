'use server';


import { createSupabaseServer } from '../lib/supabaseServer'; // adjust if alias differs


/**
* Params: { orderId: uuid, message: string }
* Inserts a pending dispute row for the current user.
*/
export async function createDispute({ orderId, message }) {
 const supabase = createSupabaseServer();


 const {
   data: { user },
   error: userErr,
 } = await supabase.auth.getUser();


 if (userErr) throw new Error(userErr.message);
 if (!user)   throw new Error('Not signed in');


 const { error } = await supabase
   .from('disputes')
   .insert({
     order_id: orderId,
     raised_by: user.id,
     message,
     status: 'pending',
   });


 if (error) throw new Error(error.message);
}
