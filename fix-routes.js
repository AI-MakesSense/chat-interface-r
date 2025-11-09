const fs = require('fs');
const path = require('path');

// Fix route.ts to handle both userId and sub
const routeFile = 'app/api/licenses/route.ts';
let content = fs.readFileSync(routeFile, 'utf8');

// Replace the authentication handling
content = content.replace(
  /const user = await requireAuth\(request\);\s*\n\s*const userId = user\.sub;/g,
  `const user = await requireAuth(request) as any;
    const userId = user.userId || user.sub; // Support both test mock and real JWT`
);

fs.writeFileSync(routeFile, content, 'utf8');
console.log('Updated route.ts');

// Fix [id]/route.ts
const updateFile = 'app/api/licenses/[id]/route.ts';
content = fs.readFileSync(updateFile, 'utf8');

// Replace the authentication handling
content = content.replace(
  /const user = await requireAuth\(request\);\s*\n\s*const userId = user\.sub;/g,
  `const user = await requireAuth(request) as any;
    const userId = user.userId || user.sub; // Support both test mock and real JWT`
);

fs.writeFileSync(updateFile, content, 'utf8');
console.log('Updated [id]/route.ts');

console.log('Done!');
