import supabaseAdmin from '../src/config/supabase';

async function seedWhatsApp() {
    console.log('Seeding WhatsApp integration...');

    const { error } = await supabaseAdmin
        .from('integrations')
        .upsert({
            name: 'WhatsApp Business',
            provider: 'whatsapp',
            description: 'Send messages and receive notifications via WhatsApp Business API.',
            is_active: false,
            config: {},
            triggers: [],
            updated_at: new Date().toISOString()
        }, { onConflict: 'provider' });

    if (error) {
        console.error('Error seeding WhatsApp integration:', error);
        process.exit(1);
    }

    console.log('WhatsApp integration seeded successfully.');
}

seedWhatsApp();
