/**
 * Diagnostic Script: Check Widget Config in Database
 * 
 * Run this to see what config is actually stored in the database
 * for the license key that's showing old design
 */

import { getLicenseByKey, getWidgetsByLicenseId } from './lib/db/queries';

const LICENSE_KEY = '080bb4106dc3cd41d3550db57e11a177';

async function checkConfig() {
    console.log('=== CHECKING DATABASE CONFIG ===');
    console.log('License Key:', LICENSE_KEY);
    console.log('');

    // Get license
    const license = await getLicenseByKey(LICENSE_KEY);
    if (!license) {
        console.error('❌ License not found!');
        return;
    }

    console.log('✅ License found:');
    console.log('  - Tier:', license.tier);
    console.log('  - Status:', license.status);
    console.log('  - Domains:', license.domains);
    console.log('');

    // Get widgets
    const widgets = await getWidgetsByLicenseId(license.id);
    if (!widgets || widgets.length === 0) {
        console.error('❌ No widgets found for this license!');
        return;
    }

    console.log(`✅ Found ${widgets.length} widget(s):`);
    console.log('');

    widgets.forEach((widget, index) => {
        console.log(`Widget ${index + 1}:`);
        console.log('  - ID:', widget.id);
        console.log('  - Name:', widget.name);
        console.log('  - Status:', widget.status);
        console.log('  - Widget Type:', widget.widgetType);
        console.log('');
        console.log('  Config Top-Level Keys:', Object.keys(widget.config as object));
        console.log('');

        const config = widget.config as any;
        console.log('  themeMode:', config.themeMode);
        console.log('  accentColor:', config.accentColor);
        console.log('  useAccent:', config.useAccent);
        console.log('');
        console.log('  Legacy style.theme:', config.style?.theme);
        console.log('  Legacy style.primaryColor:', config.style?.primaryColor);
        console.log('');
        console.log('Full Config:');
        console.log(JSON.stringify(widget.config, null, 2));
    });

    console.log('');
    console.log('=== DIAGNOSIS ===');
    const widget = widgets[0];
    const config = widget.config as any;

    if (config.style?.theme && !config.themeMode) {
        console.log('⚠️  PROBLEM: Using legacy style.theme instead of themeMode');
        console.log('   This will cause old design to load!');
    }

    if (!config.useAccent && !config.accentColor) {
        console.log('⚠️  PROBLEM: No accent color configured');
    }

    console.log('');
}

checkConfig().catch(console.error);
