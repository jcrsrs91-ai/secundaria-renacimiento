const fs = require('fs');

const path = 'src/pages/Login.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import { useNavigate } from 'react-router-dom';",
  "import { useNavigate, Link } from 'react-router-dom';"
);

c = c.replace(
  `                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  `                </button>
              </form>
            </div>
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center flex flex-col gap-2">
              <Link to="/registro-staff" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                ¿Fuiste invitado? Crea tu contraseña aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>`
);

fs.writeFileSync(path, c);
