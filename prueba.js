const express = require('express');
const soap = require('soap');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Configura la cadena de conexión
const connectionString = process.env.DATABASE_URL 
let users = [];

const pool = new Pool({
  connectionString: connectionString
});

// Define el servicio web
const service = {
  UserService: {
    UserPort: {
      GetUsers: (args, callback) => {
        // Envuelve la consulta a la base de datos en una promesa
        queryDatabase()
          .then(() => {
            // Una vez que la consulta se haya completado, genera la respuesta SOAP
            const response = {
              GetUsersResponse: {
                users: {
                  user: users
                }
              }
            };
            callback(null, response);
          })
          .catch((error) => {
            console.error(error);
            callback({ faultcode: 'Server', faultstring: 'Error al consultar la base de datos' });
          });
      }
    }
  }
};

// Función para realizar la consulta a la base de datos y llenar el arreglo de usuarios
function queryDatabase() {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM api_user', (error, results) => {
      if (error) {
        reject(error);
      } else {
        users = results.rows;
        resolve();
      }
    });
  });
}

// Define la ubicación del archivo WSDL
const wsdl = require('fs').readFileSync("user.wsdl", 'utf8');

// Crear el servidor SOAP
app.listen(port, () => {
  console.log(`Servidor SOAP expuesto en http://localhost:${port}/users?wsdl`);
});
soap.listen(app, '/users', service, wsdl);
