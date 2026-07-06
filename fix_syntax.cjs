const fs = require('fs');

let file = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

// The file currently has:
//               </div> (closes grid)
//            </div> (closes space-y-8, BUT wait, I replaced this before!)
//            
//              {/* 6. Boleta de Calificaciones (Solo Lectura) */}
//              <div className="bg-white...
//              ...
//              </div>
//            </div> (this was supposed to be the one closing space-y-8 but now it's just dangling or closing something else)
//          )}
//        </div>

// Let's just fix it by wrapping the two sibling elements in a Fragment.
// The parenthesis starts at:
//           ) : (
//             <div className="space-y-8">
// Let's replace `<div className="space-y-8">` with `<><div className="space-y-8">`
// And replace `)}` with `</>)}`

// Let's check if we can do this.
file = file.replace(
  '          ) : (\r\n            <div className="space-y-8">',
  '          ) : (\r\n            <>\r\n            <div className="space-y-8">'
);

if (file.indexOf('<><div className="space-y-8">') === -1 && file.indexOf('<>\r\n            <div') === -1) {
    // Try LF
    file = file.replace(
      '          ) : (\n            <div className="space-y-8">',
      '          ) : (\n            <>\n            <div className="space-y-8">'
    );
}

// Now replace `)}` that corresponds to the end of the ternary.
// In the current file, it looks like:
//               </div>
//             </div>
//           )}
//         </div>

file = file.replace(
  '            </div>\r\n          )}',
  '            </div>\r\n            </>\r\n          )}'
);

if (file.indexOf('</>\r\n          )}') === -1) {
    file = file.replace(
      '            </div>\n          )}',
      '            </div>\n            </>\n          )}'
    );
}

fs.writeFileSync('src/components/HojaDeVida.jsx', file);
console.log('Fixed syntax error in HojaDeVida.');
