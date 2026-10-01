const usedCodes=new Set();
const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function rand(n){let s='';for(let i=0;i<n;i++)s+=letters[Math.floor(Math.random()*26)];return s;}
function generateUniqueCode(prefix=''){
 prefix=String(prefix).replace(/[^A-Za-z]/g,'').toUpperCase().slice(0,4);
 let c; do{c=prefix+rand(5-prefix.length)}while(usedCodes.has(c));
 usedCodes.add(c); return c;
}
function generateUniqueName(prefix='TEST'){return `${prefix}_${rand(8)}`;}
module.exports={generateUniqueCode,generateUniqueName};