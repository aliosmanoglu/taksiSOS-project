const fs = require('fs');
const file = 'app/index.tsx';
let code = fs.readFileSync(file, 'utf8');
const top = fs.readFileSync('patch-top.txt', 'utf8');
const marker = "const [followMode, setFollowMode] = useState<'none' | 'me' | 'sos'>('none');";
const parts = code.split(marker);
if (parts.length > 1) {
  fs.writeFileSync(file, top + '\n  ' + marker + parts[1]);
  console.log('Fixed syntax error');
} else {
  console.log('Marker not found');
}
