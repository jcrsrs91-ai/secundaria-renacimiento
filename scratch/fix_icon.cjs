const fs = require('fs');

let content = fs.readFileSync('src/components/BecasReport.jsx', 'utf8');

// Use User instead of UserRound to ensure compatibility with all lucide-react versions
content = content.replace(
  "import { Printer, X, GraduationCap, Users, UserRound, Award } from 'lucide-react';",
  "import { Printer, X, GraduationCap, Users, User, Award } from 'lucide-react';"
);

content = content.replace(/<UserRound size=\{32\} \/>/g, "<User size={32} />");

fs.writeFileSync('src/components/BecasReport.jsx', content, 'utf8');
console.log('Replaced UserRound with User');
