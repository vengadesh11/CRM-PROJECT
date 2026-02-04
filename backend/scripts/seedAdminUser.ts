/// <reference types="node" />

import supabaseAdmin from '../src/config/supabase';

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const adminName = process.env.SEED_ADMIN_NAME || 'Super Admin';
const roleName = process.env.SEED_ADMIN_ROLE_NAME || 'Super Admin';
const roleDescription = process.env.SEED_ADMIN_ROLE_DESC || 'Full access role for DocuFlow CRM';

if (!adminEmail || !adminPassword) {
    console.error('Please set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env before running this script.');
    process.exit(1);
}

async function ensureRole() {
    const { data: existingRoles } = await supabaseAdmin
        .from('roles')
        .select('*')
        .eq('name', roleName)
        .limit(1);

    if (existingRoles && existingRoles.length > 0) {
        return existingRoles[0];
    }

    const { data: newRole, error } = await supabaseAdmin
        .from('roles')
        .insert([{ name: roleName, description: roleDescription, is_active: true }])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return newRole;
}

async function grantAllPermissions(roleId: string) {
    const { data: permissions } = await supabaseAdmin
        .from('permissions')
        .select('id');

    if (!permissions?.length) {
        console.warn('No permissions found to grant. Please seed permissions separately if this is unexpected.');
        return;
    }

    const rows = permissions.map((permission: any) => ({
        role_id: roleId,
        permission_id: permission.id,
    }));

    const { error } = await supabaseAdmin
        .from('role_permissions')
        .upsert(rows, { onConflict: 'role_id,permission_id' });

    if (error) {
        throw error;
    }
}

async function waitForAuthUser(userId: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!error && data?.user) {
            return data.user;
        }
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
    throw new Error(`Auth user ${userId} did not become available after creation`);
}

async function ensureAuthUser(roleId: string) {
    const { data: existingAuthUsers } = await supabaseAdmin
        .from('auth.users')
        .select('id')
        .eq('email', adminEmail)
        .limit(1);

    let userId: string;

    if (existingAuthUsers && existingAuthUsers.length > 0) {
        userId = existingAuthUsers[0].id;
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: adminPassword,
            user_metadata: {
                full_name: adminName,
                role: roleName,
                role_id: roleId,
            },
        });
    } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                full_name: adminName,
                role: roleName,
                role_id: roleId,
            },
        });

        if (error) {
            throw error;
        }

        userId = data.user?.id as string;
        if (!userId) {
            throw new Error('Supabase did not return a user id after creating the admin user.');
        }
    }

    await waitForAuthUser(userId);

    const { error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: userId,
            email: adminEmail,
            name: adminName,
            role_id: roleId,
            is_active: true,
        }, { onConflict: 'id' });

    if (userError) {
        throw userError;
    }

    return userId;
}

async function main() {
    console.log('Seeding super admin user...');

    const role = await ensureRole();
    await grantAllPermissions(role.id);
    const userId = await ensureAuthUser(role.id);

    console.log(`Super admin (${adminEmail}) ready: auth id ${userId}, role ${role.name}`);
}

main().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
