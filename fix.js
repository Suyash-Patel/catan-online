const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('server/src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/from '\.\.\/types\//g, "from '@catan/shared/types/");
  content = content.replace(/from '\.\.\/\.\.\/types\//g, "from '@catan/shared/types/");
  content = content.replace(/from '\.\.\/constants\//g, "from '@catan/shared/constants/");
  content = content.replace(/from '\.\.\/\.\.\/constants\//g, "from '@catan/shared/constants/");
  content = content.replace(/from '\.\.\/hex\//g, "from '@catan/shared/hex/");
  content = content.replace(/from '\.\.\/\.\.\/hex\//g, "from '@catan/shared/hex/");
  content = content.replace(/\bplayers\.map\(p =>/g, "players.map((p: any) =>");
  content = content.replace(/\bplayers\.find\(p =>/g, "players.find((p: any) =>");
  content = content.replace(/\bplayers\.filter\(p =>/g, "players.filter((p: any) =>");
  content = content.replace(/\bplayers\.every\(p =>/g, "players.every((p: any) =>");
  
  // Generic arrays replacements for strict type checks
  content = content.replace(/\.reduce\(\(a, b\) =>/g, ".reduce((a: any, b: any) =>");
  content = content.replace(/\.reduce\(\(sum, count\) =>/g, ".reduce((sum: number, count: number) =>");
  content = content.replace(/\.filter\(c =>/g, ".filter((c: any) =>");
  content = content.replace(/\.find\(c =>/g, ".find((c: any) =>");
  content = content.replace(/\.map\(c =>/g, ".map((c: any) =>");
  
  content = content.replace(/\.filter\(p =>/g, ".filter((p: any) =>");
  content = content.replace(/\.find\(p =>/g, ".find((p: any) =>");
  content = content.replace(/\.map\(p =>/g, ".map((p: any) =>");
  
  content = content.replace(/\.filter\(v =>/g, ".filter((v: any) =>");
  content = content.replace(/\.find\(v =>/g, ".find((v: any) =>");
  content = content.replace(/\.map\(v =>/g, ".map((v: any) =>");
  
  content = content.replace(/\.filter\(port =>/g, ".filter((port: any) =>");
  content = content.replace(/\.find\(port =>/g, ".find((port: any) =>");
  content = content.replace(/\.map\(port =>/g, ".map((port: any) =>");
  
  content = content.replace(/\.filter\(vKey =>/g, ".filter((vKey: any) =>");
  content = content.replace(/\.find\(vKey =>/g, ".find((vKey: any) =>");
  content = content.replace(/\.map\(vKey =>/g, ".map((vKey: any) =>");
  
  fs.writeFileSync(f, content);
});
console.log('Fixed server files');

