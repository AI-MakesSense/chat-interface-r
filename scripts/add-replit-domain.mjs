import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const licenseKey = '080bb4106dc3cd41d3550db57e11a177';

  // Check current license
  const licenses = await sql`SELECT id, license_key, domains, tier FROM licenses WHERE license_key = ${licenseKey}`;
  console.log('Current license:', JSON.stringify(licenses, null, 2));

  if (licenses.length > 0) {
    const license = licenses[0];
    const currentDomains = license.domains || [];

    // Add replit.dev if not already there
    if (!currentDomains.includes('replit.dev')) {
      const newDomains = [...currentDomains, 'replit.dev'];

      await sql`UPDATE licenses SET domains = ${newDomains} WHERE license_key = ${licenseKey}`;
      console.log('Updated domains to:', newDomains);
    } else {
      console.log('replit.dev already in domains');
    }
  }
}

main().catch(console.error);
