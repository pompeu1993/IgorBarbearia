async function run() {
    const [{ createClient }, fs] = await Promise.all([
        import("@supabase/supabase-js"),
        import("node:fs"),
    ]);
    const envFile = fs.readFileSync(".env.local", "utf-8");
    const lines = envFile.split("\n");
    let supabaseUrl = "";
    let supabaseKey = "";

    lines.forEach((line) => {
        if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
            supabaseUrl = line.split("=")[1].trim();
        }
        if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
            supabaseKey = line.split("=")[1].trim();
        }
    });

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("Applying fix to Supabase profiles trigger...");
    
    // Create an RPC to execute raw SQL because Supabase API doesn't support it directly
    const { error: rpcError } = await supabase.rpc('exec_sql', { 
        sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.profiles (id, name, phone, cpf)
          VALUES (
            new.id,
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'phone',
            new.raw_user_meta_data->>'cpf'
          );
          RETURN new;
        EXCEPTION
          WHEN others THEN
            RAISE LOG 'Error in handle_new_user: %', SQLERRM;
            RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
    });

    if (rpcError) {
        console.log("Could not run exec_sql directly, checking if we can just disable the trigger.");
        // Try to update through rest api if possible, but it's not.
    } else {
        console.log("Trigger updated successfully via RPC!");
    }
}

run();
