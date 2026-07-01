const http = require('http');
const readline = require('readline');

const BACKEND_BASE = 'http://192.168.100.7:8080/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Pergunta e-mail e senha interativamente
rl.question('Digite seu e-mail: ', (email) => {
  rl.question('Digite sua senha: ', (senha) => {
    rl.close();
    realizarLogin(email, senha);
  });
});

function realizarLogin(email, senha) {
  const postData = JSON.stringify({
    email: email.trim(),
    senha: senha
  });

  const url = new URL(`${BACKEND_BASE}/auth/login`);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('\nAutenticando...');

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.token) {
          console.log('Login efetuado com sucesso!');
          buscarPatrimonios(response.token);
        } else {
          console.log('Erro de autenticação: Credenciais incorretas.');
        }
      } catch (e) {
        console.log('Erro ao processar login:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Erro de conexão ao autenticar:', e.message);
  });

  req.write(postData);
  req.end();
}

function buscarPatrimonios(token) {
  console.log('Buscando patrimônios ativos no backend...');

  const url = new URL(`${BACKEND_BASE}/patrimonio`);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  http.get(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        let patrimonios = JSON.parse(data);
        let lista = Array.isArray(patrimonios) ? patrimonios : (patrimonios.content || []);

        if (!Array.isArray(lista)) {
          console.log('Resposta inesperada da API:', patrimonios);
          return;
        }

        const ativos = lista.filter(p => p.habilitado !== false && p.status !== 'INATIVO');

        if (ativos.length === 0) {
          console.log('Nenhum patrimônio ativo encontrado.');
          return;
        }

        console.log(`\n=== Encontrados ${ativos.length} patrimônios ativos ===\n`);
        ativos.forEach((pat, index) => {
          console.log(`${index + 1}. Código: ${pat.codigoPatrimonio} | Material: ${pat.material?.nome || 'Desconhecido'} | Local: ${pat.local?.nome || 'Sem local'}`);
        });

        console.log('\n------------------------------------------------------------');
        console.log('Para ver e testar o QR Code de um patrimônio no seu navegador:');
        console.log('http://192.168.100.7:8080/qrcodes/<codigo>.png');
        console.log('Exemplo: http://192.168.100.7:8080/qrcodes/PAT-000043.png');
        console.log('------------------------------------------------------------\n');

      } catch (e) {
        console.log('Erro ao processar dados:', e.message);
      }
    });
  }).on('error', (err) => {
    console.log('Erro ao conectar ao backend:', err.message);
  });
}
