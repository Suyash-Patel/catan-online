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
  fs.writeFileSync(f, content);
});
console.log('Fixed server files');
